#!/usr/bin/env node
/**
 * 500 Real English Phrases Deterministic Extractor
 * Extracts Beginner, Intermediate, and Advanced phrase sets with 1:1 audio track mappings.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { cleanLine, normalizeTypography } from './cleaners.mjs';

const PDF_PATH = path.resolve('public/materials/500-Real-English-Phrases-Audio/500-Real-English-Phrases.pdf');
const AUDIO_DIR = path.resolve('public/materials/500-Real-English-Phrases-Audio/500-Phrases-Audio');
const OUTPUT_FILE = path.resolve('public/data/extracted/phrases.json');

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

function simplify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function extractPhrases() {
  if (!fs.existsSync(PDF_PATH)) {
    throw new Error(`PDF not found: ${PDF_PATH}`);
  }

  const raw = execSync(`pdftotext "${PDF_PATH}" -`).toString();
  const audioFiles = fs.existsSync(AUDIO_DIR) ? fs.readdirSync(AUDIO_DIR) : [];

  const pages = raw.split('\f');
  let currentLevel = 'Beginner';
  const categories = [];

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const pageNum = pIdx + 1;
    const pText = normalizeTypography(pages[pIdx]);

    if (pText.includes('~ Beginner Phrases ~')) currentLevel = 'Beginner';
    if (pText.includes('~ Intermediate Phrases ~')) currentLevel = 'Intermediate';
    if (pText.includes('~ Advanced Phrases ~')) currentLevel = 'Advanced';

    const lines = pText.split('\n').map(l => cleanLine(l)).filter(Boolean);
    let currentCat = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line.startsWith('~') ||
        line.includes('www.espressoenglish.net') ||
        line.includes('English Speaking Courses')
      ) {
        continue;
      }

      // Detect category headings like "10 Ways to Say Hello & Goodbye" or "5 Phrases for Apologizing"
      const isHeading =
        /^\d+\s+(?:Ways|Phrases|Informal Ways|Comparative Idioms)/i.test(line) ||
        /(?:Ways to|Phrases for|Phrases about|Phrases to|Expressions for)/i.test(line);

      if (isHeading) {
        if (currentCat && currentCat.phrases.length > 0) {
          categories.push(finalizeCategory(currentCat, audioFiles));
        }

        currentCat = {
          id: `phrase-cat-${categories.length + 1}`,
          page: pageNum,
          level: currentLevel,
          title: line,
          phrases: [],
          notes: []
        };
      } else if (currentCat) {
        const phraseMatch = line.match(/^(\d+)\.\s*(.+)$/);
        if (phraseMatch) {
          currentCat.phrases.push({
            number: parseInt(phraseMatch[1], 10),
            phrase: cleanLine(phraseMatch[2])
          });
        } else if (currentCat.phrases.length > 0) {
          if (line.startsWith('Note:') || line.startsWith('#') || line.startsWith('(')) {
            currentCat.notes.push(line);
          } else {
            // Continuation of previous phrase
            const last = currentCat.phrases[currentCat.phrases.length - 1];
            last.phrase += ' ' + line;
          }
        }
      }
    }

    if (currentCat && currentCat.phrases.length > 0) {
      categories.push(finalizeCategory(currentCat, audioFiles));
    }
  }

  function finalizeCategory(cat, availableAudio) {
    const pagePrefix = `Page${String(cat.page).padStart(2, '0')}`;
    const pageAudios = availableAudio.filter(f => f.startsWith(pagePrefix));
    
    const stopWords = new Set(['ways', 'phrases', 'page', 'about', 'for', 'with', 'from', 'that', 'this', 'informal']);
    let matchedAudio = null;

    if (pageAudios.length === 1) {
      matchedAudio = pageAudios[0];
    } else if (pageAudios.length > 1) {
      const words = cat.title.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !stopWords.has(w));
      let best = pageAudios[0];
      let maxScore = -1;
      for (const a of pageAudios) {
        const aLower = a.toLowerCase();
        let score = 0;
        for (const w of words) {
          if (aLower.includes(w)) score += 2;
        }
        if (score > maxScore) {
          maxScore = score;
          best = a;
        }
      }
      matchedAudio = best;
    }

    return {
      ...cat,
      audioPath: matchedAudio ? `materials/500-Real-English-Phrases-Audio/500-Phrases-Audio/${matchedAudio}` : null,
      totalPhrases: cat.phrases.length
    };
  }

  const result = {
    title: '500 Real English Phrases',
    description: 'Everyday American English conversational phrases categorized by formality, situation, and proficiency level.',
    totalCategories: categories.length,
    totalPhrases: categories.reduce((sum, c) => sum + c.phrases.length, 0),
    extractedAt: new Date().toISOString(),
    categories: categories
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log(`✔ Extracted ${result.totalCategories} phrase categories with ${result.totalPhrases} total phrases to ${OUTPUT_FILE}`);
  return result;
}

if (process.argv[1] && process.argv[1].endsWith('extract-phrases.mjs')) {
  extractPhrases();
}
