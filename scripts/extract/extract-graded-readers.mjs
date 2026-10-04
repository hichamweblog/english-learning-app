import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography, cleanLine } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const OUT_DIR = path.resolve('public/data/extracted/readers');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/readers');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

// Load master catalog of readers
const allReaders = JSON.parse(fs.readFileSync('public/data/readers.json', 'utf8'));

// Load list of 64 digital text readers
const rawTextList = fs.readFileSync('/tmp/text-readers.json', 'utf8').replace(/^Count:\s*\d+\s*/, '');
const digitalReadersMeta = JSON.parse(rawTextList);

console.log(`Extracting ${digitalReadersMeta.length} digital Graded Readers...`);

const masterIndex = [];
let totalExtracted = 0;

for (let rIdx = 0; rIdx < digitalReadersMeta.length; rIdx++) {
  const meta = digitalReadersMeta[rIdx];
  const fullPdfPath = path.join(MATERIALS_DIR, meta.pdfPath.replace(/^materials\//, ''));

  if (!fs.existsSync(fullPdfPath)) {
    console.warn(`PDF not found on disk: ${fullPdfPath}`);
    continue;
  }

  // Get matching catalog entry with audio chapters if available
  const catalogEntry = allReaders.find(r => r.id === meta.id) || meta;

  let rawText = '';
  try {
    rawText = execSync(`pdftotext -q "${fullPdfPath}" -`, { maxBuffer: 40 * 1024 * 1024 }).toString();
  } catch (e) {
    console.warn(`Error running pdftotext on ${meta.title}: ${e.message}`);
    continue;
  }

  const cleanFull = normalizeTypography(rawText)
    .replace(/\f/g, '\n\n')
    .replace(/www\.[a-z0-9.-]+\.[a-z]{2,}/gi, '')
    .trim();

  // Detect chapters in text
  // Filter out TOC occurrences (typically in first 5000 characters)
  const chRegex = /(?:^|\n)\s*(?:CHAPTER|Chapter|Part|PART)\s+(?:[•·-]\s*)?([0-9IVXLCDM]+|[A-Za-z]+)\b(?:\s*[:–-]?\s*([^\n\r]+))?/g;
  let m;
  const rawChMatches = [];
  while ((m = chRegex.exec(cleanFull)) !== null) {
    // Avoid false positives like "chapter exercises", "part of this"
    if (!/exercises|activities|questions|summary|again|table/i.test(m[0])) {
      rawChMatches.push({
        match: m[0].trim(),
        numStr: m[1],
        subtitle: (m[2] || '').trim(),
        index: m.index
      });
    }
  }

  // Filter out matches that appear in TOC by ignoring matches before the first occurrence with substantial body
  const bodyChMatches = rawChMatches.filter(cm => cm.index > 3000);
  const activeMatches = bodyChMatches.length >= 2 ? bodyChMatches : rawChMatches;

  const chapters = [];
  const bookTxtDir = path.join(TXT_DIR, meta.id);
  fs.mkdirSync(bookTxtDir, { recursive: true });

  if (activeMatches.length > 0) {
    for (let c = 0; c < activeMatches.length; c++) {
      const curCh = activeMatches[c];
      const nextStart = (c + 1 < activeMatches.length) ? activeMatches[c + 1].index : cleanFull.length;
      const chText = cleanFull.substring(curCh.index, nextStart).trim();

      // Separate story text from activities
      const actIdx = chText.search(/(?:^|\n)\s*(?:ACTIVITIES|Activities|EXERCISES|Exercises|Comprehension Check|BEFORE READING|AFTER READING)\b/i);
      let storyText = chText;
      let activitiesText = '';

      if (actIdx > 0) {
        storyText = chText.substring(0, actIdx).trim();
        activitiesText = chText.substring(actIdx).trim();
      }

      // Map audio if available
      const mappedAudio = catalogEntry.chapters && catalogEntry.chapters[c]
        ? catalogEntry.chapters[c].audioPath
        : null;

      const chNumber = c + 1;
      const paddedCh = String(chNumber).padStart(2, '0');

      // Save standalone transcript
      const chTxtPath = path.join(bookTxtDir, `ch-${paddedCh}.txt`);
      fs.writeFileSync(chTxtPath, chText, 'utf-8');

      chapters.push({
        chapterNumber: chNumber,
        title: curCh.subtitle ? `Chapter ${chNumber}: ${curCh.subtitle}` : `Chapter ${chNumber}`,
        audioPath: mappedAudio,
        hasAudio: !!mappedAudio,
        storyText,
        activitiesText,
        hasActivities: activitiesText.length > 20,
        wordCount: chText.split(/\s+/).filter(Boolean).length
      });
    }
  } else {
    // Single-chapter book
    const mappedAudio = catalogEntry.chapters && catalogEntry.chapters[0]
      ? catalogEntry.chapters[0].audioPath
      : null;

    const chTxtPath = path.join(bookTxtDir, 'ch-01.txt');
    fs.writeFileSync(chTxtPath, cleanFull, 'utf-8');

    chapters.push({
      chapterNumber: 1,
      title: meta.title,
      audioPath: mappedAudio,
      hasAudio: !!mappedAudio,
      storyText: cleanFull,
      activitiesText: '',
      hasActivities: false,
      wordCount: cleanFull.split(/\s+/).filter(Boolean).length
    });
  }

  // Extract any standalone activities or glossaries
  const hasExercises = chapters.some(c => c.hasActivities) || /(?:ACTIVITIES|EXERCISES|GLOSSARY)/i.test(cleanFull);

  const bookRecord = {
    id: meta.id,
    title: meta.title,
    level: catalogEntry.level || meta.level,
    levelLabel: catalogEntry.levelLabel || meta.level,
    pdfPath: meta.pdfPath,
    hasAudio: meta.hasAudio,
    audioTracksCount: meta.audioTracksCount || 0,
    totalChapters: chapters.length,
    hasExercises,
    chapters,
    totalWordCount: chapters.reduce((acc, c) => acc + c.wordCount, 0)
  };

  const jsonPath = path.join(OUT_DIR, `${meta.id}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(bookRecord, null, 2), 'utf-8');

  masterIndex.push({
    id: meta.id,
    title: meta.title,
    level: bookRecord.levelLabel,
    hasAudio: meta.hasAudio,
    audioTracksCount: meta.audioTracksCount,
    chaptersCount: chapters.length,
    hasExercises,
    totalWordCount: bookRecord.totalWordCount
  });

  totalExtracted++;
}

fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(masterIndex, null, 2), 'utf-8');
console.log(`Successfully extracted all ${totalExtracted} digital Graded Readers with chapters, activities, audio mappings, and transcripts!`);
