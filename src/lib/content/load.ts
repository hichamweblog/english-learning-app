import fs from 'node:fs';
import path from 'node:path';
import type {
  PodcastEpisode,
  GradedReaderBook,
  ReferenceBook,
  LibraryManifest,
  ExtractedEpisodeData,
  ExtractedVipData,
  Course,
} from '@/types/content';

function readJsonFile<T>(filename: string): T {
  const filePath = path.join(process.cwd(), 'public/data', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

export function getManifest(): LibraryManifest {
  return readJsonFile<LibraryManifest>('manifest.json');
}

export function getDailyEnglishEpisodes(): PodcastEpisode[] {
  return readJsonFile<PodcastEpisode[]>('daily-english.json');
}

export function getCulturalEnglishEpisodes(): PodcastEpisode[] {
  return readJsonFile<PodcastEpisode[]>('cultural-english.json');
}

export function getFluentEnglishEpisodes(): PodcastEpisode[] {
  return readJsonFile<PodcastEpisode[]>('fluent-english.json');
}

export function getFluentVipEpisodes(): PodcastEpisode[] {
  return readJsonFile<PodcastEpisode[]>('fluent-vip.json');
}

export function getAmericanAccentLessons(): PodcastEpisode[] {
  return readJsonFile<PodcastEpisode[]>('american-accent.json');
}

export function getAllPodcastEpisodes(): PodcastEpisode[] {
  return [
    ...getDailyEnglishEpisodes(),
    ...getCulturalEnglishEpisodes(),
    ...getFluentEnglishEpisodes(),
    ...getFluentVipEpisodes(),
    ...getAmericanAccentLessons(),
  ];
}

export function getGradedReaders(): GradedReaderBook[] {
  return readJsonFile<GradedReaderBook[]>('readers.json');
}

const REF_BOOK_MAP: Record<string, string> = {
  'ref-1': 'collocations-1000.json',
  'ref-5': 'perfect-phrases-conversation-skills.json',
  'ref-7': 'perfect-phrases-conversation-skills.json',
  'ref-10': 'confusing-words-600.json',
  'ref-11': '650-english-phrases.json',
  'ref-19': 'grammar-for-everyone.json',
  'ref-20': 'book-illustrated-expressions-2.json',
  'ref-21': 'book-illustrated-expressions-1.json',
  'ref-22': 'grammar-illustrated-just-enough.json',
  'ref-25': 'perfect-phrases-everyday-situations.json',
  'ref-26': 'english-conversation-pmp.json',
  'ref-27': 'slang-and-informal-english.json',
  'ref-43': 'whats-up-american-idioms.json',
};

export function getReferenceBooks(): ReferenceBook[] {
  const books = readJsonFile<ReferenceBook[]>('reference-books.json');
  const booksDir = path.join(process.cwd(), 'public/data/extracted/books');
  
  return books.map((book) => {
    const filename = REF_BOOK_MAP[book.id];
    if (filename) {
      const fullPath = path.join(booksDir, filename);
      if (fs.existsSync(fullPath)) {
        try {
          const extracted = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
          return {
            ...book,
            hasExtractedContent: true,
            extractedId: extracted.id || filename.replace('.json', ''),
            author: extracted.author || book.author,
            publisher: extracted.publisher || book.publisher,
            totalChapters: extracted.totalChapters || extracted.chapters?.length,
            totalLessons: extracted.totalLessons || extracted.lessons?.length,
            totalEntries: extracted.totalEntries || extracted.entries?.length,
            totalWordCount: extracted.totalWordCount,
            hasExercises: extracted.hasExercises || false,
          };
        } catch {
          // fallback
        }
      }
    }
    return book;
  });
}

export function getReferenceBookById(id: string): ReferenceBook | undefined {
  const books = getReferenceBooks();
  let book = books.find((b) => b.id === id);

  // If not found directly, try matching by extractedId
  if (!book) {
    book = books.find((b) => b.extractedId === id);
  }

  if (!book) return undefined;

  const filename = REF_BOOK_MAP[book.id] || (book.extractedId ? `${book.extractedId}.json` : null);
  if (filename) {
    const booksDir = path.join(process.cwd(), 'public/data/extracted/books');
    const fullPath = path.join(booksDir, filename);
    if (fs.existsSync(fullPath)) {
      try {
        const extracted = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        return {
          ...book,
          ...extracted,
          id: book.id, // preserve canonical ref ID
          title: extracted.title || book.title,
          chapters: extracted.chapters || [],
          lessons: extracted.lessons || [],
          entries: extracted.entries || [],
          hasExtractedContent: true,
        };
      } catch {
        return book;
      }
    }
  }

  return book;
}

export function getPodcastById(id: string): PodcastEpisode | undefined {
  const all = getAllPodcastEpisodes();
  return all.find((ep) => ep.id === id);
}

export function getReaderById(id: string): GradedReaderBook | undefined {
  const readers = getGradedReaders();
  const reader = readers.find((r) => r.id === id);
  if (!reader) return undefined;

  const extractedPath = path.join(process.cwd(), 'public/data/extracted/readers', `${id}.json`);
  if (fs.existsSync(extractedPath)) {
    try {
      const extracted = JSON.parse(fs.readFileSync(extractedPath, 'utf-8'));
      return {
        ...reader,
        ...extracted,
        chapters: extracted.chapters || reader.chapters,
      };
    } catch {
      return reader;
    }
  }

  return reader;
}

export function getExtractedEpisodeData(series: string, number: number): ExtractedEpisodeData | null {
  const padded = String(number).padStart(4, '0');
  let subDir = '';
  if (series === 'daily-english') subDir = 'daily';
  else if (series === 'cultural-english') subDir = 'cultural';
  else return null;

  const filePath = path.join(process.cwd(), 'public/data/extracted', subDir, `${padded}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as ExtractedEpisodeData;
  } catch {
    return null;
  }
}

export function getExtractedVipData(number: number): ExtractedVipData | null {
  const padded = String(number).padStart(4, '0');
  const filePath = path.join(process.cwd(), 'public/data/extracted/vip', `${padded}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as ExtractedVipData;
  } catch {
    return null;
  }
}

export function getCourses(): Course[] {
  try {
    return readJsonFile<Course[]>('shyna-courses.json');
  } catch {
    return [];
  }
}

export function getCourseById(id: string): Course | undefined {
  const extractedPath = path.join(process.cwd(), 'public/data/extracted/shyna-courses', `${id}.json`);
  if (fs.existsSync(extractedPath)) {
    try {
      const content = fs.readFileSync(extractedPath, 'utf-8');
      return JSON.parse(content) as Course;
    } catch {
      // fallback
    }
  }

  const courses = getCourses();
  return courses.find((c) => c.id === id);
}

