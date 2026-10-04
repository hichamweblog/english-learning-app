import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const OUT_DIR = path.resolve('public/data/extracted/books');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/books');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

const pdfPath = path.join(MATERIALS_DIR, '650_English_Phrases_for_Everyday_Speaking.pdf');

if (!fs.existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  process.exit(1);
}

const rawText = execSync(`pdftotext "${pdfPath}" -`).toString();
const pages = rawText.split('\f');

// Pages 9 to 48 are the 40 conversational topics
const chapters = [];
const bookTxtDir = path.join(TXT_DIR, '650-english-phrases');
fs.mkdirSync(bookTxtDir, { recursive: true });

for (let p = 9; p <= 48; p++) {
  const pageRaw = pages[p - 1] || '';
  const lines = pageRaw.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) continue;

  const title = lines[0];
  const bodyLines = lines.slice(1).filter(l => !l.startsWith('Click here') && !l.includes('EnglishTonightBooks.com'));
  const content = normalizeTypography(bodyLines.join('\n'));

  // Extract phrases (lines that look like bullet points or short expressions)
  const phrases = bodyLines
    .filter(l => l.length > 2 && l.length < 80 && !l.endsWith('.') && !l.includes('In the United States'))
    .map(l => l.replace(/^[-•*]\s*/, ''));

  const chId = `phrase650-ch-${String(chapters.length + 1).padStart(2, '0')}`;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  chapters.push({
    id: chId,
    chapterNumber: chapters.length + 1,
    title,
    content,
    phrases,
    wordCount
  });

  fs.writeFileSync(path.join(bookTxtDir, `${chId}.txt`), content, 'utf-8');
}

const bookData = {
  id: 'book-650-english-phrases',
  title: '650+ English Phrases for Everyday Speaking',
  author: 'Janet Gerber',
  publisher: 'English Tonight Books',
  category: 'Everyday Conversation',
  pdfPath: 'materials/650_English_Phrases_for_Everyday_Speaking.pdf',
  totalChapters: chapters.length,
  chapters,
  totalWordCount: chapters.reduce((acc, c) => acc + c.wordCount, 0)
};

fs.writeFileSync(path.join(OUT_DIR, '650-english-phrases.json'), JSON.stringify(bookData, null, 2), 'utf-8');
console.log(`Extracted all ${chapters.length} situations (${bookData.totalWordCount} words) from 650+ English Phrases!`);
