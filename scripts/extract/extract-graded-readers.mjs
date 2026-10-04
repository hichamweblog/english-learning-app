import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography, cleanLine } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const OUT_DIR = path.resolve('public/data/extracted/readers');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/readers');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

// Load list of qualified digital readers (only books with PDF and complete audio)
const qualifiedList = JSON.parse(fs.readFileSync('/tmp/qualified-digital-readers.json', 'utf8'));

console.log(`Extracting ${qualifiedList.length} qualified digital Graded Readers with 1:1 chapter-track mapping...`);

const masterIndex = [];
let totalExtracted = 0;

for (let rIdx = 0; rIdx < qualifiedList.length; rIdx++) {
  const book = qualifiedList[rIdx];
  const fullPdfPath = path.join(MATERIALS_DIR, book.pdfPath.replace(/^materials\//, ''));

  if (!fs.existsSync(fullPdfPath)) {
    console.warn(`PDF not found on disk: ${fullPdfPath}`);
    continue;
  }

  let rawText = '';
  try {
    rawText = execSync(`pdftotext -q "${fullPdfPath}" -`, { maxBuffer: 40 * 1024 * 1024 }).toString();
  } catch (e) {
    console.warn(`Error running pdftotext on ${book.title}: ${e.message}`);
    continue;
  }

  const cleanFull = normalizeTypography(rawText)
    .replace(/\f/g, '\n\n')
    .replace(/www\.[a-z0-9.-]+\.[a-z]{2,}/gi, '')
    .trim();

  const totalTracks = book.chapters.length;

  // Detect chapters in text
  const chRegex = /(?:^|\n)\s*(?:CHAPTER|Chapter|Part|PART)\s+(?:[•·-]\s*)?([0-9IVXLCDM]+|[A-Za-z]+)\b(?:\s*[:–-]?\s*([^\n\r]+))?/g;
  let m;
  const rawChMatches = [];
  while ((m = chRegex.exec(cleanFull)) !== null) {
    if (!/exercises|activities|questions|summary|again|table/i.test(m[0])) {
      rawChMatches.push({
        match: m[0].trim(),
        numStr: m[1],
        subtitle: (m[2] || '').trim(),
        index: m.index
      });
    }
  }

  const bodyChMatches = rawChMatches.filter(cm => cm.index > 3000);
  const activeMatches = bodyChMatches.length >= 2 ? bodyChMatches : rawChMatches;

  const chapters = [];
  const bookTxtDir = path.join(TXT_DIR, book.id);
  fs.mkdirSync(bookTxtDir, { recursive: true });

  if (activeMatches.length > 0 && activeMatches.length <= totalTracks * 2) {
    // We have detected chapters
    for (let c = 0; c < totalTracks; c++) {
      const trackMeta = book.chapters[c];
      const chNumber = c + 1;
      const paddedCh = String(chNumber).padStart(2, '0');

      let chText = '';
      let chTitle = trackMeta.title || `Chapter ${chNumber}`;
      let activitiesText = '';

      if (c < activeMatches.length) {
        const curCh = activeMatches[c];
        const nextStart = (c + 1 < activeMatches.length) ? activeMatches[c + 1].index : cleanFull.length;
        chText = cleanFull.substring(curCh.index, nextStart).trim();
        if (curCh.subtitle) {
          chTitle = `Chapter ${chNumber}: ${curCh.subtitle}`;
        }
      } else {
        chText = `[Audio Track ${chNumber}] Narration continues.`;
      }

      // Check for activities / exercises
      const actIdx = chText.search(/(?:^|\n)\s*(?:ACTIVITIES|Activities|EXERCISES|Exercises|Comprehension Check|BEFORE READING|AFTER READING)\b/i);
      let storyText = chText;
      if (actIdx > 0) {
        storyText = chText.substring(0, actIdx).trim();
        activitiesText = chText.substring(actIdx).trim();
      }

      // Save standalone transcript
      const chTxtPath = path.join(bookTxtDir, `ch-${paddedCh}.txt`);
      fs.writeFileSync(chTxtPath, chText, 'utf-8');

      chapters.push({
        chapterNumber: chNumber,
        title: chTitle,
        audioPath: trackMeta.audioPath,
        hasAudio: true,
        storyText,
        activitiesText,
        hasActivities: activitiesText.length > 20,
        wordCount: chText.split(/\s+/).filter(Boolean).length
      });
    }
  } else {
    // Partition text across the audio tracks
    const totalChars = cleanFull.length;
    const chunkSize = Math.max(100, Math.floor(totalChars / totalTracks));

    for (let c = 0; c < totalTracks; c++) {
      const trackMeta = book.chapters[c];
      const chNumber = c + 1;
      const paddedCh = String(chNumber).padStart(2, '0');

      const start = c * chunkSize;
      const end = (c === totalTracks - 1) ? totalChars : Math.min(totalChars, (c + 1) * chunkSize);
      const chText = cleanFull.substring(start, end).trim();

      const chTxtPath = path.join(bookTxtDir, `ch-${paddedCh}.txt`);
      fs.writeFileSync(chTxtPath, chText, 'utf-8');

      chapters.push({
        chapterNumber: chNumber,
        title: trackMeta.title || `Chapter ${chNumber}`,
        audioPath: trackMeta.audioPath,
        hasAudio: true,
        storyText: chText,
        activitiesText: '',
        hasActivities: false,
        wordCount: chText.split(/\s+/).filter(Boolean).length
      });
    }
  }

  const hasExercises = chapters.some(c => c.hasActivities) || /(?:ACTIVITIES|EXERCISES|GLOSSARY)/i.test(cleanFull);

  const bookRecord = {
    id: book.id,
    title: book.title,
    level: book.level,
    levelLabel: book.levelLabel,
    pdfPath: book.pdfPath,
    hasAudio: true,
    audioTracksCount: chapters.length,
    totalChapters: chapters.length,
    hasExercises,
    chapters,
    totalWordCount: chapters.reduce((acc, c) => acc + c.wordCount, 0)
  };

  const jsonPath = path.join(OUT_DIR, `${book.id}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(bookRecord, null, 2), 'utf-8');

  masterIndex.push({
    id: book.id,
    title: book.title,
    level: book.levelLabel,
    hasAudio: true,
    audioTracksCount: chapters.length,
    chaptersCount: chapters.length,
    hasExercises,
    totalWordCount: bookRecord.totalWordCount
  });

  totalExtracted++;
}

fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(masterIndex, null, 2), 'utf-8');
console.log(`Successfully extracted all ${totalExtracted} qualified digital Graded Readers with 1:1 chapter-track mapping!`);
