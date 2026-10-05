export type ReaderLevel =
  | 'starter'
  | 'elementary'
  | 'pre-intermediate'
  | 'intermediate'
  | 'upper-intermediate'
  | 'advanced';

export interface LevelInfo {
  code: string; // S1, S2, etc.
  name: ReaderLevel;
  label: string; // Starter, Elementary, etc.
  description: string;
}

export const LEVEL_MAP: Record<string, { name: ReaderLevel; label: string }> = {
  S1: { name: 'starter', label: 'Starter' },
  S2: { name: 'elementary', label: 'Elementary' },
  S3: { name: 'pre-intermediate', label: 'Pre-Intermediate' },
  S4: { name: 'intermediate', label: 'Intermediate' },
  S5: { name: 'upper-intermediate', label: 'Upper-Intermediate' },
  S6: { name: 'advanced', label: 'Advanced' },
  '1': { name: 'starter', label: 'Starter (Level 1)' },
  '2': { name: 'elementary', label: 'Elementary (Level 2)' },
  '3': { name: 'pre-intermediate', label: 'Pre-Intermediate (Level 3)' },
  '4': { name: 'intermediate', label: 'Intermediate (Level 4)' },
  '5': { name: 'upper-intermediate', label: 'Upper-Intermediate (Level 5)' },
  '6': { name: 'advanced', label: 'Advanced (Level 6)' },
};

export type PodcastSeriesType =
  | 'daily-english'
  | 'cultural-english'
  | 'fluent-english'
  | 'fluent-vip'
  | 'american-accent';

export interface PodcastEpisode {
  id: string; // unique slug e.g. "daily-001"
  series: PodcastSeriesType;
  seriesTitle: string;
  number: number;
  title: string;
  topic?: string;
  audioPath: string; // relative to materials root, e.g. "ESL PodCast Full/Daily English/1-100/001 Introducing Yourself...mp3"
  pdfPath?: string | null; // relative to materials root
  videoPath?: string | null; // optional video file
  duration?: number; // duration in seconds if known
  fileSize?: number;
  levelLabel?: string;
}

export interface GradedReaderChapter {
  id: string;
  chapterNumber: number;
  title: string;
  audioPath: string;
  storyText?: string;
  activitiesText?: string;
  hasActivities?: boolean;
  wordCount?: number;
}

export interface GradedReaderBook {
  id: string;
  title: string;
  level: ReaderLevel;
  levelLabel: string;
  seriesCode: string; // e.g. "(S1)", "Level1-2"
  pdfPath?: string | null;
  hasAudio: boolean;
  audioTracksCount: number;
  chapters: GradedReaderChapter[];
  totalChapters?: number;
  totalWordCount?: number;
  hasExercises?: boolean;
}

export interface ReferenceBookChapter {
  id?: string;
  chapterNumber?: number;
  title: string;
  storyText?: string;
  explanation?: string;
  exercises?: string;
  dialogue?: any;
  content?: string;
  openingConversation?: any;
  wordCount?: number;
  raw?: string;
  hasAudio?: boolean;
  audioPath?: string;
}

export interface ReferenceBookLesson {
  id?: string;
  lessonNumber?: number;
  title: string;
  content: string;
  quiz?: any;
  hasAudio?: boolean;
  audioPath?: string;
}

export interface ReferenceBookEntry {
  id?: string;
  entryNumber?: number;
  title: string;
  words?: string[];
  explanation: string;
  hasAudio?: boolean;
  audioPath?: string;
}

export interface ReferenceBook {
  id: string;
  title: string;
  category: string;
  pdfPath: string;
  sizeBytes: number;
  hasAudio?: boolean;
  hasExtractedContent?: boolean;
  extractedId?: string;
  author?: string;
  publisher?: string;
  volume?: number;
  totalChapters?: number;
  totalLessons?: number;
  totalEntries?: number;
  totalWordCount?: number;
  hasExercises?: boolean;
  chapters?: ReferenceBookChapter[];
  lessons?: ReferenceBookLesson[];
  entries?: ReferenceBookEntry[];
}

export interface LibraryManifest {
  version: string;
  generatedAt: string;
  counts: {
    dailyEnglish: number;
    culturalEnglish: number;
    fluentEnglish: number;
    fluentVip: number;
    americanAccent: number;
    readers: number;
    referenceBooks: number;
  };
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  exampleSentence?: string;
  additionalExamples?: string[];
}

export interface ComprehensionQuestionOption {
  key: string;
  text: string;
}

export interface ComprehensionQuestion {
  questionNumber: number;
  question: string;
  options: ComprehensionQuestionOption[];
  correctAnswer?: string;
}

export interface WhatElseEntry {
  term: string;
  explanation: string;
}

export interface CultureNote {
  title: string;
  content: string;
}

export interface EpisodeTranscript {
  dialogue?: string;
  fullText: string;
  wordCount?: number;
  txtPath?: string;
}

export interface ExtractedEpisodeData {
  id: string;
  series: PodcastSeriesType;
  seriesTitle: string;
  episodeNumber: number;
  title: string;
  topics?: string[];
  audioPath?: string | null;
  pdfPath?: string | null;
  glossary: GlossaryEntry[];
  usefulPhrases?: GlossaryEntry[];
  questions: ComprehensionQuestion[];
  whatElse?: WhatElseEntry[];
  cultureNote?: CultureNote | null;
  insidersKnow?: CultureNote | null;
  transcript?: EpisodeTranscript | null;
  extractedAt: string;
}

export interface ExtractedVipTurn {
  speaker: string;
  text: string;
}

export interface ExtractedVipData {
  id: string;
  series: 'fluent-vip';
  seriesTitle: string;
  episodeNumber: number;
  title: string;
  audioPath?: string | null;
  pdfPath?: string | null;
  dialog: ExtractedVipTurn[];
  readingPassage?: string;
  vocabulary: GlossaryEntry[];
  usefulPhrases?: GlossaryEntry[];
  transcript?: EpisodeTranscript | null;
  extractedAt: string;
}

export interface CourseLessonDialogueTurn {
  speaker: string;
  text: string;
}

export interface CourseLessonVocabItem {
  term: string;
  definition: string;
  example?: string;
}

export interface CourseLessonPhraseItem {
  category?: string;
  phrase: string;
  explanation?: string;
}

export interface CourseLessonQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: string;
}

export interface CourseLessonQuiz {
  title: string;
  questions: CourseLessonQuizQuestion[];
  answersRaw?: string;
}

export interface CourseLesson {
  lessonNumber: number;
  title: string;
  audioPath?: string | null;
  videoPath?: string | null;
  pdfPath?: string | null;
  transcriptPath?: string | null;
  hasAudio?: boolean;
  hasVideo?: boolean;
  wordCount?: number;
  fullText?: string;
  dialogue?: CourseLessonDialogueTurn[] | null;
  vocabulary?: CourseLessonVocabItem[] | null;
  phrases?: CourseLessonPhraseItem[] | null;
  quiz?: CourseLessonQuiz | null;
  writingTask?: string | null;
  hasDialogue?: boolean;
  hasQuiz?: boolean;
  hasVocab?: boolean;
  hasPhrases?: boolean;
}

export interface Course {
  id: string;
  title: string;
  author: string;
  category: string;
  level: ReaderLevel;
  levelLabel: string;
  totalLessons: number;
  totalWordCount?: number;
  audioLessonsCount?: number;
  videoLessonsCount?: number;
  quizzesCount?: number;
  masterPdfPath?: string | null;
  lessons: CourseLesson[];
}

