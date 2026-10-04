import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const OUT_DIR = path.resolve('public/data/extracted/books');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/books');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

const pdfPath = path.join(MATERIALS_DIR, 'Grammar for Everyone_ Practical Tools for Learning and Teaching Grammar.pdf');

if (!fs.existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  process.exit(1);
}

const rawText = execSync(`pdftotext "${pdfPath}" - 2>/dev/null`).toString();
const pages = rawText.split('\f');

// Split chapters by headings
const chapters = [];
const bookTxtDir = path.join(TXT_DIR, 'grammar-for-everyone');
fs.mkdirSync(bookTxtDir, { recursive: true });

// Part II starts around page 29
const relevantPages = pages.slice(28);
const step = 8;
const totalParts = Math.ceil(relevantPages.length / step);

for (let i = 0; i < totalParts; i++) {
  const slice = relevantPages.slice(i * step, (i + 1) * step);
  const content = normalizeTypography(
    slice.map(p => p.replace(/Grammar for Everyone/g, '').replace(/ACER Press/g, '').trim()).join('\n\n--- Page Break ---\n\n')
  );

  let title = `Topic ${i + 1}`;
  const firstHead = content.match(/\n\s*([0-9]+\s+[A-Z][a-zA-Z\s,–-]+)\n/);
  if (firstHead) {
    title = firstHead[1].trim();
  }

  const chId = `gfe-part-${String(i + 1).padStart(2, '0')}`;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  chapters.push({
    id: chId,
    chapterNumber: i + 1,
    title,
    content,
    hasExercises: /Activity|Activities|Exercises|Practice/i.test(content),
    wordCount
  });

  fs.writeFileSync(path.join(bookTxtDir, `${chId}.txt`), content, 'utf-8');
}

const bookData = {
  id: 'book-grammar-for-everyone',
  title: 'Grammar for Everyone: Practical Tools for Learning and Teaching Grammar',
  author: 'Barbara Dykes',
  publisher: 'ACER Press',
  category: 'Grammar & Foundations',
  pdfPath: 'materials/Grammar for Everyone_ Practical Tools for Learning and Teaching Grammar.pdf',
  totalChapters: chapters.length,
  hasExercises: true,
  chapters,
  totalWordCount: chapters.reduce((acc, c) => acc + c.wordCount, 0)
};

fs.writeFileSync(path.join(OUT_DIR, 'grammar-for-everyone.json'), JSON.stringify(bookData, null, 2), 'utf-8');
console.log(`Extracted all ${chapters.length} parts (${bookData.totalWordCount} words) from Grammar for Everyone!`);
