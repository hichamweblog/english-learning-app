import fs from 'node:fs';
import path from 'node:path';

const ALIGNMENTS_DIR = path.resolve('public/data/alignments');
const REQUIRED_ENGINE = 'faster-whisper-base.en';

let errors = 0;
let checked = 0;

function fail(file, message) {
  console.error(`❌ ${path.relative(process.cwd(), file)}: ${message}`);
  errors++;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateWord(file, word, paragraphIndex, wordIndex) {
  if (!word || typeof word !== 'object') {
    fail(file, `paragraph ${paragraphIndex + 1}, word ${wordIndex + 1} is not an object`);
    return;
  }

  for (const field of ['id', 'text']) {
    if (typeof word[field] !== 'string' || word[field].trim() === '') {
      fail(file, `paragraph ${paragraphIndex + 1}, word ${wordIndex + 1} has no ${field}`);
    }
  }

  if (!isFiniteNumber(word.start) || !isFiniteNumber(word.end)) {
    fail(file, `paragraph ${paragraphIndex + 1}, word ${wordIndex + 1} has invalid timestamps`);
  } else if (word.start < 0 || word.end < word.start) {
    fail(file, `paragraph ${paragraphIndex + 1}, word ${wordIndex + 1} has reversed timestamps`);
  }
}

function validateAlignment(file, alignment) {
  if (!alignment || typeof alignment !== 'object') {
    fail(file, 'root value is not an object');
    return;
  }

  for (const field of ['sectionId', 'audioPath', 'engine']) {
    if (typeof alignment[field] !== 'string' || alignment[field].trim() === '') {
      fail(file, `missing ${field}`);
    }
  }

  if (alignment.engine !== REQUIRED_ENGINE) {
    fail(file, `unexpected engine: ${alignment.engine ?? '(missing)'}`);
  }

  if (!isFiniteNumber(alignment.totalDuration) || alignment.totalDuration <= 0) {
    fail(file, 'totalDuration must be a positive number');
  }

  if (!Array.isArray(alignment.paragraphs) || alignment.paragraphs.length === 0) {
    fail(file, 'paragraphs must be a non-empty array');
    return;
  }

  let previousParagraphEnd = 0;
  for (const [paragraphIndex, paragraph] of alignment.paragraphs.entries()) {
    if (!paragraph || typeof paragraph !== 'object') {
      fail(file, `paragraph ${paragraphIndex + 1} is not an object`);
      continue;
    }

    if (typeof paragraph.id !== 'string' || !paragraph.id.trim()) {
      fail(file, `paragraph ${paragraphIndex + 1} has no id`);
    }
    if (typeof paragraph.text !== 'string' || !paragraph.text.trim()) {
      fail(file, `paragraph ${paragraphIndex + 1} has no text`);
    }
    if (!isFiniteNumber(paragraph.start) || !isFiniteNumber(paragraph.end)) {
      fail(file, `paragraph ${paragraphIndex + 1} has invalid timestamps`);
    } else if (paragraph.start < 0 || paragraph.end < paragraph.start) {
      fail(file, `paragraph ${paragraphIndex + 1} has reversed timestamps`);
    } else if (paragraph.start + 0.5 < previousParagraphEnd) {
      fail(file, `paragraph ${paragraphIndex + 1} overlaps the previous paragraph`);
    }
    previousParagraphEnd = Math.max(previousParagraphEnd, paragraph.end || 0);

    if (!Array.isArray(paragraph.words) || paragraph.words.length === 0) {
      fail(file, `paragraph ${paragraphIndex + 1} has no words`);
      continue;
    }

    let previousWordEnd = Number.NEGATIVE_INFINITY;
    for (const [wordIndex, word] of paragraph.words.entries()) {
      validateWord(file, word, paragraphIndex, wordIndex);
      if (isFiniteNumber(word?.start) && isFiniteNumber(word?.end)) {
        if (word.start + 0.25 < previousWordEnd) {
          fail(file, `paragraph ${paragraphIndex + 1}, word ${wordIndex + 1} overlaps the previous word`);
        }
        if (word.end > alignment.totalDuration + 1) {
          fail(file, `paragraph ${paragraphIndex + 1}, word ${wordIndex + 1} exceeds totalDuration`);
        }
        previousWordEnd = Math.max(previousWordEnd, word.end);
      }
    }
  }
}

function walk(directory) {
  if (!fs.existsSync(directory)) {
    throw new Error(`alignment directory not found: ${path.relative(process.cwd(), directory)}`);
  }
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(entryPath);
    return entry.isFile() && entry.name.endsWith('.json') ? [entryPath] : [];
  });
}

const files = walk(ALIGNMENTS_DIR);
if (files.length === 0) {
  console.error(`❌ No alignment JSON files found under ${path.relative(process.cwd(), ALIGNMENTS_DIR)}.`);
  process.exit(1);
}

const podcastIds = new Map();
for (const file of files) {
  try {
    const alignment = JSON.parse(fs.readFileSync(file, 'utf8'));
    validateAlignment(file, alignment);

    const relativePath = path.relative(ALIGNMENTS_DIR, file).split(path.sep);
    if (relativePath[0] === 'podcasts' && relativePath.length === 3) {
      const key = `${relativePath[1]}/${alignment.sectionId}`;
      const existing = podcastIds.get(key);
      if (existing && JSON.stringify(existing.alignment) !== JSON.stringify(alignment)) {
        fail(file, `conflicts with another alias for ${key}: ${path.relative(process.cwd(), existing.file)}`);
      } else if (!existing) {
        podcastIds.set(key, { file, alignment });
      }
    }
    checked++;
  } catch (error) {
    fail(file, `malformed JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`Checked ${checked} alignment JSON files.`);
if (errors > 0) {
  console.error(`Alignment validation failed with ${errors} error(s).`);
  process.exit(1);
}
console.log('Alignment validation passed without modifying source files.');
