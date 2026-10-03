/**
 * Content Extraction Utilities and Text Cleaners
 * Pure deterministic transformations with zero data loss.
 */

export function normalizeTypography(text) {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // smart double quotes
    .replace(/\u00A0/g, ' ')         // non-breaking space
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

export function extractHeaderMeta(rawText) {
  if (!rawText) return null;
  const normalized = normalizeTypography(rawText.slice(0, 1500));
  
  // Standard ESL Podcast / Daily English: "ESL Podcast 500 – Taking Minutes of a Meeting"
  const m = normalized.match(/(?:ESL Podcast|Daily English)\s*[-–—]?\s*([\d,]+)\s*[–—:-]\s*([^\n\r]+)/i);
  if (m) {
    return {
      number: parseInt(m[1].replace(/,/g, ''), 10),
      title: m[2].trim().replace(/\.$/, '')
    };
  }

  // Cultural English / English Café: "ENGLISH CAFÉ – 1" + TOPICS
  const cafeMatch = normalized.match(/ENGLISH CAFÉ\s*[-–—]\s*([\d,]+)/i);
  if (cafeMatch) {
    const num = parseInt(cafeMatch[1].replace(/,/g, ''), 10);
    const topicsMatch = normalized.match(/TOPICS\s*\n\s*([\s\S]*?)(?:_{3,}|GLOSSARY)/i);
    const topicsStr = topicsMatch ? topicsMatch[1].replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim() : `English Café ${num}`;
    const topicsList = topicsStr.split(/;\s*/).map(t => t.trim()).filter(Boolean);
    return {
      number: num,
      title: topicsStr,
      topics: topicsList
    };
  }

  return null;
}

export function stripEsldPodWatermarks(rawText) {
  if (!rawText) return '';
  let text = normalizeTypography(rawText);

  // Remove form feed page breaks
  text = text.replace(/\f/g, '\n\n');

  // Remove repeating page headers
  // E.g.:
  // English as a Second Language Podcast
  // www.eslpod.com
  // ESL Podcast 500 – Taking Minutes of a Meeting
  text = text.replace(/English as a Second Language Podcast\s*\n\s*www\.eslpod\.com\s*\n\s*(ESL Podcast|Daily English|ENGLISH CAFÉ)\s*[\d,]+\s*[–-]\s*[^\n]+/gi, '');
  text = text.replace(/ESLPod\.com\s*\n\s*(Daily English|ESL Podcast|ENGLISH CAFÉ)\s*[\d,]+\s*[–-]\s*[^\n]+\s*\n\s*www\.eslpod\.com/gi, '');
  text = text.replace(/English as a Second Language Podcast\s*\n\s*www\.eslpod\.com/gi, '');
  text = text.replace(/^ESLPod\.com\s*$/gmi, '');
  text = text.replace(/^www\.eslpod\.com\s*$/gmi, '');

  // Remove repeating page footers
  text = text.replace(/\n\s*\d+\s*\nThese materials are copyrighted by the Center for Educational Development[^\n]*\n(?:[^\n]*\n)?\s*www\.easytalk\.ir/gi, '\n');
  text = text.replace(/These materials are copyrighted by the Center for Educational Development[^\n]*/gi, '');
  text = text.replace(/Posting of these materials on another website or distributing them in any way is prohibited\./gi, '');
  text = text.replace(/^www\.easytalk\.ir\s*$/gmi, '');

  return text;
}

export function cleanLine(line) {
  return line ? line.trim().replace(/[ \t]+/g, ' ') : '';
}
