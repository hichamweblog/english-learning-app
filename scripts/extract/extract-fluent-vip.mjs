#!/usr/bin/env node
/**
 * Fluent VIP Deterministic Content Extractor
 * Extracts Speaker Dialogues, Slang & Phrases, and Full Audio Transcripts from PDFs.
 * 100% faithful and deterministic. Zero generative AI.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  normalizeTypography,
  cleanLine
} from './cleaners.mjs';

const CATALOG_PATH = path.resolve('public/data/fluent-vip.json');
const OUTPUT_DIR = path.resolve('public/data/extracted/vip');
const TRANSCRIPTS_DIR = path.resolve('public/data/extracted/transcripts/vip');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });

export function extractVipEpisodeContent(pdfAbsolutePath, fallbackMeta = {}) {
  if (!fs.existsSync(pdfAbsolutePath)) {
    throw new Error(`PDF file does not exist: ${pdfAbsolutePath}`);
  }

  const rawText = execSync(`pdftotext "${pdfAbsolutePath}" -`, { maxBuffer: 10 * 1024 * 1024 }).toString();
  let text = normalizeTypography(rawText);

  // Remove form feeds and china232 watermarks
  text = text.replace(/\f/g, '\n\n');
  text = text.replace(/www\.china232\.com/gi, '');
  text = text.replace(/VIP LESSON\s*\d+\s*[-–—]\s*[^\n]+/gi, '');

  // Locate section headers
  const dialogIdx = text.search(/\b(?:Dialog|Dialogue|Reading)\s*:/i);
  const phrasesIdx = text.search(/\bPhrases and Vocabulary Used\s*:/i);
  const transcriptIdx = text.search(/\bFULL PODCAST TRANSCRIPT\s*:/i);

  function getSectionSlice(startIdx, endIdx) {
    if (startIdx === -1) return '';
    return text.slice(startIdx, endIdx !== -1 ? endIdx : undefined);
  }

  // 1. Parse Dialogue or Reading Passage
  let dialog = [];
  let readingPassage = null;

  if (dialogIdx !== -1) {
    const rawSection = getSectionSlice(dialogIdx, phrasesIdx);
    const isReading = /^\s*Reading\s*:/i.test(rawSection);
    const dSlice = rawSection.replace(/^\s*(?:Dialog|Dialogue|Reading)\s*:\s*/i, '').trim();

    if (isReading) {
      readingPassage = dSlice;
    } else {
      const dLines = dSlice.split('\n');
      let currentTurn = null;

      for (const rawLine of dLines) {
        const line = cleanLine(rawLine);
        if (!line) continue;

        const speakerMatch = line.match(/^([A-Z]):\s*(.+)$/);
        if (speakerMatch) {
          if (currentTurn) dialog.push(currentTurn);
          currentTurn = {
            speaker: speakerMatch[1],
            text: speakerMatch[2]
          };
        } else if (currentTurn) {
          currentTurn.text += ' ' + line;
        }
      }
      if (currentTurn) dialog.push(currentTurn);
    }
  }

  // 2. Parse Phrases and Vocabulary Used
  let vocabulary = [];
  if (phrasesIdx !== -1) {
    const pSlice = getSectionSlice(phrasesIdx, transcriptIdx)
      .replace(/^Phrases and Vocabulary Used\s*:\s*/i, '')
      .trim();
    
    const pLines = pSlice.split('\n');
    let currentP = null;

    for (const rawLine of pLines) {
      const line = cleanLine(rawLine);
      if (!line) continue;

      const termMatch = line.match(/^([^:\n]+?):\s*(.+)$/);
      if (termMatch && !line.startsWith('Note:')) {
        if (currentP) vocabulary.push(currentP);
        currentP = {
          term: cleanLine(termMatch[1]),
          definition: cleanLine(termMatch[2]),
          examples: []
        };
      } else if (currentP) {
        // Continuation or example
        currentP.definition += ' ' + line;
      }
    }
    if (currentP) vocabulary.push(currentP);
  }

  // 3. Classify Useful Phrases from Vocabulary
  const usefulPhrases = vocabulary.filter(
    (v) => v.term.includes(' ') || v.term.includes('-')
  );

  // 4. Parse Full Transcript & Save Standalone Text Archive
  let transcript = null;
  if (transcriptIdx !== -1) {
    const tSlice = text.slice(transcriptIdx).replace(/^FULL PODCAST TRANSCRIPT\s*:\s*/i, '').trim();
    const words = tSlice.split(/\s+/).filter(Boolean);
    const numPadded = String(fallbackMeta.number).padStart(4, '0');
    const txtFileName = `${numPadded}.txt`;
    const txtFullPath = path.join(TRANSCRIPTS_DIR, txtFileName);
    fs.writeFileSync(txtFullPath, tSlice, 'utf-8');

    transcript = {
      fullText: tSlice,
      wordCount: words.length,
      txtPath: `data/extracted/transcripts/vip/${txtFileName}`
    };
  }

  return {
    id: fallbackMeta.id || `vip-${fallbackMeta.number}`,
    series: 'fluent-vip',
    seriesTitle: 'Fluent English VIP (Real Slang & Nuance)',
    episodeNumber: fallbackMeta.number,
    title: fallbackMeta.title,
    audioPath: fallbackMeta.audioPath || null,
    pdfPath: fallbackMeta.pdfPath || null,
    dialog: dialog,
    readingPassage: readingPassage || undefined,
    vocabulary: vocabulary,
    usefulPhrases: usefulPhrases,
    transcript: transcript,
    extractedAt: new Date().toISOString()
  };
}

