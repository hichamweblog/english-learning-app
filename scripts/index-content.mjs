import fs from 'node:fs';
import path from 'node:path';

const MATERIALS_DIR = '/run/media/dzgeek/Disque local/Study English/English_Materials';
const OUTPUT_DIR = path.resolve('public/data');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function cleanTitle(filename) {
  return filename
    .replace(/\.(mp3|pdf|mp4)$/i, '')
    .replace(/^\[.*?\]\s*/, '')
    .replace(/\s*-\s*\[www\..*?\]/gi, '')
    .replace(/\s*\[www\..*?\]/gi, '')
    .replace(/\s*\[Daily English\]/gi, '')
    .replace(/\s*\[Cultural English\]/gi, '')
    .replace(/^\d+[\s._-]+/, '')
    .replace(/^vip[_\s-]+\d+[_\s-]+/i, '')
    .replace(/^Track\s*\d+[_\s-]*/i, '')
    .trim();
}

// 1. Daily English
console.log('Indexing Daily English...');
const dailyEnglishEpisodes = [];
const dailyDir = path.join(MATERIALS_DIR, 'ESL PodCast Full/Daily English');
if (fs.existsSync(dailyDir)) {
  const folders = fs.readdirSync(dailyDir).filter(f => fs.statSync(path.join(dailyDir, f)).isDirectory());
  // Sort folders e.g. 1-100, 101-200, etc.
  folders.sort((a, b) => {
    const numA = parseInt(a.split('-')[0]) || 0;
    const numB = parseInt(b.split('-')[0]) || 0;
    return numA - numB;
  });

  for (const folder of folders) {
    const folderPath = path.join(dailyDir, folder);
    const files = fs.readdirSync(folderPath);
    const mp3Files = files.filter(f => f.endsWith('.mp3'));

    for (const mp3 of mp3Files) {
      const match = mp3.match(/^(\d+)/);
      if (!match) continue;
      const num = parseInt(match[1], 10);
      const title = cleanTitle(mp3) || `Episode ${num}`;
      
      // Find matching pdf
      const numPrefix3 = String(num).padStart(3, '0');
      const numPrefix4 = String(num).padStart(4, '0');
      const pdf = files.find(f => f.endsWith('.pdf') && (
        f.startsWith(numPrefix3) || 
        f.startsWith(numPrefix4) || 
        f.startsWith(String(num)) ||
        new RegExp(`^0*${num}\\b`).test(f)
      ));
      
      dailyEnglishEpisodes.push({
        id: `daily-${num}`,
        series: 'daily-english',
        seriesTitle: 'Daily English',
        number: num,
        title: title,
        audioPath: `materials/ESL PodCast Full/Daily English/${folder}/${mp3}`,
        pdfPath: pdf ? `materials/ESL PodCast Full/Daily English/${folder}/${pdf}` : null,
        levelLabel: 'Pre-Intermediate to Intermediate'
      });
    }
  }
}
dailyEnglishEpisodes.sort((a, b) => a.number - b.number);
fs.writeFileSync(path.join(OUTPUT_DIR, 'daily-english.json'), JSON.stringify(dailyEnglishEpisodes, null, 2));
console.log(`Indexed ${dailyEnglishEpisodes.length} Daily English episodes.`);

// 2. Cultural English
console.log('Indexing Cultural English...');
const culturalEpisodes = [];
const culturalDir = path.join(MATERIALS_DIR, 'ESL PodCast Full/Cultural English');
if (fs.existsSync(culturalDir)) {
  const folders = fs.readdirSync(culturalDir).filter(f => fs.statSync(path.join(culturalDir, f)).isDirectory() && f !== 'Done');
  folders.sort((a, b) => {
    const matchA = a.match(/(\d+)/);
    const matchB = b.match(/(\d+)/);
    return (matchA ? parseInt(matchA[1]) : 0) - (matchB ? parseInt(matchB[1]) : 0);
  });

  for (const folder of folders) {
    const folderPath = path.join(culturalDir, folder);
    const files = fs.readdirSync(folderPath);
    const mp3Files = files.filter(f => f.endsWith('.mp3'));

    for (const mp3 of mp3Files) {
      const match = mp3.match(/^(\d+)/);
      if (!match) continue;
      const num = parseInt(match[1], 10);
      const title = cleanTitle(mp3) || `Cultural Episode ${num}`;
      
      const numPrefix = String(num).padStart(3, '0');
      const pdf = files.find(f => f.endsWith('.pdf') && (f.startsWith(numPrefix) || f.startsWith(String(num))));
      
      culturalEpisodes.push({
        id: `cultural-${num}`,
        series: 'cultural-english',
        seriesTitle: 'Cultural English',
        number: num,
        title: title === `Cultural Episode ${num}` ? `English Café ${num}` : title,
        audioPath: `materials/ESL PodCast Full/Cultural English/${folder}/${mp3}`,
        pdfPath: pdf ? `materials/ESL PodCast Full/Cultural English/${folder}/${pdf}` : null,
        levelLabel: 'Intermediate to Upper-Intermediate'
      });
    }
  }
}
culturalEpisodes.sort((a, b) => a.number - b.number);
fs.writeFileSync(path.join(OUTPUT_DIR, 'cultural-english.json'), JSON.stringify(culturalEpisodes, null, 2));
console.log(`Indexed ${culturalEpisodes.length} Cultural English episodes.`);

