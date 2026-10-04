import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const PDF_PATH = path.join(MATERIALS_DIR, 'Practice Makes Perfect. English Conversation_2016, 2nd, 176p.pdf');

const OUT_FILE = path.resolve('public/data/extracted/books/english-conversation-pmp.json');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/books/pmp-conversation');

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

console.log('Extracting Practice Makes Perfect: English Conversation...');
const rawPdfText = execSync(`pdftotext "${PDF_PATH}" -`, { maxBuffer: 30 * 1024 * 1024 }).toString();

const regex = /(?:^|\f|\n)\s*·\s*(\d+)\s*·\s*\n\s*([^\n\r]+)/gi;
let m;
const chapterMatches = [];
while ((m = regex.exec(rawPdfText)) !== null) {
  chapterMatches.push({
    num: parseInt(m[1], 10),
    titleHint: m[2].trim(),
    start: m.index
  });
}

// Chapter titles from TOC
const chapterTitles = [
  'Introducing yourself and others',
  'Expressing opinions, likes, and dislikes',
  'Describing people, places, and things',
  'Striking up a conversation',
  'Making dates and appointments',
  'Expressing wants and needs',
  'Making requests and offers',
  'Expressing doubts and uncertainty',
  'Talking about future events',
  'Making a case or arguing a point',
  'Narrating a story',
  'Retelling a conversation',
  'Electronic conversation'
];

const answerKeyStart = rawPdfText.lastIndexOf('Answer key');
const parsedChapters = [];

for (let i = 0; i < chapterMatches.length; i++) {
  const cur = chapterMatches[i];
  const nextStart = (i + 1 < chapterMatches.length)
    ? chapterMatches[i + 1].start
    : (answerKeyStart > 0 ? answerKeyStart : rawPdfText.length);

  const rawChunk = rawPdfText.substring(cur.start, nextStart).trim();

  // Extract opening conversation
  const convMatch = rawChunk.match(/Conversation[^\n]*\n([\s\S]*?)(?=(?:Improving your conversation|Expressions|Key vocabulary|EXERCISE|·\s*\d+\s*·|$))/i);
  let conversationText = '';
  let turns = [];

  if (convMatch) {
    conversationText = convMatch[1].trim();
    const lines = conversationText.split('\n').map(l => l.trim()).filter(Boolean);
    let currentSpeaker = null;
    let currentSpeech = [];

    for (const line of lines) {
      const spkMatch = line.match(/^([A-Za-z]+)\s*:\s*(.+)$/);
      if (spkMatch) {
        if (currentSpeaker && currentSpeech.length > 0) {
          turns.push({ speaker: currentSpeaker, text: currentSpeech.join(' ').trim() });
        }
        currentSpeaker = spkMatch[1].trim();
        currentSpeech = [spkMatch[2].trim()];
      } else if (currentSpeaker) {
        currentSpeech.push(line);
      }
    }
    if (currentSpeaker && currentSpeech.length > 0) {
      turns.push({ speaker: currentSpeaker, text: currentSpeech.join(' ').trim() });
    }
  }

  // Extract exercise headers
  const exerciseMatches = [...rawChunk.matchAll(/EXERCISE\s+([\d.-]+)[^\n]*/gi)];
  const exercises = exerciseMatches.map(em => em[0].trim());

  const cleanFull = normalizeTypography(rawChunk)
    .replace(/\f/g, '\n\n')
    .replace(/PRACTICE MAKES PERFECT[^\n]*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const padded = String(cur.num).padStart(2, '0');
  const txtPath = path.join(TXT_DIR, `ch-${padded}.txt`);
  fs.writeFileSync(txtPath, cleanFull, 'utf-8');

  parsedChapters.push({
    id: `pmp-conv-ch-${padded}`,
    chapterNumber: cur.num,
    title: chapterTitles[cur.num - 1] || cur.titleHint,
    openingConversation: {
      raw: conversationText,
      turns
    },
    exercisesCount: exercises.length,
    exercises,
    transcript: {
      fullText: cleanFull,
      wordCount: cleanFull.split(/\s+/).filter(Boolean).length
    }
  });
}

const masterBook = {
  id: 'book-pmp-english-conversation',
  title: 'Practice Makes Perfect: English Conversation (2nd Edition)',
  author: 'Jean Yates, PhD',
  publisher: 'McGraw-Hill Education',
  totalChapters: parsedChapters.length,
  chapters: parsedChapters
};

fs.writeFileSync(OUT_FILE, JSON.stringify(masterBook, null, 2), 'utf-8');
console.log(`Successfully extracted ${parsedChapters.length}/13 chapters for Practice Makes Perfect English Conversation to ${OUT_FILE}`);
