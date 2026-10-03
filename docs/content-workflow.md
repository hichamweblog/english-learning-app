# Content Workflow & Ingestion Guide — ContentFirst English

This document details the lifecycle of all educational materials: from raw source files to automated indexing, Phase 2 text extraction, human review, and deployment.

---

## 1. The Strict Separation Principle

```
┌────────────────────────────────────────────────────────┐
│  Phase 1 — Discovery & Raw Ingestion (COMPLETE)        │
│                                                        │
│  Raw Educational Materials on Local Storage            │
│  (/English_Materials: 1,900+ Podcasts, 265 Readers)    │
│            ↓                                           │
│  Automated Indexer (scripts/index-content.mjs)         │
│            ↓                                           │
│  Static JSON Catalogs (public/data/*.json)             │
│            ↓                                           │
│  Application Shell & Player (Next.js 16 + Zero AI)     │
└────────────────────────────────────────────────────────┘

                         ↓

┌────────────────────────────────────────────────────────┐
│  Phase 2 — Deep Text Extraction & Human Review         │
│                                                        │
│  Offline Extraction Script (scripts/extract-pdfs.ts)   │
│  Extracts Glossary, Story Transcript & Culture Notes   │
│            ↓                                           │
│  Human Review & Curation in JSON/Markdown              │
│            ↓                                           │
│  Approved Structured Content Loaded into App           │
└────────────────────────────────────────────────────────┘
```

---

## 2. Ingestion Workflows

### A. How New Podcasts Are Added

1. Place the new episode MP3 and corresponding PDF into the respective folder in `English_Materials/`:
   - e.g. `English_Materials/ESL PodCast Full/Daily English/1301-1400/1306 Example Title.mp3`
   - e.g. `English_Materials/ESL PodCast Full/Daily English/1301-1400/1306 [Daily English].pdf`
2. Run the indexer:
   ```bash
   npm run content:index
   ```
3. The episode is immediately available in the catalog with zero database rebuilds.

### B. How New Graded Readers Are Added

1. Place the reader PDF in the appropriate level folder:
   - `English_Materials/00Graded-Readers-Challenge/Level1-2/(S1) New Book.pdf`
2. If audio chapters exist, place the audio folder alongside the PDF:
   - `English_Materials/00Graded-Readers-Challenge/Level1-2/New Book/` containing `Track 01.mp3`, `Track 02.mp3`...
3. Run `npm run content:index`. The reader browser automatically maps it to the descriptive level (Starter to Advanced) and generates chapter playlists.

---

## 3. Phase 2 Extraction & Human Review

To extract structured glossary items and dialogue text:
1. Run `npm run content:extract-pdfs` targeting specific episode ranges.
2. The script extracts:
   - `glossary`: word, part of speech, definition, and example sentence.
   - `transcript`: complete spoken story text.
   - `cultureNote`: cultural background section.
3. The reviewer inspects and refines the output in `content/podcasts/daily/{number}.json`.
4. Only approved JSON files are committed and loaded by the app.

---

## 4. Production Audio Deployment (Cloudflare R2)

When ready to host audio on Cloudflare R2:
1. Upload the `English_Materials` directory to an R2 bucket (e.g. `https://r2.mycdn.com/materials`).
2. Add the environment variable in `.env.production`:
   ```env
   NEXT_PUBLIC_AUDIO_BASE_URL=https://r2.mycdn.com
   ```
3. All `<audio>` streams and PDF links automatically route to the CDN with zero code changes!
