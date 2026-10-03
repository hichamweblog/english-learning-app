import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('public/data');

console.log('--- Starting Content Validation ---');

const files = [
  'daily-english.json',
  'cultural-english.json',
  'fluent-english.json',
  'fluent-vip.json',
  'american-accent.json',
  'readers.json',
  'reference-books.json',
  'manifest.json',
];

let totalErrors = 0;
const seenIds = new Set();

for (const file of files) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing data file: ${file}`);
    totalErrors++;
    continue;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    if (Array.isArray(data)) {
      console.log(`✓ ${file}: Valid JSON array with ${data.length} records.`);

      for (const item of data) {
        if (!item.id) {
          console.error(`❌ Item missing id in ${file}:`, item);
          totalErrors++;
        } else if (seenIds.has(item.id)) {
          console.warn(`⚠️ Warning: Duplicate id found: ${item.id}`);
        } else {
          seenIds.add(item.id);
        }

        if (!item.title) {
          console.error(`❌ Item missing title in ${file}: ${item.id}`);
          totalErrors++;
        }
      }
    } else if (typeof data === 'object') {
      console.log(`✓ ${file}: Valid JSON object.`);
    }
  } catch (err) {
    console.error(`❌ Malformed JSON in ${file}:`, err.message);
    totalErrors++;
  }
}

console.log('-----------------------------------');
if (totalErrors === 0) {
  console.log('✅ ALL CONTENT VALIDATION PASSED PERFECTLY!');
  process.exit(0);
} else {
  console.error(`❌ Content validation failed with ${totalErrors} errors.`);
  process.exit(1);
}
