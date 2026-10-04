import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const OUT_DIR = path.resolve('public/data/extracted/books');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/books');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

const pdfPath = path.join(MATERIALS_DIR, 'Just Enough English Grammar Illustrated.pdf');

if (!fs.existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  process.exit(1);
}

const rawText = execSync(`pdftotext "${pdfPath}" - 2>/dev/null`).toString();
const pages = rawText.split('\f');

const chaptersMeta = [
  { num: 1, title: 'Nouns: Person, Place, or Thing', start: 11, end: 36 },
  { num: 2, title: 'Adjectives: Describing Nouns', start: 37, end: 46 },
  { num: 3, title: 'Pronouns: Taking the Place of Nouns', start: 47, end: 70 },
  { num: 4, title: 'Verbs: Action and State of Being', start: 71, end: 106 },
  { num: 5, title: 'Adverbs: Describing Verbs, Adjectives & Adverbs', start: 107, end: 116 },
  { num: 6, title: 'Prepositions: Position, Direction & Time', start: 117, end: 126 },
  { num: 7, title: 'Conjunctions: Connecting Words and Phrases', start: 127, end: 132 },
  { num: 8, title: 'Interjections: Expressing Emotion', start: 133, end: 138 },
  { num: 9, title: 'Complete Answer Key', start: 139, end: 147 }
];

const chapters = [];
const bookTxtDir = path.join(TXT_DIR, 'grammar-illustrated-just-enough');
fs.mkdirSync(bookTxtDir, { recursive: true });

for (const c of chaptersMeta) {
  const cPages = pages.slice(c.start - 1, c.end);
  const cleanPages = cPages.map(p => {
    return p
      .replace(/Copyright © 2008 by Gabriele Stobbe/g, '')
      .replace(/Just Enough English Grammar Illustrated/g, '')
      .trim();
  }).join('\n\n--- Page Break ---\n\n');

  const content = normalizeTypography(cleanPages);
  const chId = `grammar-ch-${String(c.num).padStart(2, '0')}`;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  chapters.push({
    id: chId,
    chapterNumber: c.num,
    title: c.title,
    content,
    hasExercises: true,
    wordCount
  });

  fs.writeFileSync(path.join(bookTxtDir, `${chId}.txt`), content, 'utf-8');
}

const bookData = {
  id: 'book-grammar-illustrated-just-enough',
  title: 'Just Enough English Grammar Illustrated',
  author: 'Gabriele Stobbe',
  publisher: 'McGraw-Hill Education',
  category: 'Grammar & Foundations',
  pdfPath: 'materials/Just Enough English Grammar Illustrated.pdf',
  totalChapters: chapters.length,
  hasExercises: true,
  chapters,
  totalWordCount: chapters.reduce((acc, c) => acc + c.wordCount, 0)
};

fs.writeFileSync(path.join(OUT_DIR, 'grammar-illustrated-just-enough.json'), JSON.stringify(bookData, null, 2), 'utf-8');
console.log(`Extracted all ${chapters.length} chapters & answer key (${bookData.totalWordCount} words) from Just Enough English Grammar!`);
