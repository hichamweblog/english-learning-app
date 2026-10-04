import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const OUT_DIR = path.resolve('public/data/extracted/books');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/books');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

function extractBook(fileName, bookId, title, volNum) {
  const fullPdf = path.join(MATERIALS_DIR, fileName);
  if (!fs.existsSync(fullPdf)) {
    console.warn(`File not found: ${fullPdf}`);
    return;
  }

  console.log(`Extracting ${title}...`);
  const rawText = execSync(`pdftotext "${fullPdf}" - 2>/dev/null`).toString();
  const pages = rawText.split('\f');

  const chapters = [];
  const bookTxtDir = path.join(TXT_DIR, bookId);
  fs.mkdirSync(bookTxtDir, { recursive: true });

  // Each lesson is typically 7-8 pages
  // We can detect "Practice" or folktale stories
  const lessonStep = 8;
  const startOffset = 7; // 0-indexed page 7 is page 8
  const totalLessons = 15;

  for (let l = 0; l < totalLessons; l++) {
    const lNum = l + 1;
    const startP = startOffset + (l * lessonStep);
    const endP = Math.min(pages.length, startP + lessonStep);

    const slicePages = pages.slice(startP, endP);
    const fullContent = normalizeTypography(
      slicePages.map(p => p.replace(/выложено группой.*?vk\.com\S+/gi, '').trim()).join('\n\n--- Page Break ---\n\n')
    );

    // Look for story title
    let storyTitle = `Lesson ${lNum}`;
    const storyMatch = fullContent.match(/(?:The\s+[A-Z][a-zA-Z\s,]+|Why\s+[A-Z][a-zA-Z\s,]+|How\s+[A-Z][a-zA-Z\s,]+)\n\s*(?:[A-Z]?[a-z]+|\([A-Za-z\s]+\))/);
    if (storyMatch) {
      const candidate = storyMatch[0].split('\n')[0].trim();
      if (candidate.length > 5 && candidate.length < 50) {
        storyTitle = `Lesson ${lNum}: ${candidate}`;
      }
    }

    const chId = `${bookId}-l${String(lNum).padStart(2, '0')}`;
    const wordCount = fullContent.split(/\s+/).filter(Boolean).length;

    chapters.push({
      id: chId,
      chapterNumber: lNum,
      title: storyTitle,
      content: fullContent,
      hasExercises: true,
      hasStory: true,
      wordCount
    });

    fs.writeFileSync(path.join(bookTxtDir, `${chId}.txt`), fullContent, 'utf-8');
  }

  const bookData = {
    id: bookId,
    title,
    author: 'Casey Malarcher',
    publisher: 'Compass Publishing',
    category: 'Idioms & Stories',
    volume: volNum,
    pdfPath: `materials/${fileName}`,
    totalChapters: chapters.length,
    hasExercises: true,
    chapters,
    totalWordCount: chapters.reduce((acc, c) => acc + c.wordCount, 0)
  };

  fs.writeFileSync(path.join(OUT_DIR, `${bookId}.json`), JSON.stringify(bookData, null, 2), 'utf-8');
  console.log(`Extracted ${chapters.length} lessons (${bookData.totalWordCount} words) from ${title}!`);
}

extractBook(
  'Illustrated_Everyday_expressions_with_stories_1.pdf',
  'book-illustrated-expressions-1',
  'Illustrated Everyday Expressions with Stories 1',
  1
);

extractBook(
  'Illustrated_Everyday_Expressions_with_Stories_2.pdf',
  'book-illustrated-expressions-2',
  'Illustrated Everyday Expressions with Stories 2',
  2
);
