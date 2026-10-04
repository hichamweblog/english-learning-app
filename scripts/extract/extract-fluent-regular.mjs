import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography, cleanLine } from './cleaners.mjs';

function stripWatermarks(str) {
  if (!str) return '';
  return str
    .replace(/www\.china232\.com/gi, '')
    .replace(/china232/gi, '')
    .replace(/copyright\s*©?[^\n]+/gi, '')
    .trim();
}

function cleanExtractedText(raw) {
  return normalizeTypography(raw)
    .replace(/\f/g, '\n\n')
    .replace(/www\.china232\.com/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const PDF_PATH = path.join(MATERIALS_DIR, 'Speak.Fluent.English china232/01Fluent.English/Fluent English PDF.pdf');
const AUDIO_DIR = path.join(MATERIALS_DIR, 'Speak.Fluent.English china232/01Fluent.English');

const OUT_DIR = path.resolve('public/data/extracted/fluent');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/fluent');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

console.log('Extracting text from Speak Fluent English PDF with layout...');
const rawPdfText = execSync(`pdftotext -layout "${PDF_PATH}" -`, { maxBuffer: 30 * 1024 * 1024 }).toString();

// Match LESSON <number>: <title> or LESSON <number> – <title>
const re = /LESSON\s+(\d+)\s*[:–-]\s*([^\n\r]+)/gi;
let match;
const lessonBlocks = [];
while ((match = re.exec(rawPdfText)) !== null) {
  lessonBlocks.push({
    num: parseInt(match[1], 10),
    title: match[2].trim(),
    start: match.index
  });
}

// Sort by lesson number
lessonBlocks.sort((a, b) => a.num - b.num);

// Map audio files
const audioFiles = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'));
const audioMap = new Map();
for (const file of audioFiles) {
  const m = file.match(/^(\d+)/);
  if (m) {
    const num = parseInt(m[1], 10);
    audioMap.set(num, `materials/Speak.Fluent.English china232/01Fluent.English/${file}`);
  }
}

function parseVocabSection(lines) {
  const vocab = [];
  let currentItem = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.length > 500) continue;

    // Check for term - definition pattern
    const termMatch = trimmed.match(/^["“]?([^"”–—:-]{2,40})["”]?\s*[–—:-]\s*(.+)$/i);
    if (termMatch && !/^(ex|example|note|e\.g\.)/i.test(termMatch[1])) {
      if (currentItem) vocab.push(currentItem);
      currentItem = {
        term: termMatch[1].trim(),
        definition: termMatch[2].trim(),
        examples: []
      };
      continue;
    }

    // Check for example sentence
    if (currentItem) {
      if (/^(?:ex|example|e\.g\.)\s*[:.-]?\s*(.+)/i.test(trimmed)) {
        const exText = trimmed.replace(/^(?:ex|example|e\.g\.)\s*[:.-]?\s*/i, '').trim();
        if (exText) currentItem.examples.push(exText);
      } else if (trimmed.startsWith('“') || trimmed.startsWith('"') || /^[A-Z][^:]+[.!?]$/.test(trimmed)) {
        if (currentItem.examples.length < 4 && trimmed.length < 200) {
          currentItem.examples.push(trimmed);
        }
      } else if (!currentItem.definition.endsWith('.')) {
        currentItem.definition += ' ' + trimmed;
      }
    }
  }

  if (currentItem) vocab.push(currentItem);
  return vocab;
}

function parseDialogue(lines) {
  const turns = [];
  let currentSpeaker = null;
  let currentSpeech = [];

  const speakerWithColon = /^([A-Z][a-z]+|[AB]|Add|And)\s*:\s*(.+)$/i;
  const speakerTabular = /^\s{0,8}([A-Z][a-z]+|[AB]|Add|And)\s{2,}(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const matchColon = trimmed.match(speakerWithColon);
    const matchTab = line.match(speakerTabular);

    if (matchColon) {
      if (currentSpeaker && currentSpeech.length > 0) {
        turns.push({ speaker: currentSpeaker, text: currentSpeech.join(' ').trim() });
      }
      currentSpeaker = matchColon[1].trim();
      if (currentSpeaker.toLowerCase() === 'add') currentSpeaker = 'Addison';
      if (currentSpeaker.toLowerCase() === 'and') currentSpeaker = 'Andrew';
      currentSpeech = [matchColon[2].trim()];
    } else if (matchTab && !/^(lesson|reading|we are|dialogue|conversation)/i.test(matchTab[1])) {
      if (currentSpeaker && currentSpeech.length > 0) {
        turns.push({ speaker: currentSpeaker, text: currentSpeech.join(' ').trim() });
      }
      currentSpeaker = matchTab[1].trim();
      if (currentSpeaker.toLowerCase() === 'add') currentSpeaker = 'Addison';
      if (currentSpeaker.toLowerCase() === 'and') currentSpeaker = 'Andrew';
      currentSpeech = [matchTab[2].trim()];
    } else if (currentSpeaker && /^\s{10,}(.+)$/.test(line)) {
      currentSpeech.push(trimmed);
    } else if (currentSpeaker) {
      currentSpeech.push(trimmed);
    } else {
      turns.push({ speaker: 'Narrator', text: trimmed });
    }
  }

  if (currentSpeaker && currentSpeech.length > 0) {
    turns.push({ speaker: currentSpeaker, text: currentSpeech.join(' ').trim() });
  }

  return turns;
}

const masterIndex = [];
let totalExtracted = 0;

for (let i = 0; i < lessonBlocks.length; i++) {
  const current = lessonBlocks[i];
  const nextStart = (i + 1 < lessonBlocks.length) ? lessonBlocks[i + 1].start : rawPdfText.length;
  const rawLessonText = rawPdfText.substring(current.start, nextStart).trim();

  const lines = rawLessonText.split('\n').map(l => stripWatermarks(l).trim()).filter(Boolean);

  // Separate dialogue / text from vocabulary
  let vocabStartIdx = -1;
  for (let j = 1; j < lines.length; j++) {
    const l = lines[j];
    if (/(?:key (?:vocabulary|phrases)|phrases and vocabulary used|examples and phrases that we discussed)/i.test(l)) {
      vocabStartIdx = j;
      break;
    }
  }

  let dialogueLines = [];
  let vocabLines = [];
  if (vocabStartIdx > 0) {
    dialogueLines = lines.slice(1, vocabStartIdx);
    vocabLines = lines.slice(vocabStartIdx + 1);
  } else {
    dialogueLines = lines.slice(1);
  }

  const dialogue = parseDialogue(dialogueLines);
  const vocabulary = parseVocabSection(vocabLines);

  const cleanFullText = cleanExtractedText(rawLessonText);

  // Identify useful multi-word phrases and idioms
  const usefulPhrases = vocabulary
    .filter(v => v.term.includes(' ') || /idiom|phrase|slang|expression/i.test(v.definition))
    .map(v => ({ phrase: v.term, meaning: v.definition, example: v.examples[0] || '' }));

  const audioPath = audioMap.get(current.num) || null;
  const padded = String(current.num).padStart(3, '0');
  const lessonId = `fluent-${padded}`;

  const lessonRecord = {
    id: lessonId,
    lessonNumber: current.num,
    title: current.title,
    trackType: 'fluent-english',
    level: 'intermediate',
    levelLabel: 'Intermediate to Advanced',
    audioPath,
    hasAudio: !!audioPath,
    dialogue,
    dialogueText: dialogue.map(d => `${d.speaker}: ${d.text}`).join('\n\n'),
    vocabulary,
    usefulPhrases,
    transcript: {
      fullText: cleanFullText,
      wordCount: cleanFullText.split(/\s+/).filter(Boolean).length
    }
  };

  // Write standalone .txt transcript
  const txtPath = path.join(TXT_DIR, `lesson-${padded}.txt`);
  fs.writeFileSync(txtPath, cleanFullText, 'utf-8');

  // Write structured JSON
  const jsonPath = path.join(OUT_DIR, `lesson-${padded}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(lessonRecord, null, 2), 'utf-8');

  masterIndex.push({
    id: lessonId,
    lessonNumber: current.num,
    title: current.title,
    audioPath,
    hasAudio: !!audioPath,
    vocabCount: vocabulary.length,
    usefulPhrasesCount: usefulPhrases.length,
    wordCount: lessonRecord.transcript.wordCount
  });

  totalExtracted++;
}

// Write master index
fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(masterIndex, null, 2), 'utf-8');
console.log(`Successfully extracted ${totalExtracted}/100 Speak Fluent English lessons with master index & transcripts.`);
