#!/usr/bin/env node
/**
 * Daily English Deterministic Content Extractor
 * Extracts Glossary, Questions, Culture Notes, and Verbatim Transcripts from PDFs.
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

const CATALOG_PATH = path.resolve('public/data/daily-english.json');
const OUTPUT_DIR = path.resolve('public/data/extracted/daily');
const TRANSCRIPTS_DIR = path.resolve('public/data/extracted/transcripts/daily');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });

export function extractDailyEpisodeContent(pdfAbsolutePath, fallbackMeta = {}) {
  if (!fs.existsSync(pdfAbsolutePath)) {
    throw new Error(`PDF file does not exist: ${pdfAbsolutePath}`);
  }

  // Extract raw text with Poppler pdftotext
  const rawText = execSync(`pdftotext "${pdfAbsolutePath}" -`, { maxBuffer: 10 * 1024 * 1024 }).toString();
  
  // 1. Extract metadata from raw header before stripping
  const headerMeta = extractHeaderMeta(rawText);
  const episodeNumber = headerMeta?.number || fallbackMeta.number || null;
  const title = headerMeta?.title || fallbackMeta.title || `Episode ${episodeNumber}`;

  // 2. Strip repeating headers, footers, watermarks
  const text = stripEsldPodWatermarks(rawText);

  // 3. Section division
  const glossaryIdx = text.search(/\bGLOSSARY\b/i);
  const questionsIdx = text.search(/\bCOMPREHENSION QUESTIONS\b/i);
  const whatElseIdx = text.search(/WHAT ELSE DOES IT MEAN\?/i);
  const cultureIdx = text.search(/\bCULTURE NOTE\b/i);
  const transcriptIdx = text.search(/\bCOMPLETE TRANSCRIPT\b/i);

  function getSectionSlice(startIdx, candidateEndIndices) {
    if (startIdx === -1) return '';
    const validEnds = candidateEndIndices.filter(idx => idx > startIdx);
    const endIdx = validEnds.length > 0 ? Math.min(...validEnds) : undefined;
    return text.slice(startIdx, endIdx);
  }

  // 4. Parse Glossary
  const glossarySlice = getSectionSlice(glossaryIdx, [questionsIdx, whatElseIdx, cultureIdx, transcriptIdx])
    .replace(/^GLOSSARY\s*/i, '');
  
  const glossaryLines = glossarySlice.split('\n');
  const glossary = [];
  let currentG = null;

  for (const rawLine of glossaryLines) {
    const line = cleanLine(rawLine);
    if (!line) continue;

    // Pattern: term [–—-] definition
    // Exclude example markers (* or •)
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

  // 5. Parse Comprehension Question Answers
  const answers = {};
  const answerMatch = text.match(/Comprehension Questions Correct Answers:\s*([^\n\r]+)/i);
  if (answerMatch) {
    const pairs = answerMatch[1].split(/[;,]/);
    for (const pair of pairs) {
      const m = pair.match(/(\d+)\s*[–—:-]\s*([a-dA-D])/);
      if (m) {
        answers[parseInt(m[1], 10)] = m[2].toLowerCase();
      }
    }
  }

  // 6. Parse Comprehension Questions
  const questions = [];
  if (questionsIdx !== -1) {
    const qSlice = getSectionSlice(questionsIdx, [whatElseIdx, cultureIdx, transcriptIdx])
      .replace(/^COMPREHENSION QUESTIONS\s*/i, '')
      .replace(/_{3,}[\s\S]*$/, ''); // remove separator
    
    const qLines = qSlice.split('\n');
    let currentQ = null;

    for (const rawLine of qLines) {
      const line = cleanLine(rawLine);
      if (!line) continue;

      const qNumMatch = line.match(/^(\d+)\.\s*(.+)$/);
      const optMatch = line.match(/^([a-d])\)\s*(.+)$/i);

      if (qNumMatch) {
        if (currentQ) questions.push(currentQ);
        const qNum = parseInt(qNumMatch[1], 10);
        currentQ = {
          questionNumber: qNum,
          question: qNumMatch[2],
          options: [],
          correctAnswer: answers[qNum] || undefined
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
  }

  // 7. Parse What Else Does It Mean
  const whatElse = [];
  if (whatElseIdx !== -1) {
    const wSlice = getSectionSlice(whatElseIdx, [cultureIdx, transcriptIdx])
      .replace(/^WHAT ELSE DOES IT MEAN\?\s*/i, '');
    const wLines = wSlice.split('\n');
    let currentW = null;

    for (const rawLine of wLines) {
      const line = cleanLine(rawLine);
      if (!line || line.startsWith('___')) continue;

      const isHeading = (line.length < 40 && !line.endsWith('.') && !line.startsWith('"') && !currentW?.explanation) ||
                        (line.length < 35 && !line.endsWith('.') && currentW && currentW.explanation.length > 60);

      if (isHeading) {
        if (currentW) whatElse.push(currentW);
        currentW = { term: line, explanation: '' };
      } else if (currentW) {
        currentW.explanation = (currentW.explanation ? currentW.explanation + '\n\n' : '') + line;
      }
    }
    if (currentW) whatElse.push(currentW);
  }

  // 8. Parse Culture Note
  let cultureNote = null;
  if (cultureIdx !== -1) {
    let cSlice = getSectionSlice(cultureIdx, [transcriptIdx])
      .replace(/^CULTURE NOTE\s*/i, '')
      .replace(/_{3,}[\s\S]*$/, '')
      .replace(/Comprehension Questions Correct Answers:[\s\S]*$/i, '');
    
    const cLines = cSlice.trim().split('\n');
    const firstLine = cleanLine(cLines[0]);
    let cTitle = 'Culture Note';
    let cContent = cSlice;

    if (firstLine.length < 60 && !firstLine.endsWith('.') && cLines.length > 1) {
      cTitle = firstLine;
      cContent = cLines.slice(1).join('\n').trim();
    }

    cultureNote = {
      title: cTitle,
      content: cContent.trim()
    };
  }

  // 9. Classify Useful Phrases & Idioms from Glossary
  const usefulPhrases = glossary.filter(
    (g) => g.term.includes(' ') || g.term.startsWith('to ') || g.term.includes('(')
  );

  // 10. Parse Complete Transcript & Save Standalone Text Archive
  let transcript = null;
  if (transcriptIdx !== -1) {
    const tSlice = text.slice(transcriptIdx).replace(/^COMPLETE TRANSCRIPT\s*/i, '').trim();
    
    const dialogueMatch = tSlice.match(/\[start of (?:story|dialogue)\]([\s\S]*?)\[end of (?:story|dialogue)\]/i);
    const dialogue = dialogueMatch ? dialogueMatch[1].trim() : undefined;

    const words = tSlice.split(/\s+/).filter(Boolean);
    const numPadded = String(episodeNumber).padStart(4, '0');
    const txtFileName = `${numPadded}.txt`;
    const txtFullPath = path.join(TRANSCRIPTS_DIR, txtFileName);
    fs.writeFileSync(txtFullPath, tSlice, 'utf-8');

    transcript = {
      dialogue: dialogue,
      fullText: tSlice,
      wordCount: words.length,
      txtPath: `data/extracted/transcripts/daily/${txtFileName}`
    };
  }

  return {
    id: fallbackMeta.id || `daily-${episodeNumber}`,
    series: 'daily-english',
    seriesTitle: 'Daily English',
    episodeNumber: episodeNumber,
    title: title,
    audioPath: fallbackMeta.audioPath || null,
    pdfPath: fallbackMeta.pdfPath || null,
    glossary: glossary,
    usefulPhrases: usefulPhrases,
    questions: questions,
    whatElse: whatElse,
    cultureNote: cultureNote,
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
    // Default Anchor Test Batch: 1-10, 500-505, 1245-1250
    const anchorNumbers = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      500, 501, 502, 503, 504, 505,
      1245, 1246, 1247, 1248, 1249, 1250
    ];
    targetEpisodes = catalog.filter(ep => anchorNumbers.includes(ep.number));
    console.log(`Running on Anchor Batch (${targetEpisodes.length} episodes)...`);
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const ep of targetEpisodes) {
    if (!ep.pdfPath) {
      console.warn(`[SKIP] Episode ${ep.number} has no pdfPath.`);
      continue;
    }

    const fullPdfPath = path.resolve('public', ep.pdfPath);
    try {
      const data = extractDailyEpisodeContent(fullPdfPath, ep);
      const outFileName = `${String(ep.number).padStart(4, '0')}.json`;
      fs.writeFileSync(path.join(OUTPUT_DIR, outFileName), JSON.stringify(data, null, 2));
      successCount++;
      if (allArg) {
        if (successCount % 100 === 0 || successCount === targetEpisodes.length) {
          console.log(`[PROGRESS] Extracted ${successCount} / ${targetEpisodes.length} Daily episodes...`);
        }
      } else {
        console.log(`✔ [OK] Ep ${ep.number} (${data.title}): ${data.glossary.length} words, ${data.questions.length} questions, ${data.transcript ? 'transcript' : 'no transcript'}`);
      }
    } catch (err) {
      errorCount++;
      errors.push({ number: ep.number, error: err.message });
      console.error(`✖ [FAIL] Episode ${ep.number}: ${err.message}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Extraction Complete: ${successCount} successful, ${errorCount} failed.`);
  if (errors.length > 0) {
    console.error('Errors encountered:', errors);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('extract-daily-english.mjs')) {
  main().catch(err => {
    console.error('Extraction script fatal error:', err);
    process.exit(1);
  });
}
