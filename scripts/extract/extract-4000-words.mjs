#!/usr/bin/env node
/**
 * 4000 Essential English Words - Deterministic Content Extractor
 * Extracts 180 units across 6 volumes:
 *  - 20 Target Headwords per unit with definitions, phonetic IPA, POS, and examples
 *  - Full Reading Stories with standalone verbatim .txt archives
 *  - Reading Comprehension Questions & Multiple Choice Options
 *  - 1:1 Audio Track Mappings (Word list audio + Reading story audio)
 * 100% faithful and deterministic. Zero generative AI.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { normalizeTypography, cleanLine } from './cleaners.mjs';

const BASE_MATERIALS_DIR = path.resolve('public/materials/4000 essential english words FULL');
const OUTPUT_DIR = path.resolve('public/data/extracted/words4000');
const TRANSCRIPTS_DIR = path.resolve('public/data/extracted/transcripts/words4000');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });

// Volume CEFR Level Metadata
export const VOLUME_LEVELS = {
  1: { level: 'A2', label: 'Elementary (Beginner)' },
  2: { level: 'B1', label: 'Pre-Intermediate' },
  3: { level: 'B1+', label: 'Intermediate' },
  4: { level: 'B2', label: 'Upper-Intermediate' },
  5: { level: 'C1', label: 'Advanced' },
  6: { level: 'C1+', label: 'Mastery / Fluent' }
};

/**
 * Extracts target words for all 30 units of a volume from its Table of Contents.
 */
export function extractTocWordLists(volume) {
  const pdfPath = path.join(BASE_MATERIALS_DIR, `4000 english words volume ${volume}.pdf`);
  const p2 = execSync(`pdftotext -layout -f 2 -l 2 "${pdfPath}" -`).toString();
  const p3 = execSync(`pdftotext -layout -f 3 -l 3 "${pdfPath}" -`).toString();

  function getCommaLines(pageText) {
    return pageText.split('\n')
      .map(l => l.trim())
      .filter(l => (l.match(/,/g) || []).length >= 4);
  }

  const p2Lines = getCommaLines(p2);
  const p3Lines = getCommaLines(p3);
  const units = [];

  // Units 1 to 15 on page 2
  for (let i = 0; i < 15; i++) {
    const uNum = i + 1;
    const raw = (p2Lines[2 * i] || '') + ', ' + (p2Lines[2 * i + 1] || '');
    const cleaned = raw.replace(/^\s*\d+\s+/, '').replace(/\s+\d+\s*$/, '').replace(/overhead\s+principle/gi, 'overhead, principle');
    let words = cleaned.split(',').map(w => w.trim().toLowerCase().replace(/[^a-z]/g, '')).filter(w => w.length >= 2);
    if (volume === 5 && uNum === 13 && !words.includes('faculty')) words.push('faculty');
    units.push({ unit: uNum, words });
  }

  // Units 16 to 30 on page 3
  for (let i = 0; i < 15; i++) {
    const uNum = i + 16;
    const raw = (p3Lines[2 * i] || '') + ', ' + (p3Lines[2 * i + 1] || '');
    const cleaned = raw.replace(/^\s*\d+\s+/, '').replace(/\s+\d+\s*$/, '').replace(/overhead\s+principle/gi, 'overhead, principle');
    let words = cleaned.split(',').map(w => w.trim().toLowerCase().replace(/[^a-z]/g, '')).filter(w => w.length >= 2);
    if (volume === 3 && uNum === 24 && words.includes('luggage')) words = words.filter(w => w !== 'luggage');
    if (volume === 5 && uNum === 19 && !words.includes('genuine')) words.push('genuine');
    units.push({ unit: uNum, words });
  }

  return units;
}

/**
 * Extracts a complete unit (words, story, questions, audio) from a volume.
 */
