# Content Schema Specification — ContentFirst English

This document defines the strict data schemas and structural contracts used across all educational materials in the application.

---

## 1. Design Principles

1. **Zero Runtime AI**: All educational metadata, glossaries, and questions are precomputed, validated, and stored as static JSON.
2. **Offline-First**: All data structures are fully serializable and cacheable locally in browser IndexedDB.
3. **CDN Swappable**: Media paths are stored relative to the materials root. A single environment variable (`NEXT_PUBLIC_AUDIO_BASE_URL`) transitions the application from local disk symlinks to Cloudflare R2 object storage.
4. **Descriptive Pedagogical Levels**: Content is categorized by readable CEFR-aligned descriptors (Starter, Elementary, Pre-Intermediate, Intermediate, Upper-Intermediate, Advanced).

---

## 2. Core Entities

### A. Podcast Episode (`PodcastEpisode`)

Stored in `public/data/daily-english.json`, `cultural-english.json`, `fluent-english.json`, etc.

```typescript
export interface PodcastEpisode {
  id: string;              // Unique slug, e.g., "daily-001", "cultural-042", "vip-153"
  series: PodcastSeriesType; // 'daily-english' | 'cultural-english' | 'fluent-english' | 'fluent-vip' | 'american-accent'
  seriesTitle: string;     // Display title, e.g., "Daily English"
  number: number;          // Sequential episode number
  title: string;           // Clean descriptive title, e.g., "Introducing Yourself"
  topic?: string;          // Primary semantic topic
  audioPath: string;       // Relative path, e.g., "materials/ESL PodCast Full/Daily English/1-100/001 Introducing Yourself.mp3"
  pdfPath?: string | null; // Relative path to study guide / transcript PDF
  levelLabel?: string;     // Estimated proficiency descriptor
  duration?: number;       // Seconds
}
```

### B. Graded Reader Book (`GradedReaderBook`)

Stored in `public/data/readers.json`.

```typescript
export interface GradedReaderBook {
  id: string;               // Unique slug, e.g., "reader-1-beauty-and-the-beast"
  title: string;            // Book title
  level: ReaderLevel;       // 'starter' | 'elementary' | 'pre-intermediate' | 'intermediate' | 'upper-intermediate' | 'advanced'
  levelLabel: string;       // Human-readable level, e.g., "Starter"
  seriesCode: string;       // Original source code, e.g., "Stage 1", "Level 1"
  pdfPath: string;          // Relative path to full illustrated/adapted PDF book
  hasAudio: boolean;        // True if full chapter audio exists
  audioTracksCount: number; // Number of chapter tracks
  chapters: GradedReaderChapter[];
}

export interface GradedReaderChapter {
  id: string;               // e.g., "ch-1"
  chapterNumber: number;    // 1-indexed
  title: string;            // e.g., "Chapter 1"
  audioPath: string;        // Relative path to chapter audio track
}
```

### C. Reference Book (`ReferenceBook`)

Stored in `public/data/reference-books.json`.

```typescript
export interface ReferenceBook {
  id: string;               // e.g., "ref-1"
  title: string;            // e.g., "English for Everyone English Grammar"
  category: string;         // 'Dictionaries' | 'Grammar & Vocabulary' | 'Idioms & Phrases' | 'Business English'
  pdfPath: string;          // Relative path
  sizeBytes: number;        // File size in bytes
}
```

### D. Study Progress & Notes (`LearnerProgress`)

Stored in browser LocalStorage / IndexedDB via `useProgressStore`.

```typescript
export interface LearnerProgress {
  completedItems: Record<string, boolean>; // id -> completed status
  savedPositions: Record<string, number>;  // id -> audio playback timestamp in seconds
  recentItems: RecentItem[];              // History stack of last accessed units
  notes: Record<string, string>;          // id -> markdown study notes and word banks
}
```
