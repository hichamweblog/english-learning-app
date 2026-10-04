import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const OUT_DIR = path.resolve('public/data/extracted/books');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/books');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

const pdfPath = path.join(MATERIALS_DIR, 'Perfect Phrases for ESL Everyday Situations.pdf');

if (!fs.existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  process.exit(1);
}

const rawText = execSync(`pdftotext "${pdfPath}" - 2>/dev/null`).toString();
const pages = rawText.split('\f');

const chaptersMeta = [
  { num: 1, title: 'Babysitters, Day Care & Early Learning', start: 17, end: 32 },
  { num: 2, title: 'Elementary & High School Situations', start: 33, end: 44 },
  { num: 3, title: 'Furthering Your Own Adult Education', start: 45, end: 52 },
  { num: 4, title: 'Language Training Opportunities', start: 53, end: 60 },
  { num: 5, title: 'Medical Appointments & Describing Symptoms', start: 67, end: 78 },
  { num: 6, title: 'Dental Care & Dental Appointments', start: 79, end: 88 },
  { num: 7, title: 'Emergency Room, Hospital & 9-1-1 Care', start: 89, end: 98 },
  { num: 8, title: 'The Pharmacy & Prescriptions', start: 99, end: 108 },
  { num: 9, title: 'First Responders: Fire & Police Departments', start: 115, end: 124 },
  { num: 10, title: 'The Post Office & Mail Services', start: 125, end: 130 },
  { num: 11, title: 'The Bank & Financial Transactions', start: 131, end: 136 },
  { num: 12, title: 'The Library & Community Programs', start: 137, end: 144 },
  { num: 13, title: 'Getting Around: Directions & Parking', start: 149, end: 154 },
  { num: 14, title: 'Gas & Auto Service Stations', start: 155, end: 162 },
  { num: 15, title: 'The Supermarket & Grocery Shopping', start: 163, end: 170 },
  { num: 16, title: 'Shopping, Dry Cleaners, Hair Salons & Movies', start: 171, end: 180 },
  { num: 17, title: 'Becoming an Active English Learner', start: 181, end: 195 }
];

const chapters = [];
const bookTxtDir = path.join(TXT_DIR, 'perfect-phrases-everyday-situations');
fs.mkdirSync(bookTxtDir, { recursive: true });

for (const c of chaptersMeta) {
  const cPages = pages.slice(c.start - 1, c.end);
  const cleanPages = cPages.map(p => {
    return p
      .replace(/Perfect Phrases for ESL: Everyday Situations/g, '')
      .replace(/00-FM\.indd.*?\n/g, '')
      .replace(/Gast Perfect Phrases for ESL.*?\n/g, '')
      .trim();
  }).join('\n\n--- Page Break ---\n\n');

  const content = normalizeTypography(cleanPages);
  const chId = `ppes-ch-${String(c.num).padStart(2, '0')}`;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  chapters.push({
    id: chId,
    chapterNumber: c.num,
    title: c.title,
    content,
    hasExercises: false,
    wordCount
  });

  fs.writeFileSync(path.join(bookTxtDir, `${chId}.txt`), content, 'utf-8');
}

const bookData = {
  id: 'book-perfect-phrases-everyday-situations',
  title: 'Perfect Phrases for ESL: Everyday Situations',
  author: 'Natalie Gast',
  publisher: 'McGraw-Hill Education',
  category: 'Everyday Situations & Phrases',
  pdfPath: 'materials/Perfect Phrases for ESL Everyday Situations.pdf',
  totalChapters: chapters.length,
  hasExercises: false,
  chapters,
  totalWordCount: chapters.reduce((acc, c) => acc + c.wordCount, 0)
};

fs.writeFileSync(path.join(OUT_DIR, 'perfect-phrases-everyday-situations.json'), JSON.stringify(bookData, null, 2), 'utf-8');
console.log(`Extracted all ${chapters.length} chapters (${bookData.totalWordCount} words) from Perfect Phrases Everyday Situations!`);
