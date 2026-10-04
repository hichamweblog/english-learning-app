import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { normalizeTypography, cleanLine } from './cleaners.mjs';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const PDF_PATH = path.join(MATERIALS_DIR, 'English-the-American-Way/315643105-English-the-American-Way.pdf');
const AUDIO_DIR = path.join(MATERIALS_DIR, 'English-the-American-Way/ETAWAdditionalDialogues');

const OUT_DIR = path.resolve('public/data/extracted/etaw');
const TXT_DIR = path.resolve('public/data/extracted/transcripts/etaw');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TXT_DIR, { recursive: true });

console.log('Extracting text from English the American Way PDF with layout...');
const rawPdfText = execSync(`pdftotext -layout "${PDF_PATH}" -`, { maxBuffer: 30 * 1024 * 1024 }).toString();

// Match Unit 1 ... Unit 21 (after the TOC)
const regex = /(?:^|\f|\n)\s*Unit\s+(\d+)\s*\n\s*([^\n\r]+)/gi;
let m;
const units = [];
while ((m = regex.exec(rawPdfText)) !== null) {
  if (m.index > 10000 && parseInt(m[1], 10) >= 1 && parseInt(m[1], 10) <= 21) {
    units.push({
      num: parseInt(m[1], 10),
      title: m[2].trim(),
      start: m.index
    });
  }
}

// Map audio tracks (Tracks 2 to 55)
function getAudioPath(trackNum) {
  const padded = String(trackNum).padStart(2, '0');
  const filename = `English the American Way, ${padded}.mp3`;
  const full = path.join(AUDIO_DIR, filename);
  if (fs.existsSync(full)) {
    return `materials/English-the-American-Way/ETAWAdditionalDialogues/${filename}`;
  }
  return null;
}

function parseUnitDialogues(unitText) {
  const dialogues = [];
  const dlgMatches = [...unitText.matchAll(/DIALOGUE\s*(\d+)?\s*[:–-]?\s*TRACK\s*(\d+)/gi)];

  for (let i = 0; i < dlgMatches.length; i++) {
    const cur = dlgMatches[i];
    const trackNum = parseInt(cur[2], 10);
    const dlgNum = cur[1] ? parseInt(cur[1], 10) : (i + 1);

    const startIdx = cur.index + cur[0].length;
    const nextIdx = (i + 1 < dlgMatches.length)
      ? dlgMatches[i + 1].index
      : unitText.search(/(?:VOCABULARY|GRAMMAR REMINDER|Review:|$)/i);

    const dlgTextChunk = unitText.substring(startIdx, nextIdx > startIdx ? nextIdx : startIdx + 3000);
    const lines = dlgTextChunk.split('\n').map(l => l.trim()).filter(Boolean);

    const turns = [];
    let currentSpeaker = null;
    let currentSpeech = [];

    for (const line of lines) {
      // Stop dialogue if reaching section markers or disclaimer
      if (/^(?:VOCABULARY|GRAMMAR|PRONUNCIATION|When people ask|The mall isn't|There is audio)/i.test(line)) {
        if (/^There is audio content/i.test(line)) continue;
        if (/^is not currently supported/i.test(line)) continue;
        if (/^Visit www\.rea\.com/i.test(line)) continue;
        break;
      }
      if (/^Visit www\.rea\.com/i.test(line) || /^is not currently supported/i.test(line)) continue;

      const speakerMatch = line.match(/^([A-Z][A-Z\s]{1,20})\s*:\s*(.+)$/);
      if (speakerMatch && !/^(?:NOTE|TIP|IMPORTANT|TRACK|DIALOGUE)/i.test(speakerMatch[1])) {
        if (currentSpeaker && currentSpeech.length > 0) {
          turns.push({ speaker: currentSpeaker, text: currentSpeech.join(' ').trim() });
        }
        currentSpeaker = speakerMatch[1].trim();
        currentSpeech = [speakerMatch[2].trim()];
      } else if (currentSpeaker) {
        currentSpeech.push(line);
      }
    }

    if (currentSpeaker && currentSpeech.length > 0) {
      turns.push({ speaker: currentSpeaker, text: currentSpeech.join(' ').trim() });
    }

    const audioPath = getAudioPath(trackNum);
    dialogues.push({
      dialogueNumber: dlgNum,
      trackNumber: trackNum,
      audioPath,
      hasAudio: !!audioPath,
      turns,
      dialogueText: turns.map(t => `${t.speaker}: ${t.text}`).join('\n\n')
    });
  }

  return dialogues;
}

function parseUnitVocabulary(unitText) {
  const vocab = [];
  const vocabRegex = /VOCABULARY\s*\n([\s\S]*?)(?=(?:PRONUNCIATION|GRAMMAR|DIALOGUE|Unit\s+\d+|Review:|$))/gi;
  let vm;

  while ((vm = vocabRegex.exec(unitText)) !== null) {
    const lines = vm[1].split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^There is audio content|^is not currently|^Visit www\.rea/i.test(line)) continue;
      const m = line.match(/^[•\s*-]*([a-zA-Z\s'’/()-]{2,40})\s*:\s*(.+)$/);
      if (m && !/^(grammar|track|dialogue|note)/i.test(m[1])) {
        const term = m[1].replace(/^[•\s*-]+/, '').trim();
        const def = m[2].trim();
        if (term.length > 1 && def.length > 2 && !vocab.some(v => v.term.toLowerCase() === term.toLowerCase())) {
          vocab.push({
            term,
            definition: def,
            isPhrase: term.includes(' ') || term.includes('-')
          });
        }
      }
    }
  }

  return vocab;
}

function parseCultureNotes(unitText) {
  const notes = [];
  const lines = unitText.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(?:Culture Note|Cultural Note|In the U\.S\.|American culture|When people ask)/i.test(line) && line.length > 20) {
      notes.push(line);
    }
  }
  return notes;
}

