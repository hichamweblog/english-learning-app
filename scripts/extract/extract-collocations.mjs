import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography, cleanLine } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const PDF_PATH = path.join(MATERIALS_DIR, '1000 English Collocations. in 10 Minutes a Day .pdf');

const OUT_FILE = path.resolve('public/data/extracted/books/collocations-1000.json');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/books/collocations-1000');

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

console.log('Extracting 1000 English Collocations in 10 Minutes a Day...');
const rawPdfText = execSync(`pdftotext "${PDF_PATH}" -`, { maxBuffer: 30 * 1024 * 1024 }).toString();

// Match 50 lessons
const re = /Lesson\s+(\d+)\s*[–—:-]\s*([^\n\r]+)/gi;
let m;
const lessons = [];
const seen = new Set();
while ((m = re.exec(rawPdfText)) !== null) {
  const num = parseInt(m[1], 10);
  const title = m[2].trim();
  if (!seen.has(num) && num >= 1 && num <= 50) {
    seen.add(num);
    lessons.push({ num, title, start: m.index });
  }
}

lessons.sort((a, b) => a.num - b.num);

// Parse answer key at end of book
const answersStart = rawPdfText.lastIndexOf('Answers');
const answersText = answersStart > 0 ? rawPdfText.substring(answersStart) : '';

const parsedLessons = [];
let totalCollocations = 0;

for (let i = 0; i < lessons.length; i++) {
  const cur = lessons[i];
  const nextStart = (i + 1 < lessons.length) ? lessons[i + 1].start : (answersStart > 0 ? answersStart : rawPdfText.length);
  const rawLesson = rawPdfText.substring(cur.start, nextStart).trim();

  // Split lesson text and quiz
  const quizIdx = rawLesson.search(/(?:^|\n)\s*Quiz\b/i);
  let lessonBody = '';
  let quizBody = '';

  if (quizIdx > 0) {
    lessonBody = rawLesson.substring(0, quizIdx).trim();
    quizBody = rawLesson.substring(quizIdx).trim();
  } else {
    lessonBody = rawLesson;
  }

  // Clean watermarks
  const cleanBody = normalizeTypography(lessonBody)
    .replace(/www\.espressoenglish\.net[^\n]*/gi, '')
    .replace(/\d+\s*\|\s*P\s*a\s*g\s*e/gi, '')
    .replace(/\f/g, '\n\n')
    .trim();

  const cleanQuiz = normalizeTypography(quizBody)
    .replace(/www\.espressoenglish\.net[^\n]*/gi, '')
    .replace(/\d+\s*\|\s*P\s*a\s*g\s*e/gi, '')
    .replace(/\f/g, '\n\n')
    .trim();

  // Extract collocations highlighted or described
  // Patterns like: "term – definition" or bullet points " term"
  const collocations = [];
  const lines = cleanBody.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Check for dash definition: "close-knit family – these expressions refer to..."
    const dashMatch = line.match(/^([a-zA-Z\s'/()-]{3,35})\s*[–—]\s*(.+)$/);
    if (dashMatch && !/^(lesson|quiz|note)/i.test(dashMatch[1])) {
      collocations.push({
        collocation: dashMatch[1].trim(),
        context: dashMatch[2].trim()
      });
    }
  }

  const padded = String(cur.num).padStart(2, '0');
  const txtPath = path.join(TXT_DIR, `lesson-${padded}.txt`);
  fs.writeFileSync(txtPath, `${cleanBody}\n\n${cleanQuiz}`.trim(), 'utf-8');

  totalCollocations += collocations.length;

  parsedLessons.push({
    id: `colloc-lesson-${padded}`,
    lessonNumber: cur.num,
    title: cur.title,
    content: cleanBody,
    quiz: cleanQuiz,
    collocations,
    collocationsCount: collocations.length,
    wordCount: cleanBody.split(/\s+/).filter(Boolean).length
  });
}

const masterBook = {
  id: 'book-1000-collocations',
  title: '1000 English Collocations in 10 Minutes a Day',
  author: 'Shayna Oliveira',
  totalLessons: parsedLessons.length,
  lessons: parsedLessons
};

fs.writeFileSync(OUT_FILE, JSON.stringify(masterBook, null, 2), 'utf-8');
console.log(`Successfully extracted ${parsedLessons.length}/50 lessons for 1000 English Collocations to ${OUT_FILE}`);
