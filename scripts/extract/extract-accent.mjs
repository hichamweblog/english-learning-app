#!/usr/bin/env node
/**
 * American Accent Course Deterministic Extractor
 * Extracts phonetic rules, mouth positioning guides, and transcripts for AJ Hoge units.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { cleanLine, normalizeTypography } from './cleaners.mjs';

const CATALOG_PATH = path.resolve('public/data/american-accent.json');
const OUTPUT_DIR = path.resolve('public/data/extracted/accent');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

export function extractAccentUnit(pdfAbsolutePath, meta = {}) {
  if (!fs.existsSync(pdfAbsolutePath)) {
    throw new Error(`PDF not found: ${pdfAbsolutePath}`);
  }

  const raw = execSync(`pdftotext "${pdfAbsolutePath}" -`).toString();
  const text = normalizeTypography(raw).replace(/\f/g, '\n\n').trim();

  // Extract title e.g. "Unit 6 – TH Sound" or "Unit 5 - Vibration" or "Introduction"
  let title = meta.title || `Unit ${meta.number}`;
  const lines = text.split('\n').map(l => cleanLine(l)).filter(Boolean);
  const titleLine = lines.find(l => /^Unit\s*\d+\s*[-–—]/i.test(l) || /^(?:Introduction|Pronunciation)/i.test(l));
  
  if (titleLine) {
    title = titleLine.replace(/^Unit\s*\d+\s*[-–—]\s*/i, '');
  }

  return {
    id: meta.id || `accent-${meta.number}`,
    unitNumber: meta.number,
    title: title,
    audioPath: meta.audioPath || null,
    videoPath: meta.videoPath || null,
    pdfPath: meta.pdfPath || null,
    levelLabel: meta.levelLabel || 'All Levels (Pronunciation)',
    content: text,
    extractedAt: new Date().toISOString()
  };
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  const units = catalog.filter(u => u.pdfPath);

  console.log(`Extracting ${units.length} American Accent units...`);
  const extracted = [];

  for (const u of units) {
    const fullPdfPath = path.resolve('public', u.pdfPath);
    try {
      const data = extractAccentUnit(fullPdfPath, u);
      const outFileName = `unit-${String(u.number).padStart(2, '0')}.json`;
      fs.writeFileSync(path.join(OUTPUT_DIR, outFileName), JSON.stringify(data, null, 2));
      extracted.push(data);
      console.log(`✔ [OK] Accent Unit ${u.number} (${data.title}): ${data.content.length} chars`);
    } catch (err) {
      console.error(`✖ [FAIL] Accent Unit ${u.number}: ${err.message}`);
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.json'), JSON.stringify(extracted, null, 2));
  console.log(`\n✔ Completed American Accent extraction: ${extracted.length} units extracted.`);
}

if (process.argv[1] && process.argv[1].endsWith('extract-accent.mjs')) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
