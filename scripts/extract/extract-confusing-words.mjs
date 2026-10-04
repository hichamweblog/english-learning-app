import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const PDF_PATH = path.join(MATERIALS_DIR, '600 Confusing-English-Words-Explained.pdf');

const OUT_FILE = path.resolve('public/data/extracted/books/confusing-words-600.json');
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

console.log('Extracting 600 Confusing English Words Explained...');
const rawPdfText = execSync(`pdftotext "${PDF_PATH}" -`, { maxBuffer: 30 * 1024 * 1024 }).toString();

const normText = normalizeTypography(rawPdfText)
  .replace(/www\.EspressoEnglish\.net/gi, '')
  .replace(/Page\s*\|\s*\d+/gi, '')
  .replace(/\f/g, '\n\n');

const bodyStartIdx = normText.indexOf('Use one when the number is important');
const tocStartIdx = normText.indexOf('Table of Contents');

const tocText = normText.substring(tocStartIdx, bodyStartIdx);
const tocList = [...tocText.matchAll(/([a-z0-9' -]+(?:\s*\/\s*[a-z0-9' -]+)+)/gi)]
  .map(m => m[1].toLowerCase().replace(/\s+/g, ' ').trim());
const tocSet = new Set(tocList);

const lines = normText.substring(bodyStartIdx - 50).split('\n');
const entries = [];
let currentEntry = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const normLine = line.toLowerCase().replace(/\s+/g, ' ');
  if (tocSet.has(normLine)) {
    if (currentEntry) entries.push(currentEntry);
    currentEntry = {
      title: line,
      words: line.split(/\s*\/\s*/).map(w => w.trim()),
      contentLines: []
    };
  } else if (currentEntry) {
    currentEntry.contentLines.push(line);
  }
}
if (currentEntry) entries.push(currentEntry);

const processedEntries = entries.map((e, idx) => {
  const content = e.contentLines.join('\n').trim();
  const examples = e.contentLines
    .filter(l => l.startsWith('•') || l.startsWith('') || l.startsWith('-'))
    .map(l => l.replace(/^[•-]\s*/, '').trim());

  return {
    id: `confusing-${String(idx + 1).padStart(3, '0')}`,
    entryNumber: idx + 1,
    title: e.title,
    words: e.words,
    explanation: content,
    examples,
    wordCount: content.split(/\s+/).filter(Boolean).length
  };
});

const masterBook = {
  id: 'book-600-confusing-words',
  title: '600 Confusing English Words Explained',
  author: 'Shayna Oliveira',
  totalEntries: processedEntries.length,
  entries: processedEntries
};

fs.writeFileSync(OUT_FILE, JSON.stringify(masterBook, null, 2), 'utf-8');
console.log(`Successfully extracted ${processedEntries.length} word comparison sets to ${OUT_FILE}`);
