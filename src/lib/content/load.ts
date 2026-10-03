import fs from 'node:fs';
import path from 'node:path';
import type {
  PodcastEpisode,
  GradedReaderBook,
  ReferenceBook,
  LibraryManifest,
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

export function getReferenceBooks(): ReferenceBook[] {
  return readJsonFile<ReferenceBook[]>('reference-books.json');
}

export function getPodcastById(id: string): PodcastEpisode | undefined {
  const all = getAllPodcastEpisodes();
  return all.find((ep) => ep.id === id);
}

export function getReaderById(id: string): GradedReaderBook | undefined {
  const readers = getGradedReaders();
  return readers.find((r) => r.id === id);
}