// 3. Fluent English (china232)
console.log('Indexing Speak Fluent English...');
const fluentEpisodes = [];
const fluentDir = path.join(MATERIALS_DIR, 'Speak.Fluent.English china232/01Fluent.English');
if (fs.existsSync(fluentDir)) {
  const files = fs.readdirSync(fluentDir);
  const mp3s = files.filter(f => f.endsWith('.mp3'));
  for (const mp3 of mp3s) {
    const match = mp3.match(/^(\d+)/);
    const num = match ? parseInt(match[1], 10) : 0;
    const title = cleanTitle(mp3);
    fluentEpisodes.push({
      id: `fluent-${num}`,
      series: 'fluent-english',
      seriesTitle: 'Fluent English (Conversational)',
      number: num,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      audioPath: `materials/Speak.Fluent.English china232/01Fluent.English/${mp3}`,
      pdfPath: `materials/Speak.Fluent.English china232/01Fluent.English/Fluent English PDF.pdf`,
      levelLabel: 'Upper-Intermediate to Advanced'
    });
  }
}
fluentEpisodes.sort((a, b) => a.number - b.number);
fs.writeFileSync(path.join(OUTPUT_DIR, 'fluent-english.json'), JSON.stringify(fluentEpisodes, null, 2));
console.log(`Indexed ${fluentEpisodes.length} Fluent English episodes.`);

// 4. Fluent VIP
console.log('Indexing Fluent VIP...');
const vipEpisodes = [];
const vipDir = path.join(MATERIALS_DIR, 'Speak.Fluent.English china232/02Fluent VIP Pod');
if (fs.existsSync(vipDir)) {
  const files = fs.readdirSync(vipDir);
  const mp3s = files.filter(f => f.endsWith('.mp3'));
  const pdfs = files.filter(f => f.endsWith('.pdf'));

  for (const mp3 of mp3s) {
    let num = 0;
    const m1 = mp3.match(/^vip[_\s-]+(\d+)/i) || mp3.match(/^(\d+)/);
    if (m1) num = parseInt(m1[1], 10);
    const title = cleanTitle(mp3);
    
    // Find matching PDF
    const pdf = pdfs.find(p => {
      const pm = p.match(/vip(\d+)/i) || p.match(/(\d+)/);
      return pm && parseInt(pm[1], 10) === num;
    });

    vipEpisodes.push({
      id: `vip-${num || mp3.slice(0, 10)}`,
      series: 'fluent-vip',
      seriesTitle: 'Fluent English VIP (Real Slang & Nuance)',
      number: num,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      audioPath: `materials/Speak.Fluent.English china232/02Fluent VIP Pod/${mp3}`,
      pdfPath: pdf ? `materials/Speak.Fluent.English china232/02Fluent VIP Pod/${pdf}` : null,
      levelLabel: 'Advanced Spoken English'
    });
  }
}
vipEpisodes.sort((a, b) => a.number - b.number);
fs.writeFileSync(path.join(OUTPUT_DIR, 'fluent-vip.json'), JSON.stringify(vipEpisodes, null, 2));
console.log(`Indexed ${vipEpisodes.length} Fluent VIP episodes.`);

