import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const OUT_DIR = path.resolve('public/data/extracted/books');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/books');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

const pdfPath = path.join(MATERIALS_DIR, '366882213-Perfect-phrases-for-ESL-conversational-skills-pdf.pdf');

if (!fs.existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  process.exit(1);
}

const rawText = execSync(`pdftotext "${pdfPath}" - 2>/dev/null`).toString();
const pages = rawText.split('\f');

const chapters = [];
const bookTxtDir = path.join(TXT_DIR, 'perfect-phrases-conversation-skills');
fs.mkdirSync(bookTxtDir, { recursive: true });

const chTitles = [
  'Small Talk',
  'Past Experiences',
  'Likes, Dislikes, and Interests',
  'Objects and Processes',
  'Problems and Advice',
  'Decisions and Goals',
  'Opinions',
  'Group Discussions',
  'Serious Subjects',
  'Special Occasions',
  'Telephone Basics',
  'Telephone Messages',
  'Telephone Business'
];

// Locate pages where chapters start
const chPageIndices = [];
for (let p = 15; p < pages.length; p++) {
  const m = pages[p].match(/^\s*CHAPTER\s*[\n\r]+\s*([^\n\r]+)/m);
  if (m) {
    chPageIndices.push({
      num: chPageIndices.length + 1,
      title: m[1].trim(),
      pageIdx: p
    });
  }
}

for (let i = 0; i < chPageIndices.length; i++) {
  const cur = chPageIndices[i];
  const nextIdx = (i + 1 < chPageIndices.length) ? chPageIndices[i + 1].pageIdx : pages.length;
  const slicePages = pages.slice(cur.pageIdx, nextIdx);

  const cleanPages = slicePages.map(p => {
    return p
      .replace(/\d+\/364/g, '')
      .replace(/Perfect Phrases for ESL.*?\n/g, '')
      .replace(/McGraw-Hill Education.*?\n/g, '')
      .trim();
  }).join('\n\n--- Page Break ---\n\n');

  const content = normalizeTypography(cleanPages);
  const chId = `ppcs-ch-${String(cur.num).padStart(2, '0')}`;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  chapters.push({
    id: chId,
    chapterNumber: cur.num,
    title: `Chapter ${cur.num}: ${cur.title}`,
    content,
    hasExercises: /Dialogue:|Topics for Practice/i.test(content),
    wordCount
  });

  fs.writeFileSync(path.join(bookTxtDir, `${chId}.txt`), content, 'utf-8');
}

const bookData = {
  id: 'book-perfect-phrases-conversation-skills',
  title: 'Perfect Phrases for ESL: Conversation Skills',
  author: 'Diane Engelhardt',
  publisher: 'McGraw-Hill Education',
  category: 'Conversational Strategies',
  pdfPath: 'materials/366882213-Perfect-phrases-for-ESL-conversational-skills-pdf.pdf',
  totalChapters: chapters.length,
  hasExercises: true,
  chapters,
  totalWordCount: chapters.reduce((acc, c) => acc + c.wordCount, 0)
};

fs.writeFileSync(path.join(OUT_DIR, 'perfect-phrases-conversation-skills.json'), JSON.stringify(bookData, null, 2), 'utf-8');
console.log(`Extracted all ${chapters.length} chapters (${bookData.totalWordCount} words) from Perfect Phrases Conversation Skills!`);
