#!/usr/bin/env node
/**
 * Cultural English (English Café) Deterministic Content Extractor
 * Extracts Topics, Glossary, "What Insiders Know", and Verbatim Transcripts from PDFs.
 * 100% faithful and deterministic. Zero generative AI.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  normalizeTypography,
  stripEsldPodWatermarks,
  extractHeaderMeta,
  cleanLine
} from './cleaners.mjs';

const CATALOG_PATH = path.resolve('public/data/cultural-english.json');
const OUTPUT_DIR = path.resolve('public/data/extracted/cultural');
const TRANSCRIPTS_DIR = path.resolve('public/data/extracted/transcripts/cultural');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });

export function extractCulturalEpisodeContent(pdfAbsolutePath, fallbackMeta = {}) {
  if (!fs.existsSync(pdfAbsolutePath)) {
    throw new Error(`PDF file does not exist: ${pdfAbsolutePath}`);
  }

  const rawText = execSync(`pdftotext "${pdfAbsolutePath}" -`, { maxBuffer: 10 * 1024 * 1024 }).toString();
  
  // 1. Extract metadata from raw header
  const headerMeta = extractHeaderMeta(rawText);
  const episodeNumber = headerMeta?.number || fallbackMeta.number || null;
  const topics = headerMeta?.topics || [];
  const title = headerMeta?.title || fallbackMeta.title || `English Café ${episodeNumber}`;

  // 2. Strip repeating headers, footers, watermarks
  const text = stripEsldPodWatermarks(rawText);

  // 3. Section division
  const glossaryIdx = text.search(/\bGLOSSARY\b/i);
  const insidersIdx = text.search(/WHAT INSIDERS KNOW/i);
  const transcriptIdx = text.search(/\bCOMPLETE TRANSCRIPT\b/i);

  function getSectionSlice(startIdx, candidateEndIndices) {
    if (startIdx === -1) return '';
    const validEnds = candidateEndIndices.filter(idx => idx > startIdx);
    const endIdx = validEnds.length > 0 ? Math.min(...validEnds) : undefined;
    return text.slice(startIdx, endIdx);
  }

  // 4. Parse Glossary
  const glossarySlice = getSectionSlice(glossaryIdx, [insidersIdx, transcriptIdx])
    .replace(/^GLOSSARY\s*/i, '');
  
  const glossaryLines = glossarySlice.split('\n');
  const glossary = [];
  let currentG = null;

  for (const rawLine of glossaryLines) {
    const line = cleanLine(rawLine);
    if (!line) continue;

    const termMatch = line.match(/^([^*•\n]+?)\s+[–—-]\s+(.+)$/);
    const isExample = line.startsWith('*') || line.startsWith('•');

    if (termMatch && !isExample) {
      if (currentG) glossary.push(finalizeGlossaryEntry(currentG));
      currentG = {
        term: cleanLine(termMatch[1]),
        definition: cleanLine(termMatch[2]),
        rawExamples: []
      };
    } else if (isExample && currentG) {
      currentG.rawExamples.push(cleanLine(line.replace(/^[*•\s]+/, '')));
    } else if (currentG) {
      if (currentG.rawExamples.length > 0) {
        currentG.rawExamples[currentG.rawExamples.length - 1] += ' ' + line;
      } else {
        currentG.definition += ' ' + line;
      }
    }
  }
  if (currentG) glossary.push(finalizeGlossaryEntry(currentG));

  function finalizeGlossaryEntry(entry) {
    const primaryExample = entry.rawExamples[0] || '';
    const additional = entry.rawExamples.slice(1);
    return {
      term: entry.term,
      definition: entry.definition,
      exampleSentence: primaryExample || undefined,
      additionalExamples: additional.length > 0 ? additional : undefined
    };
  }

  // 5. Parse What Insiders Know
  let insidersKnow = null;
  if (insidersIdx !== -1) {
    const iSlice = getSectionSlice(insidersIdx, [transcriptIdx])
      .replace(/^WHAT INSIDERS KNOW\s*/i, '')
      .replace(/_{3,}[\s\S]*$/, '');
    
    const iLines = iSlice.trim().split('\n');
    const firstLine = cleanLine(iLines[0]);
    let iTitle = 'What Insiders Know';
    let iContent = iSlice;

    if (firstLine.length < 60 && !firstLine.endsWith('.') && iLines.length > 1) {
      iTitle = firstLine;
      iContent = iLines.slice(1).join('\n').trim();
    }

    insidersKnow = {
      title: iTitle,
      content: iContent.trim()
    };
  }

  // 6. Classify Useful Phrases & Idioms from Glossary
  const usefulPhrases = glossary.filter(
    (g) => g.term.includes(' ') || g.term.startsWith('to ') || g.term.includes('(')
  );

  // 7. Parse Complete Transcript & Save Standalone Text Archive
  let transcript = null;
  if (transcriptIdx !== -1) {
    const tSlice = text.slice(transcriptIdx).replace(/^COMPLETE TRANSCRIPT\s*/i, '').trim();
    const words = tSlice.split(/\s+/).filter(Boolean);
    const numPadded = String(episodeNumber).padStart(4, '0');
    const txtFileName = `${numPadded}.txt`;
    const txtFullPath = path.join(TRANSCRIPTS_DIR, txtFileName);
    fs.writeFileSync(txtFullPath, tSlice, 'utf-8');

    transcript = {
      fullText: tSlice,
      wordCount: words.length,
      txtPath: `data/extracted/transcripts/cultural/${txtFileName}`
    };
  }

  return {
    id: fallbackMeta.id || `cultural-${episodeNumber}`,
    series: 'cultural-english',
    seriesTitle: 'Cultural English',
    episodeNumber: episodeNumber,
    title: title,
    topics: topics,
    audioPath: fallbackMeta.audioPath || null,
    pdfPath: fallbackMeta.pdfPath || null,
    glossary: glossary,
    usefulPhrases: usefulPhrases,
    insidersKnow: insidersKnow,
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
    // Default Anchor Test Batch: 1-5, 300-304
    const anchorNumbers = [1, 2, 3, 4, 5, 300, 301, 302, 303, 304];
    targetEpisodes = catalog.filter(ep => anchorNumbers.includes(ep.number));
    console.log(`Running Cultural English on Anchor Batch (${targetEpisodes.length} episodes)...`);
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const ep of targetEpisodes) {
    if (!ep.pdfPath) {
      console.warn(`[SKIP] Cultural Episode ${ep.number} has no pdfPath.`);
      continue;
    }

    const fullPdfPath = path.resolve('public', ep.pdfPath);
    try {
      const data = extractCulturalEpisodeContent(fullPdfPath, ep);
      const outFileName = `${String(ep.number).padStart(4, '0')}.json`;
      fs.writeFileSync(path.join(OUTPUT_DIR, outFileName), JSON.stringify(data, null, 2));
      successCount++;
      if (allArg) {
        if (successCount % 50 === 0 || successCount === targetEpisodes.length) {
          console.log(`[PROGRESS] Extracted ${successCount} / ${targetEpisodes.length} Cultural episodes...`);
        }
      } else {
        console.log(`✔ [OK] Cultural Ep ${ep.number} (${data.topics.slice(0, 2).join('; ')}...): ${data.glossary.length} words, insiders: ${data.insidersKnow ? data.insidersKnow.title : 'none'}`);
      }
    } catch (err) {
      errorCount++;
      errors.push({ number: ep.number, error: err.message });
      console.error(`✖ [FAIL] Cultural Episode ${ep.number}: ${err.message}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Cultural Extraction Complete: ${successCount} successful, ${errorCount} failed.`);
  if (errors.length > 0) {
    console.error('Errors encountered:', errors);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('extract-cultural-english.mjs')) {
  main().catch(err => {
    console.error('Cultural extraction fatal error:', err);
    process.exit(1);
  });
}