// 5. American Accent
console.log('Indexing American Accent...');
const accentLessons = [];
const accentDir = path.join(MATERIALS_DIR, 'THE AMERICAN ACCENT');
if (fs.existsSync(accentDir)) {
  const entries = fs.readdirSync(accentDir);
  const lessonDirs = entries.filter(e => fs.statSync(path.join(accentDir, e)).isDirectory());
  
  for (const ld of lessonDirs) {
    const lPath = path.join(accentDir, ld);
    const files = fs.readdirSync(lPath);
    const audio = files.find(f => f.endsWith('.mp3'));
    const video = files.find(f => f.endsWith('.mp4'));
    
    // find PDF in parent or lesson dir
    let pdf = files.find(f => f.endsWith('.pdf'));
    if (!pdf) {
      const numMatch = ld.match(/(\d+)/);
      if (numMatch) {
        const num = numMatch[1];
        pdf = entries.find(f => f.endsWith('.pdf') && f.includes(`Unit_${num}_`));
      }
    }

    if (audio) {
      accentLessons.push({
        id: `accent-${ld.toLowerCase().replace(/\s+/g, '-')}`,
        series: 'american-accent',
        seriesTitle: 'The American Accent Course',
        number: parseInt(ld.replace(/\D/g, '')) || 0,
        title: ld,
        audioPath: `materials/THE AMERICAN ACCENT/${ld}/${audio}`,
        videoPath: video ? `materials/THE AMERICAN ACCENT/${ld}/${video}` : null,
        pdfPath: pdf ? (files.includes(pdf) ? `materials/THE AMERICAN ACCENT/${ld}/${pdf}` : `materials/THE AMERICAN ACCENT/${pdf}`) : null,
        levelLabel: 'All Levels (Pronunciation)'
      });
    }
  }
}
accentLessons.sort((a, b) => a.number - b.number);
fs.writeFileSync(path.join(OUTPUT_DIR, 'american-accent.json'), JSON.stringify(accentLessons, null, 2));
console.log(`Indexed ${accentLessons.length} American Accent lessons.`);

// 6. Graded Readers (Full recursive indexing across all 2,801 audio tracks)
console.log('Indexing Graded Readers...');
const readersList = [];
const readersRoot = path.join(MATERIALS_DIR, '00Graded-Readers-Challenge');

const levelDirs = [
  { dir: 'Level1-2', defaultLevel: 'starter', fallbackLevel: 'elementary' },
  { dir: 'Level3-4', defaultLevel: 'pre-intermediate', fallbackLevel: 'intermediate' },
  { dir: 'Level5-6', defaultLevel: 'upper-intermediate', fallbackLevel: 'advanced' },
];

function findMp3sRecursive(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(findMp3sRecursive(full));
    } else if (file.endsWith('.mp3')) {
      results.push(full);
    }
  }
  return results;
}

