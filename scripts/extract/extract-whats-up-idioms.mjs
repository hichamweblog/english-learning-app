import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const OUT_DIR = path.resolve('public/data/extracted/books');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/books');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

const pdfPath = path.join(MATERIALS_DIR, 'pamela_mcpartland_what_s_up_american_idioms.pdf');

if (!fs.existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  process.exit(1);
}

const rawText = execSync(`pdftotext "${pdfPath}" - 2>/dev/null`).toString();
const pages = rawText.split('\f');

const unitsMeta = [
  { unit: 1, title: 'Sports: Go for It', startPage: 16, endPage: 27 },
  { unit: 2, title: 'Family: Growing Up', startPage: 28, endPage: 41 },
  { unit: 3, title: 'Communication: Get in Touch', startPage: 42, endPage: 55 },
  { unit: 4, title: 'Education: Dropping Out', startPage: 56, endPage: 71 },
  { unit: 5, title: 'Food: Polish It Off', startPage: 72, endPage: 86 },
  { unit: 6, title: 'Review I: Mix Them Up', startPage: 87, endPage: 94 },
  { unit: 7, title: 'Persistence: Don\'t Give Up', startPage: 95, endPage: 109 },
  { unit: 8, title: 'Politics: Vote for Me', startPage: 110, endPage: 123 },
  { unit: 9, title: 'Success: Make a Name for Yourself', startPage: 124, endPage: 137 },
  { unit: 10, title: 'Sickness: Fight It Off', startPage: 138, endPage: 151 },
  { unit: 11, title: 'Lifestyles: Live It Up', startPage: 152, endPage: 167 },
  { unit: 12, title: 'Review II: What\'s Up?', startPage: 168, endPage: 176 },
  { unit: 13, title: 'Complete Answer Key', startPage: 177, endPage: 191 }
];

const chapters = [];
const bookTxtDir = path.join(TXT_DIR, 'whats-up-american-idioms');
fs.mkdirSync(bookTxtDir, { recursive: true });

for (const u of unitsMeta) {
  const uPages = pages.slice(u.startPage - 1, u.endPage);
  const cleanPages = uPages.map(p => {
    return p
      .replace(/книга выложена группой vk\.com\/create_your_english/g, '')
      .replace(/Prentice-Hall.*?\n/g, '')
      .trim();
  }).join('\n\n--- Page Break ---\n\n');

  const content = normalizeTypography(cleanPages);
  const chId = `whatsup-unit-${String(u.unit).padStart(2, '0')}`;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  // Detect exercises
  const hasExercises = /EXERCISE|DIRECTIONS:|Fill It In|Figure It Out/i.test(content);

  chapters.push({
    id: chId,
    chapterNumber: u.unit,
    title: u.title,
    content,
    hasExercises,
    wordCount
  });

  fs.writeFileSync(path.join(bookTxtDir, `${chId}.txt`), content, 'utf-8');
}

const bookData = {
  id: 'book-whats-up-american-idioms',
  title: 'What\'s Up? American Idioms',
  author: 'Pamela McPartland',
  publisher: 'Prentice Hall Regents',
  category: 'Idioms & Expressions',
  pdfPath: 'materials/pamela_mcpartland_what_s_up_american_idioms.pdf',
  totalChapters: chapters.length,
  hasExercises: true,
  chapters,
  totalWordCount: chapters.reduce((acc, c) => acc + c.wordCount, 0)
};

fs.writeFileSync(path.join(OUT_DIR, 'whats-up-american-idioms.json'), JSON.stringify(bookData, null, 2), 'utf-8');
console.log(`Extracted all ${chapters.length} units & answer key (${bookData.totalWordCount} words) from What's Up? American Idioms!`);