export function extractUnit(volume, unit, targetWords) {
  const pdfPath = path.join(BASE_MATERIALS_DIR, `4000 english words volume ${volume}.pdf`);
  const startOffset = volume === 6 ? 6 : 4;
  const pStart = (unit - 1) * 6 + startOffset;

  // 1. Extract Word Pages (pStart and pStart + 1)
  const p1Raw = execSync(`pdftotext -f ${pStart} -l ${pStart} "${pdfPath}" -`).toString();
  const p2Raw = execSync(`pdftotext -f ${pStart + 1} -l ${pStart + 1} "${pdfPath}" -`).toString();
  const combinedWordsText = normalizeTypography(p1Raw + '\n\n' + p2Raw);

  const wordPositions = [];
  for (const w of targetWords) {
    const spaced = w.split('').join('\\s*');
    let altPattern = spaced;
    if (w === 'burn') altPattern += '|b\\s*u\\s*m';
    if (w === 'beach') altPattern += '|b\\s*e\\s*a\\s*c\\s*h';

    const regex = new RegExp(`(?:^|\\n)\\s*(?:[a-z0-9©®■•\\[\\(\\^\\*—–]|r-)\\s*(?:${w}|${altPattern})\\b`, 'i');
    let m = combinedWordsText.match(regex);
    if (!m) {
      const fallbackRegex = new RegExp(`(?:^|\\n)\\s*[^\\w\\s]*\\s*(?:${w}|${altPattern})\\b`, 'i');
      m = combinedWordsText.match(fallbackRegex);
    }
    wordPositions.push({ word: w, index: m ? m.index : -1 });
  }

  // Sort by text position
  const validPositions = wordPositions.filter(p => p.index !== -1).sort((a, b) => a.index - b.index);
  const words = [];

  for (let i = 0; i < validPositions.length; i++) {
    const cur = validPositions[i];
    const nextIdx = i + 1 < validPositions.length ? validPositions[i + 1].index : combinedWordsText.length;
    const slice = combinedWordsText.slice(cur.index, nextIdx).trim();

    const lines = slice.split('\n').map(l => l.trim()).filter(Boolean);
    const headerLine = lines[0] || '';
    const phonMatch = headerLine.match(/\[([^\]]+)\]/);
    const posMatch = headerLine.match(/\b(adj|adv|v|n|prep)\.?/i);

    // Split on arrow or dash marker for example
    const arrowParts = slice.split(/(?:[-—–][»\*►>♦■\+]|->|—■)/);
    let def = '';
    let eg = '';

    if (arrowParts.length > 1) {
      def = arrowParts[0].split('\n').slice(1).join(' ').replace(/\s+/g, ' ').trim();
      eg = arrowParts[1].split('\n').join(' ').replace(/\s+/g, ' ').trim();
    } else {
      def = lines.slice(1).join(' ').replace(/\s+/g, ' ').trim();
    }

    // Clean definition leftovers
    def = def.replace(/^[a-z0-9©®■•\^\*\-—–\s\[\]:]+\.\s*/i, '').trim();
    if (!def && lines.length > 1) {
      def = lines[1];
    }

    words.push({
      word: cur.word,
      phonetic: phonMatch ? phonMatch[1] : null,
      partOfSpeech: posMatch ? posMatch[1].toLowerCase() : null,
      definition: def,
      example: eg
    });
  }

  // 2. Extract Reading Story (pStart + 4)
  const storyPageText = normalizeTypography(execSync(`pdftotext -f ${pStart + 4} -l ${pStart + 4} "${pdfPath}" -`).toString());
  const sLines = storyPageText.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !/^[\f\d]+$/.test(l) && !/^[■\.\*\s\W_]+$/.test(l));
  
  const titleLines = [];
  let passageStart = 0;
  for (let i = 0; i < sLines.length; i++) {
    const l = sLines[i].replace(/^I\s+|\b1\s+/g, '').trim();
    if (l.length < 50 && !/[.!?]$/.test(l) && !/^(?:In|On|At|When|The|A|An)\s+[a-z\s,]+(?:lived|was|were|had|is|are|one)\b/i.test(l)) {
      titleLines.push(l);
    } else {
      passageStart = i;
      break;
    }
  }

  let storyTitle = titleLines.slice(0, 2).join(' ').trim();
  if (!storyTitle || storyTitle.length > 50) storyTitle = `Unit ${unit} Reading`;
  storyTitle = storyTitle.replace(/^[^a-zA-Z]+/, '').trim();

  const storyPassage = sLines.slice(passageStart).join('\n\n');
  const passageWords = storyPassage.split(/\s+/).filter(Boolean);

  // Standalone .txt transcript export
  const uPadded = String(unit).padStart(2, '0');
  const txtFilename = `vol-${volume}-unit-${uPadded}.txt`;
  const txtFullPath = path.join(TRANSCRIPTS_DIR, txtFilename);
  fs.writeFileSync(txtFullPath, `${storyTitle}\n\n${storyPassage}`, 'utf-8');

  // 3. Extract Reading Comprehension Questions (pStart + 5)
  const qPageText = normalizeTypography(execSync(`pdftotext -f ${pStart + 5} -l ${pStart + 5} "${pdfPath}" -`).toString());
  const qLines = qPageText.split('\n').map(l => l.trim()).filter(Boolean);
  const questions = [];
  let currentQ = null;
  let currentPart = 'Questions';

  for (let i = 0; i < qLines.length; i++) {
    const line = qLines[i];
    if (/^Reading Comprehension/i.test(line) || /^ISH/i.test(line)) continue;
    if (/^PART/i.test(line)) {
      currentPart = line;
      continue;
    }
    if (/^Mark each statement/i.test(line) || /^Answer the questions/i.test(line)) continue;

    const qNumMatch = line.match(/^(\d+)\.\s*(.*)$/);
    const optMatch = line.match(/^([a-d])\.\s*(.+)$/i);

    if (qNumMatch) {
      if (currentQ) questions.push(currentQ);
      let qText = qNumMatch[2];
      if (!qText && i + 1 < qLines.length && !/^\d+\./.test(qLines[i + 1])) {
        i++;
        qText = qLines[i];
      }
      const isTF = currentPart.includes('PART') && /true|false/i.test(qPageText.slice(0, 300));
      currentQ = {
        number: parseInt(qNumMatch[1]),
        part: currentPart,
        question: qText,
        options: isTF ? [{ key: 'T', text: 'True' }, { key: 'F', text: 'False' }] : []
      };
    } else if (optMatch && currentQ) {
      currentQ.options.push({
        key: optMatch[1].toLowerCase(),
        text: optMatch[2]
      });
    } else if (currentQ) {
      if (currentQ.options.length > 0) {
        currentQ.options[currentQ.options.length - 1].text += ' ' + line;
      } else {
        currentQ.question += ' ' + line;
      }
    }
  }
  if (currentQ) questions.push(currentQ);

  // 4. Resolve Audio Track Paths
  let volDir = path.join(BASE_MATERIALS_DIR, `4000 english words volume ${volume}`);
  let subDir = path.join(volDir, `4000 english words volume ${volume}`);
  let targetAudioDir = fs.existsSync(subDir) ? subDir : volDir;

  const track1File = `${String(2 * unit - 1).padStart(2, '0')}.mp3`;
  const track2File = `${String(2 * unit).padStart(2, '0')}.mp3`;

  const relAudioDir = path.relative(path.resolve('public'), targetAudioDir);

  const unitData = {
    id: `4000-v${volume}-u${uPadded}`,
    series: '4000-essential-words',
    seriesTitle: '4000 Essential English Words',
    volume: volume,
    unit: unit,
    level: VOLUME_LEVELS[volume],
    title: storyTitle,
    targetWords: words,
    story: {
      title: storyTitle,
      passage: storyPassage,
      wordCount: passageWords.length,
      txtPath: `data/extracted/transcripts/words4000/${txtFilename}`
    },
    questions: questions,
    audio: {
      wordsAudioPath: path.join(relAudioDir, track1File),
      storyAudioPath: path.join(relAudioDir, track2File)
    },
    pdfPage: pStart,
    extractedAt: new Date().toISOString()
  };

  return unitData;
}