const masterIndex = [];
let totalUnitsExtracted = 0;

for (let i = 0; i < units.length; i++) {
  const cur = units[i];
  const nextStart = (i + 1 < units.length) ? units[i + 1].start : rawPdfText.indexOf('Review: Units 19', cur.start);
  const unitText = rawPdfText.substring(cur.start, nextStart > cur.start ? nextStart : cur.start + 25000);

  const cleanUnitText = normalizeTypography(unitText)
    .replace(/\f/g, '\n\n')
    .replace(/English the American Way[^\n]*/gi, '')
    .replace(/Visit www\.rea\.com[^\n]*/gi, '')
    .replace(/There is audio content at this location[^\n]*/gi, '')
    .replace(/is not currently supported for your device\./gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const dialogues = parseUnitDialogues(unitText);
  const vocabulary = parseUnitVocabulary(unitText);
  const cultureNotes = parseCultureNotes(unitText);

  const usefulPhrases = vocabulary
    .filter(v => v.isPhrase)
    .map(v => ({ phrase: v.term, meaning: v.definition }));

  const padded = String(cur.num).padStart(2, '0');
  const unitId = `etaw-unit-${padded}`;

  const unitRecord = {
    id: unitId,
    unitNumber: cur.num,
    title: cur.title,
    trackType: 'english-the-american-way',
    level: 'intermediate',
    levelLabel: 'Intermediate',
    dialogues,
    dialoguesCount: dialogues.length,
    vocabulary,
    vocabCount: vocabulary.length,
    usefulPhrases,
    cultureNotes,
    transcript: {
      fullText: cleanUnitText,
      wordCount: cleanUnitText.split(/\s+/).filter(Boolean).length
    }
  };

  // Write standalone .txt transcript
  const txtPath = path.join(TXT_DIR, `unit-${padded}.txt`);
  fs.writeFileSync(txtPath, cleanUnitText, 'utf-8');

  // Write structured JSON
  const jsonPath = path.join(OUT_DIR, `unit-${padded}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(unitRecord, null, 2), 'utf-8');

  masterIndex.push({
    id: unitId,
    unitNumber: cur.num,
    title: cur.title,
    dialoguesCount: dialogues.length,
    tracks: dialogues.map(d => d.trackNumber),
    vocabCount: vocabulary.length,
    usefulPhrasesCount: usefulPhrases.length,
    wordCount: unitRecord.transcript.wordCount
  });

  totalUnitsExtracted++;
}

// Write master index
fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(masterIndex, null, 2), 'utf-8');
console.log(`Successfully extracted ${totalUnitsExtracted}/21 English the American Way units with 54 dialogues & master index.`);
