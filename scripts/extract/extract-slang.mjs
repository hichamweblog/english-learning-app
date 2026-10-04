import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const OUT_DIR = path.resolve('public/data/extracted/books');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/books');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

const pdfPath = path.join(MATERIALS_DIR, 'Shayna Oliveira - Slang & Informal English - 2014.pdf');

if (!fs.existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  process.exit(1);
}

const rawText = execSync(`pdftotext "${pdfPath}" -`).toString();
const pages = rawText.split('\f');

const toc = [
  { title: 'What exactly is slang?', start: 2, end: 2 },
  { title: 'Difference between Slang & Idioms', start: 3, end: 3 },
  { title: 'People - General Words', start: 3, end: 4 },
  { title: 'Appearance & Age', start: 5, end: 6 },
  { title: 'Intelligence, Beliefs, Work Ethic', start: 7, end: 9 },
  { title: 'Pride & Bravery', start: 10, end: 12 },
  { title: 'Social Group/Status', start: 13, end: 13 },
  { title: 'Character/Personality', start: 14, end: 15 },
  { title: 'Actions', start: 16, end: 16 },
  { title: 'Human Body', start: 17, end: 19 },
  { title: 'Bodily Functions', start: 20, end: 21 },
  { title: 'Feelings & Senses', start: 22, end: 25 },
  { title: 'Money (General)', start: 26, end: 26 },
  { title: 'Spending/Using Money', start: 27, end: 28 },
  { title: 'Food, Drink, & Drugs', start: 29, end: 31 },
  { title: 'College Slang', start: 32, end: 32 },
  { title: 'Work & Business', start: 33, end: 37 },
  { title: 'Sex & Romance', start: 38, end: 40 },
  { title: 'Relationships', start: 41, end: 42 },
  { title: 'Fights, Conflict, & Competition', start: 43, end: 44 },
  { title: 'Communication', start: 45, end: 51 },
  { title: 'Time & Quantity', start: 52, end: 53 },
  { title: 'Movement & Places', start: 54, end: 55 },
  { title: 'Problems & Mistakes', start: 56, end: 57 },
  { title: 'Situations & Actions', start: 58, end: 62 },
  { title: 'Positive Slang Words', start: 63, end: 64 },
  { title: 'Negative Slang Words', start: 65, end: 66 },
  { title: 'Slang Abbreviations', start: 67, end: 70 },
  { title: 'Popular Text Message & Chat Terms', start: 71, end: 73 }
];

const chapters = [];
const bookTxtDir = path.join(TXT_DIR, 'slang-and-informal-english');
fs.mkdirSync(bookTxtDir, { recursive: true });

for (let i = 0; i < toc.length; i++) {
  const item = toc[i];
  const pSlice = pages.slice(item.start - 1, item.end);
  const cleanSlice = pSlice.map(p => {
    return p
      .replace(/P\s*a\s*g\s*e\s*\|\s*\d+/g, '')
      .replace(/www\.espressoenglish\.net/g, '')
      .replace(/© Shayna Oliveira \d{4}/g, '')
      .trim();
  }).join('\n\n');

  const content = normalizeTypography(cleanSlice);
  const chId = `slang-ch-${String(i + 1).padStart(2, '0')}`;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  chapters.push({
    id: chId,
    chapterNumber: i + 1,
    title: item.title,
    content,
    wordCount
  });

  fs.writeFileSync(path.join(bookTxtDir, `${chId}.txt`), content, 'utf-8');
}

const bookData = {
  id: 'book-slang-and-informal-english',
  title: 'Slang & Informal English',
  author: 'Shayna Oliveira',
  publisher: 'Espresso English',
  category: 'Slang & Idioms',
  pdfPath: 'materials/Shayna Oliveira - Slang & Informal English - 2014.pdf',
  totalChapters: chapters.length,
  chapters,
  totalWordCount: chapters.reduce((acc, c) => acc + c.wordCount, 0)
};

fs.writeFileSync(path.join(OUT_DIR, 'slang-and-informal-english.json'), JSON.stringify(bookData, null, 2), 'utf-8');
console.log(`Extracted all ${chapters.length} topics (${bookData.totalWordCount} words) from Slang & Informal English!`);
