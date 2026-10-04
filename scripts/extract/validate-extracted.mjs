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
        if (data.pdfPath !== null && (!Array.isArray(data.vocabulary) || data.vocabulary.length === 0)) {
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

function check4000Words() {
  const wordsDir = path.join(EXTRACTED_DIR, 'words4000');
  if (!fs.existsSync(wordsDir)) return;

  console.log('Validating 4000 Essential English Words (6 volumes, 180 units)...');
  for (let v = 1; v <= 6; v++) {
    const volDir = path.join(wordsDir, `vol-${v}`);
    if (!fs.existsSync(volDir)) {
      failures.push(`words4000: missing volume directory vol-${v}`);
      continue;
    }

    const files = fs.readdirSync(volDir).filter(f => f.endsWith('.json') && f !== 'index.json');
    for (const f of files) {
      totalFiles++;
      const p = path.join(volDir, f);
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const unitId = data.id || `v${v}-${f}`;
        let valid = true;

        if (!Array.isArray(data.targetWords) || data.targetWords.length < 18) {
          failures.push(`${unitId}: insufficient target words (${data.targetWords ? data.targetWords.length : 0})`);
          valid = false;
        }

        if (!data.story || !data.story.passage || data.story.passage.length < 200) {
          failures.push(`${unitId}: missing or short story passage (< 200 chars)`);
          valid = false;
        }

        const txtPath = path.resolve('public', data.story.txtPath);
        if (!fs.existsSync(txtPath)) {
          failures.push(`${unitId}: missing transcript txt file at ${txtPath}`);
          valid = false;
        }

        const a1 = path.resolve('public', data.audio.wordsAudioPath);
        const a2 = path.resolve('public', data.audio.storyAudioPath);
        if (!fs.existsSync(a1)) {
          failures.push(`${unitId}: missing words audio ${data.audio.wordsAudioPath}`);
          valid = false;
        }
        if (!fs.existsSync(a2)) {
          failures.push(`${unitId}: missing story audio ${data.audio.storyAudioPath}`);
          valid = false;
        }

        if (valid) totalPassed++;
      } catch (err) {
        failures.push(`${f}: JSON parse error - ${err.message}`);
      }
    }
  }
}

function checkFluentRegular() {
  const dirPath = path.join(EXTRACTED_DIR, 'fluent');
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Validating ${files.length} Speak Fluent English extracted lessons...`);

  for (const file of files) {
    totalFiles++;
    const filePath = path.join(dirPath, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      let valid = true;
      if (!data.id || !data.title || !data.dialogue) {
        failures.push(`${file}: missing required fields`);
        valid = false;
      }
      if (data.hasAudio && !fs.existsSync(path.resolve('public', data.audioPath))) {
        failures.push(`${file}: audio file not found on disk: ${data.audioPath}`);
        valid = false;
      }
      valid = validateTranscript(data.transcript, data.id) && valid;
      if (valid) totalPassed++;
    } catch (err) {
      failures.push(`${file}: JSON parse error - ${err.message}`);
    }
  }
}

function checkEtaw() {
  const dirPath = path.join(EXTRACTED_DIR, 'etaw');
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json') && f !== 'index.json');
  console.log(`Validating ${files.length} English the American Way units...`);

  for (const file of files) {
    totalFiles++;
    const filePath = path.join(dirPath, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      let valid = true;
      if (!data.id || !data.title || !Array.isArray(data.dialogues)) {
        failures.push(`${file}: missing required fields`);
        valid = false;
      }
      for (const dlg of data.dialogues) {
        if (dlg.hasAudio && !fs.existsSync(path.resolve('public', dlg.audioPath))) {
          failures.push(`${file}: missing audio file for dialogue ${dlg.dialogueNumber}: ${dlg.audioPath}`);
          valid = false;
        }
      }
      valid = validateTranscript(data.transcript, data.id) && valid;
      if (valid) totalPassed++;
    } catch (err) {
      failures.push(`${file}: JSON parse error - ${err.message}`);
    }
  }
}

function checkReaders() {
  const dirPath = path.join(EXTRACTED_DIR, 'readers');
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json') && f !== 'index.json' && !f.startsWith('.'));
  console.log(`Validating ${files.length} Graded Readers extracted files...`);

  for (const file of files) {
    totalFiles++;
    const filePath = path.join(dirPath, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      let valid = true;
      if (!data.id || !data.title || !Array.isArray(data.chapters) || data.chapters.length === 0) {
        failures.push(`${file}: missing required reader fields or chapters`);
        valid = false;
      }
      for (const ch of data.chapters) {
        if (ch.hasAudio && !fs.existsSync(path.resolve('public', ch.audioPath))) {
          failures.push(`${file}: missing chapter audio: ${ch.audioPath}`);
          valid = false;
        }
      }
      if (valid) totalPassed++;
    } catch (err) {
      failures.push(`${file}: JSON parse error - ${err.message}`);
    }
  }
}

function checkBooks() {
  const booksDir = path.join(EXTRACTED_DIR, 'books');
  if (!fs.existsSync(booksDir)) return;
  const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.json'));
  console.log(`Validating ${files.length} Pedagogical Reference & Practice books...`);

  for (const file of files) {
    totalFiles++;
    const filePath = path.join(booksDir, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      let valid = true;
      if (!data.id || !data.title) {
        failures.push(`${file}: missing id or title`);
        valid = false;
      }
      if (valid) totalPassed++;
    } catch (err) {
      failures.push(`${file}: JSON parse error - ${err.message}`);
    }
  }
}

console.log('=== Extracted Content Validation Suite ===\n');

checkDirectory('daily', 'Daily');
checkDirectory('cultural', 'Cultural');
checkDirectory('vip', 'VIP');
check4000Words();
checkFluentRegular();
checkEtaw();
checkReaders();
checkBooks();

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