export async function runFullExtraction(targetVol = null) {
  console.log('=== 4000 Essential English Words Extractor ===\n');

  const volumesToProcess = targetVol ? [targetVol] : [1, 2, 3, 4, 5, 6];
  const allIndexData = [];

  let grandTotalUnits = 0;
  let grandTotalWords = 0;

  for (const v of volumesToProcess) {
    const volDir = path.join(OUTPUT_DIR, `vol-${v}`);
    fs.mkdirSync(volDir, { recursive: true });

    console.log(`Extracting Volume ${v} (${VOLUME_LEVELS[v].label})...`);
    const tocLists = extractTocWordLists(v);

    const volIndex = {
      volume: v,
      level: VOLUME_LEVELS[v],
      units: []
    };

    for (const item of tocLists) {
      const u = item.unit;
      const data = extractUnit(v, u, item.words);
      const uPadded = String(u).padStart(2, '0');
      const outFile = path.join(volDir, `unit-${uPadded}.json`);
      fs.writeFileSync(outFile, JSON.stringify(data, null, 2), 'utf-8');

      grandTotalUnits++;
      grandTotalWords += data.targetWords.length;

      volIndex.units.push({
        unit: u,
        id: data.id,
        title: data.story.title,
        targetWordsCount: data.targetWords.length,
        storyWordCount: data.story.wordCount,
        questionsCount: data.questions.length,
        audio: data.audio,
        jsonPath: `data/extracted/words4000/vol-${v}/unit-${uPadded}.json`
      });

      console.log(`  ✔ Unit ${String(u).padStart(2, ' ')}: "${data.story.title}" (${data.targetWords.length} words, ${data.questions.length} questions)`);
    }

    allIndexData.push(volIndex);
    console.log(`--- Volume ${v} Complete: 30 units extracted.\n`);
  }

  // Write master index
  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(allIndexData, null, 2), 'utf-8');

  console.log('==============================================');
  console.log(`Extraction Complete!`);
  console.log(`Total Volumes Processed: ${volumesToProcess.length}`);
  console.log(`Total Units Generated: ${grandTotalUnits}`);
  console.log(`Total Target Words Extracted: ${grandTotalWords}`);
  console.log(`Master index saved to: ${indexPath}`);
}

if (process.argv[1] && process.argv[1].endsWith('extract-4000-words.mjs')) {
  const args = process.argv.slice(2);
  const volArg = args.find(a => a.startsWith('--vol='));
  const targetVol = volArg ? parseInt(volArg.split('=')[1]) : null;

  runFullExtraction(targetVol).catch(err => {
    console.error('Fatal extraction error:', err);
    process.exit(1);
  });
}
