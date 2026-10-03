#!/usr/bin/env node
/**
 * Extracted Content Validation Suite
 * Runs automated schema and pedagogical invariant checks on all extracted JSON.
 */

import fs from 'fs';
import path from 'path';

const EXTRACTED_DIR = path.resolve('public/data/extracted');

let totalFiles = 0;
let totalPassed = 0;
let failures = [];

function validateGlossary(glossary, epId) {
  if (!Array.isArray(glossary)) {
    failures.push(`${epId}: glossary is not an array`);
    return false;
  }
  for (let i = 0; i < glossary.length; i++) {
    const item = glossary[i];
    if (!item.term || typeof item.term !== 'string') {
      failures.push(`${epId}: glossary item #${i} has empty or missing term`);
      return false;
    }
    if (!item.definition || typeof item.definition !== 'string') {
      failures.push(`${epId}: glossary item "${item.term}" has empty definition`);
      return false;
    }
    if (item.definition.includes('easytalk.ir') || item.definition.includes('These materials are copyrighted')) {
      failures.push(`${epId}: glossary item "${item.term}" contains watermark residual in definition`);
      return false;
    }
  }
  return true;
}

function validateQuestions(questions, epId) {
  if (!Array.isArray(questions)) return true;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question) {
      failures.push(`${epId}: question #${i + 1} has empty question text`);
      return false;
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      failures.push(`${epId}: question #${i + 1} must have at least 2 options`);
      return false;
    }
    if (q.correctAnswer && !['a', 'b', 'c', 'd'].includes(q.correctAnswer.toLowerCase())) {
      failures.push(`${epId}: question #${i + 1} has invalid correctAnswer "${q.correctAnswer}"`);
      return false;
    }
  }
  return true;
}

function validateTranscript(transcript, epId) {
  if (!transcript) return true;
  if (!transcript.fullText || transcript.fullText.length < 300) {
    failures.push(`${epId}: transcript is suspiciously short (< 300 chars)`);
    return false;
  }
  return true;
}

function checkDirectory(dirName, type) {
  const dirPath = path.join(EXTRACTED_DIR, dirName);
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Validating ${files.length} ${type} extracted files...`);

  for (const file of files) {
    totalFiles++;
    const filePath = path.join(dirPath, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const epId = data.id || file;

      let valid = true;
      if (type === 'Daily' || type === 'Cultural') {
        valid = validateGlossary(data.glossary, epId) && valid;
        if (type === 'Daily') {
          valid = validateQuestions(data.questions, epId) && valid;
        }
      } else if (type === 'VIP') {
        if (!Array.isArray(data.vocabulary) || data.vocabulary.length === 0) {
          failures.push(`${epId}: VIP vocabulary is empty`);
          valid = false;
        }
      }

      valid = validateTranscript(data.transcript, epId) && valid;

      if (valid) {
        totalPassed++;
      }
    } catch (err) {
      failures.push(`${file}: JSON parse error - ${err.message}`);
    }
  }
}

console.log('=== Extracted Content Validation Suite ===\n');

checkDirectory('daily', 'Daily');
checkDirectory('cultural', 'Cultural');
checkDirectory('vip', 'VIP');

console.log('\n==========================================');
console.log(`Total Extracted Files Checked: ${totalFiles}`);
console.log(`Total Passed: ${totalPassed}`);
console.log(`Failures: ${failures.length}`);

if (failures.length > 0) {
  console.error('\nFailures detail:');
  failures.forEach(f => console.error('  - ' + f));
  process.exit(1);
} else {
  console.log('\n✔ All extracted content passed pedagogical integrity & schema validation!\n');
}