// CLI Execution Support
async function main() {
  const args = process.argv.slice(2);
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));

  let targetEpisodes = [];

  const rangeArg = args.find(a => a.startsWith('--range=') || a === '--range');
  const allArg = args.includes('--all');

  if (allArg) {
    targetEpisodes = catalog;
  } else if (rangeArg) {
    const rangeVal = rangeArg.includes('=') ? rangeArg.split('=')[1] : args[args.indexOf('--range') + 1];
    const [start, end] = rangeVal.split('-').map(Number);
    targetEpisodes = catalog.filter(ep => ep.number >= start && ep.number <= end);
  } else {
    // Default Anchor Test Batch: 1-5, 100-104
    const anchorNumbers = [1, 2, 3, 4, 5, 100, 101, 102, 103, 104];
    targetEpisodes = catalog.filter(ep => anchorNumbers.includes(ep.number));
    console.log(`Running Fluent VIP on Anchor Batch (${targetEpisodes.length} episodes)...`);
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const ep of targetEpisodes) {
    if (!ep.pdfPath) {
      console.warn(`[SKIP] VIP Episode ${ep.number} has no pdfPath.`);
      continue;
    }

    const fullPdfPath = path.resolve('public', ep.pdfPath);
    try {
      const data = extractVipEpisodeContent(fullPdfPath, ep);
      const outFileName = `${String(ep.number).padStart(4, '0')}.json`;
      fs.writeFileSync(path.join(OUTPUT_DIR, outFileName), JSON.stringify(data, null, 2));
      successCount++;
      console.log(`✔ [OK] VIP Ep ${ep.number} (${data.title}): ${data.dialog.length} turns, ${data.vocabulary.length} slang terms, transcript: ${data.transcript ? 'yes' : 'no'}`);
    } catch (err) {
      errorCount++;
      errors.push({ number: ep.number, error: err.message });
      console.error(`✖ [FAIL] VIP Episode ${ep.number}: ${err.message}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`VIP Extraction Complete: ${successCount} successful, ${errorCount} failed.`);
  if (errors.length > 0) {
    console.error('Errors encountered:', errors);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('extract-fluent-vip.mjs')) {
  main().catch(err => {
    console.error('VIP extraction fatal error:', err);
    process.exit(1);
  });
}
