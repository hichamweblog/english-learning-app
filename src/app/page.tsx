import React from 'react';
import Link from 'next/link';
import {
  Headphones,
  BookOpen,
  Mic,
  Library,
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  Compass,
  Sparkles,
  Quote,
  Flame,
} from 'lucide-react';
import {
  getManifest,
  getDailyEnglishEpisodes,
  getGradedReaders,
  getCulturalEnglishEpisodes,
} from '@/lib/content/load';
import { HomeClient } from '@/components/Home/HomeClient';

export default function HomePage() {
  const manifest = getManifest();
  const dailyEpisodes = getDailyEnglishEpisodes().slice(0, 6);
  const sampleReaders = getGradedReaders()
    .filter((r) => r.hasAudio)
    .slice(0, 6);

  return (
    <div className="space-y-12">
      {/* Editorial Masthead */}
      <section className="relative overflow-hidden rounded-3xl bg-stone-900 text-stone-100 dark:bg-[#14161C] dark:border dark:border-stone-800 p-8 sm:p-12 shadow-md">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800/80 dark:bg-stone-800 border border-stone-700/60 text-xs font-semibold tracking-wide text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Curated Authentic Corpus · 4,320+ Audio Lessons & Chapters</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.12]">
            Master English through real speech and timeless literature.
          </h1>

          <p className="text-base sm:text-lg text-stone-300 font-sans leading-relaxed max-w-2xl font-normal">
            No synthetic robot dialogues or gamified flashcard gimmicks. Immerse in structured
            conversations, complete graded audiobooks, authentic colloquial idioms, and natural rhythm.
          </p>

          {/* Catalog Index Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3.5 rounded-xl bg-stone-800/60 dark:bg-stone-900/80 border border-stone-700/50">
              <span className="block font-mono text-2xl font-bold text-amber-400">
                {manifest.counts.dailyEnglish.toLocaleString()}
              </span>
              <span className="text-xs text-stone-300 font-medium">Daily Lessons</span>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-800/60 dark:bg-stone-900/80 border border-stone-700/50">
              <span className="block font-mono text-2xl font-bold text-amber-400">
                {manifest.counts.culturalEnglish.toLocaleString()}
              </span>
              <span className="text-xs text-stone-300 font-medium">Cultural Insights</span>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-800/60 dark:bg-stone-900/80 border border-stone-700/50">
              <span className="block font-mono text-2xl font-bold text-emerald-400">
                {manifest.counts.readers.toLocaleString()}
              </span>
              <span className="text-xs text-stone-300 font-medium">Graded Audiobooks</span>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-800/60 dark:bg-stone-900/80 border border-stone-700/50">
              <span className="block font-mono text-2xl font-bold text-sky-400">
                {manifest.counts.referenceBooks.toLocaleString()}
              </span>
              <span className="text-xs text-stone-300 font-medium">Reference Folios</span>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Expression Spotlight (Authentic Linguistic Context) */}
      <section className="p-6 rounded-2xl border border-stone-300/80 dark:border-stone-800 bg-[#F4F1EA]/80 dark:bg-[#16181F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/25">
            <Quote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Expression Spotlight
              </span>
              <span className="text-xs text-stone-400 font-mono">/tuː lɜːn ðə roʊps/</span>
            </div>
            <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100">
              &ldquo;To learn the ropes&rdquo;
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              Meaning: To understand how a particular job or task is organized. Originates from sailing ships where sailors had to learn how to tie and handle miles of complex ropes.
            </p>
          </div>
        </div>
        <Link
          href="/podcasts/daily-1"
          className="shrink-0 px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 self-end sm:self-auto"
        >
          <span>Listen in Episode #1</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      {/* Recent Activity Resume */}
      <HomeClient />

      {/* Primary Learning Tracks */}
      <section className="space-y-5" aria-labelledby="tracks-heading">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="tracks-heading" className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              Four Systematic Pathways
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Organized by linguistic discipline: conversational ease, extensive reading, cultural depth, and vocal clarity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pathway 1: Daily English */}
          <Link
            href="/podcasts?series=daily-english"
            className="group p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] hover:border-amber-600/60 dark:hover:border-amber-400/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-amber-500/20">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold font-mono uppercase text-amber-700 dark:text-amber-400">
                  CEFR A2 → B2
                </span>
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100 mb-1.5">
                Daily English
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                1,305 sequential audio lessons exploring workplace scenarios, daily routines, social nuances, and real-life dialogues.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs font-semibold text-stone-800 dark:text-stone-200">
              <span>Browse 1,305 lessons</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Pathway 2: Graded Readers */}
          <Link
            href="/readers"
            className="group p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] hover:border-emerald-600/60 dark:hover:border-emerald-400/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-emerald-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold font-mono uppercase text-emerald-700 dark:text-emerald-400">
                  6 Graded Stages
                </span>
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100 mb-1.5">
                Graded Readers
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                265 classic & modern books with chapter-by-chapter audio narration, from Starter (300 headwords) to Advanced.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span>Explore Bookshelf</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Pathway 3: Cultural & VIP */}
          <Link
            href="/podcasts?series=cultural-english"
            className="group p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] hover:border-indigo-600/60 dark:hover:border-indigo-400/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-indigo-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold font-mono uppercase text-indigo-700 dark:text-indigo-400">
                  CEFR B2 → C1
                </span>
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100 mb-1.5">
                Cultural & VIP Slang
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                850+ episodes decoding American humor, historical context, colloquial expressions, and conversational idioms.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs font-semibold text-indigo-700 dark:text-indigo-400">
              <span>Deep Nuance</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Pathway 4: Accent Studio */}
          <Link
            href="/accent"
            className="group p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] hover:border-amber-600/60 dark:hover:border-amber-400/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-amber-500/20">
                <Mic className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold font-mono uppercase text-amber-700 dark:text-amber-400">
                  Acoustic Drills
                </span>
              </div>
              <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100 mb-1.5">
                Accent & Intonation
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                19 systematic acoustic modules on flap T, glottal stops, vowel shifts, pitch peaks, and connected speech.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
              <span>Phonetics Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Graded Readers Showcase (Crafted Book Aesthetic) */}
      <section className="space-y-5" aria-labelledby="readers-heading">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="readers-heading" className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              Graded Readers Library
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Experience the power of extensive reading with full audiobook narration.
            </p>
          </div>
          <Link
            href="/readers"
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            All 265 titles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleReaders.map((reader) => (
            <Link
              key={reader.id}
              href={`/readers/${reader.id}`}
              className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] hover:border-emerald-600/70 dark:hover:border-emerald-500/70 transition-all flex flex-col justify-between group shadow-2xs hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {reader.levelLabel}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 font-mono">
                    <Headphones className="w-3.5 h-3.5" />
                    {reader.audioTracksCount} Chapters
                  </span>
                </div>

                <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100 line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {reader.title}
                </h3>
                <span className="text-xs text-stone-400 block mt-1">
                  Series Code: {reader.seriesCode}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 text-xs text-stone-500 flex items-center justify-between">
                <span>Adapted Prose + Audio</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold group-hover:underline">
                  Read & Listen →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Daily English Starting Lessons */}
      <section className="space-y-5" aria-labelledby="daily-heading">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="daily-heading" className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2.5">
              <Headphones className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              Foundational Daily Dialogues
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Natural spoken expressions spoken at accessible speed with complete transcripts.
            </p>
          </div>
          <Link
            href="/podcasts?series=daily-english"
            className="text-xs font-semibold text-stone-700 dark:text-stone-300 hover:underline flex items-center gap-1"
          >
            All 1,305 episodes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dailyEpisodes.map((ep) => (
            <Link
              key={ep.id}
              href={`/podcasts/${ep.id}`}
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] hover:border-stone-400 dark:hover:border-stone-600 transition-all flex items-center justify-between gap-3 group shadow-2xs"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                  Episode #{ep.number}
                </span>
                <h4 className="font-serif text-base font-normal text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  {ep.title}
                </h4>
              </div>
              <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