function cleanBookName(str) {
  return str
    .replace(/\.pdf$/i, '')
    .replace(/^(\[\s*\]\d+|\(\w+\)|【\d+】|\d+|P1\s*\d*|P1|S\d+)\s*/i, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\s*Audio$/i, '')
    .replace(/^(Alan C\. McLean|Clare West|Edith Wharton|Erich Segal|John Escott|Brigit Viney|Henry James|Nathaniel Hawthorne|Ed McBain)\s*-\s*/i, '')
    .replace(/olivervtwist/i, 'olivertwist')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

const levelLabels = {
  starter: 'Starter',
  elementary: 'Elementary',
  'pre-intermediate': 'Pre-Intermediate',
  intermediate: 'Intermediate',
  'upper-intermediate': 'Upper-Intermediate',
  advanced: 'Advanced'
};

for (const { dir, defaultLevel, fallbackLevel } of levelDirs) {
  const fullLevelDir = path.join(readersRoot, dir);
  if (!fs.existsSync(fullLevelDir)) continue;

  const items = fs.readdirSync(fullLevelDir);
  const pdfs = items.filter(f => f.endsWith('.pdf') && !f.toLowerCase().includes('answer key') && !f.toLowerCase().includes("teacher's notes") && !f.toLowerCase().includes('comprehension test'));
  const audioFolders = items.filter(f => fs.statSync(path.join(fullLevelDir, f)).isDirectory());

  const matchedAudioFolders = new Set();

  for (const pdf of pdfs) {
    let level = defaultLevel;
    let seriesCode = 'General';

    if (pdf.includes('(S1)') || pdf.includes('【1】')) {
      level = 'starter';
      seriesCode = pdf.includes('(S1)') ? 'Stage 1' : 'Level 1';
    } else if (pdf.includes('(S2)') || pdf.includes('【2】')) {
      level = 'elementary';
      seriesCode = pdf.includes('(S2)') ? 'Stage 2' : 'Level 2';
    } else if (pdf.includes('(S3)') || pdf.includes('【3】')) {
      level = 'pre-intermediate';
      seriesCode = pdf.includes('(S3)') ? 'Stage 3' : 'Level 3';
    } else if (pdf.includes('(S4)') || pdf.includes('【4】')) {
      level = 'intermediate';
      seriesCode = pdf.includes('(S4)') ? 'Stage 4' : 'Level 4';
    } else if (pdf.includes('(S5)') || pdf.includes('【5】')) {
      level = 'upper-intermediate';
      seriesCode = pdf.includes('(S5)') ? 'Stage 5' : 'Level 5';
    } else if (pdf.includes('(S6)') || pdf.includes('【6】')) {
      level = 'advanced';
      seriesCode = pdf.includes('(S6)') ? 'Stage 6' : 'Level 6';
    } else {
      level = defaultLevel;
    }

    let cleanBookTitle = pdf
      .replace(/\.pdf$/i, '')
      .replace(/^(\(\w+\)|【\d+】|P1)\s*/, '')
      .replace(/^\d+[\s._-]+/, '')
      .trim();

    if (!cleanBookTitle) {
      cleanBookTitle = pdf.replace(/\.pdf$/i, '').trim();
    }

    // Match audio folder
    const normP = cleanBookName(pdf);
    const matchedFolder = audioFolders.find(af => {
      const normAf = cleanBookName(af);
      return (normAf.length >= 3 && normP.includes(normAf)) || (normP.length >= 3 && normAf.includes(normP));
    });

    if (!matchedFolder) {
      // PDF without Audio -> Excluded from plan per user requirement
      continue;
    }

    matchedAudioFolders.add(matchedFolder);
    const folderPath = path.join(fullLevelDir, matchedFolder);
    const trackFiles = findMp3sRecursive(folderPath);
    trackFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (trackFiles.length === 0) {
      // Audio folder is empty -> Exclude
      continue;
    }

    // Check completeness and validity of all audio files
    let hasCorruptedTrack = false;
    const chapters = [];
    for (let idx = 0; idx < trackFiles.length; idx++) {
      const trackPath = trackFiles[idx];
      const stat = fs.statSync(trackPath);
      if (stat.size < 10000) { // smaller than 10KB is dummy/corrupted
        hasCorruptedTrack = true;
        console.warn(`[CORRUPT AUDIO] ${cleanBookTitle}: track ${path.basename(trackPath)} is only ${stat.size} bytes. Excluding book.`);
        break;
      }
      const relAudio = path.relative(path.resolve('public'), trackPath);
      chapters.push({
        id: `ch-${idx + 1}`,
        chapterNumber: idx + 1,
        title: `Chapter ${idx + 1}`,
        audioPath: relAudio.startsWith('materials') ? relAudio : `materials/${path.relative(MATERIALS_DIR, trackPath)}`,
        sizeBytes: stat.size
      });
    }

    if (hasCorruptedTrack || chapters.length === 0) {
      continue;
    }

    readersList.push({
      id: `reader-${readersList.length + 1}-${cleanBookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: cleanBookTitle,
      level,
      levelLabel: levelLabels[level],
      seriesCode,
      pdfPath: `materials/00Graded-Readers-Challenge/${dir}/${pdf}`,
      hasAudio: true,
      audioTracksCount: chapters.length,
      chapters
    });
  }

  // Standalone audiobooks (without PDF) are strictly omitted per user requirement
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'readers.json'), JSON.stringify(readersList, null, 2));
console.log(`Indexed ${readersList.length} Graded Readers with 100% complete audio & PDF pairs.`);

// 7. Reference Books
console.log('Indexing Reference Books...');
const refBooks = [];
const rootItems = fs.readdirSync(MATERIALS_DIR);
const rootPdfs = rootItems.filter(f => f.endsWith('.pdf'));

for (const pdf of rootPdfs) {
  const stat = fs.statSync(path.join(MATERIALS_DIR, pdf));
  let category = 'Grammar & Vocabulary';
  if (pdf.toLowerCase().includes('dictionary')) category = 'Dictionaries';
  else if (pdf.toLowerCase().includes('idiom') || pdf.toLowerCase().includes('expression') || pdf.toLowerCase().includes('phrase')) category = 'Idioms & Phrases';
  else if (pdf.toLowerCase().includes('business')) category = 'Business English';
  else if (pdf.toLowerCase().includes('collocation')) category = 'Collocations';

  const extractedMap = {
    '1000 English Collocations. in 10 Minutes a Day .pdf': 'collocations-1000.json',
    '600 Confusing-English-Words-Explained.pdf': 'confusing-words-600.json',
    'Practice Makes Perfect. English Conversation_2016, 2nd, 176p.pdf': 'english-conversation-pmp.json',
    'Shayna Oliveira - Slang & Informal English - 2014.pdf': 'slang-and-informal-english.json',
    '650_English_Phrases_for_Everyday_Speaking.pdf': '650-english-phrases.json',
    'pamela_mcpartland_what_s_up_american_idioms.pdf': 'whats-up-american-idioms.json',
    'Illustrated_Everyday_expressions_with_stories_1.pdf': 'book-illustrated-expressions-1.json',
    'Illustrated_Everyday_Expressions_with_Stories_2.pdf': 'book-illustrated-expressions-2.json',
    'Just Enough English Grammar Illustrated.pdf': 'grammar-illustrated-just-enough.json',
    'Grammar for Everyone_ Practical Tools for Learning and Teaching Grammar.pdf': 'grammar-for-everyone.json'
  };

  const extractedFile = extractedMap[pdf];
  let isExtracted = false;
  let totalChapters = 0;
  let totalWordCount = 0;
  let hasExercises = false;

  if (extractedFile) {
    const exPath = path.resolve('public/data/extracted/books', extractedFile);
    if (fs.existsSync(exPath)) {
      try {
        const exData = JSON.parse(fs.readFileSync(exPath, 'utf8'));
        isExtracted = true;
        totalChapters = exData.totalChapters || (exData.chapters ? exData.chapters.length : 0);
        totalWordCount = exData.totalWordCount || 0;
        hasExercises = Boolean(exData.hasExercises);
      } catch (e) {
        console.warn(`Failed to read extracted book ${extractedFile}:`, e.message);
      }
    }
  }

  refBooks.push({
    id: `ref-${refBooks.length + 1}`,
    title: pdf.replace(/\.pdf$/i, '').replace(/_/g, ' '),
    category,
    pdfPath: `materials/${pdf}`,
    sizeBytes: stat.size,
    isExtracted,
    extractedFile: isExtracted ? extractedFile : undefined,
    totalChapters: isExtracted ? totalChapters : undefined,
    totalWordCount: isExtracted ? totalWordCount : undefined,
    hasExercises: isExtracted ? hasExercises : undefined
  });
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'reference-books.json'), JSON.stringify(refBooks, null, 2));
console.log(`Indexed ${refBooks.length} Reference Books (${refBooks.filter(b => b.isExtracted).length} with interactive extracted modules).`);

// 8. English the American Way
const etawIndexFile = path.resolve('public/data/extracted/etaw/index.json');
let etawUnits = [];
if (fs.existsSync(etawIndexFile)) {
  etawUnits = JSON.parse(fs.readFileSync(etawIndexFile, 'utf8'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'etaw.json'), JSON.stringify(etawUnits, null, 2));
  console.log(`Indexed ${etawUnits.length} English the American Way units (54 dialogues).`);
}

// 9. 4000 Essential English Words
const wordsIndexFile = path.resolve('public/data/extracted/words4000/index.json');
let words4000Units = [];
if (fs.existsSync(wordsIndexFile)) {
  words4000Units = JSON.parse(fs.readFileSync(wordsIndexFile, 'utf8'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'words4000.json'), JSON.stringify(words4000Units, null, 2));
  console.log(`Indexed ${words4000Units.length} 4000 Essential English Words units.`);
}

// 10. Overall Manifest
const manifest = {
  version: '1.1.0',
  generatedAt: new Date().toISOString(),
  counts: {
    dailyEnglish: dailyEnglishEpisodes.length,
    culturalEnglish: culturalEpisodes.length,
    fluentEnglish: fluentEpisodes.length,
    fluentVip: vipEpisodes.length,
    americanAccent: accentLessons.length,
    etawUnits: etawUnits.length,
    words4000Units: words4000Units.length,
    readers: readersList.length,
    readersWithAudio: readersList.filter(r => r.hasAudio).length,
    referenceBooks: refBooks.length,
    totalAudioItems: dailyEnglishEpisodes.length + culturalEpisodes.length + fluentEpisodes.length + vipEpisodes.length + accentLessons.length + (etawUnits.reduce((acc, u) => acc + (u.dialoguesCount || 0), 0)) + (words4000Units.length * 2) + readersList.reduce((acc, r) => acc + r.chapters.length, 0)
  }
};
fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Manifest generated:', manifest);
