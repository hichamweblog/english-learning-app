import React from 'react';
import Link from 'next/link';
import {
  Headphones,
  BookOpen,
  Mic,
  ArrowRight,
  Quote,
  Sparkles,
  Map,
  Compass,
  ArrowUpRight,
} from 'lucide-react';
import { getManifest } from '@/lib/content/load';
import { getDailyEnglishEpisodes, getGradedReaders } from '@/lib/content/load';
import { HomeClient } from '@/components/Home/HomeClient';

export default function HomePage() {
  const manifest = getManifest();
  const dailyEpisodes = getDailyEnglishEpisodes();
  const nextEpisode = dailyEpisodes[0];
  const recommendedEpisode = dailyEpisodes[1];
  const readers = getGradedReaders();
  const nextReader = readers[0];

  // Simple greeting logic for server component
  const getGreeting = () => {
    return "Ready for your next session?";
  };

  return (
    <div className="space-y-14 max-w-[1040px] mx-auto pb-16">
      
      {/* 1. Greeting */}
      <section className="relative overflow-hidden rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-8 sm:px-10 sm:py-10 shadow-[0_16px_50px_hsl(var(--foreground)/0.05)]">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[hsl(var(--accent-warm)/0.12)] blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-[hsl(var(--reader-green)/0.08)] blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent-warm)/0.25)] bg-[hsl(var(--accent-warm)/0.08)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[hsl(var(--accent-warm))]">
              <Sparkles className="h-3.5 w-3.5" />
              Your reading room
            </div>
            <h1 className="font-serif text-4xl font-normal leading-[1.05] tracking-tight text-[hsl(var(--foreground))] sm:text-6xl">
              Good day.
              <span className="block italic text-[hsl(var(--primary))]">Ready for your next session?</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">
              Build fluency through a small, steady rhythm of authentic listening and reading.
              Pick up where you left off, or let today&apos;s lesson choose the way.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:min-w-[280px]">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.7)] p-4">
              <span className="block text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">{manifest.counts.dailyEnglish.toLocaleString()}</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">audio lessons</span>
            </div>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.7)] p-4">
              <span className="block text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">{readers.length.toLocaleString()}</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">graded readers</span>
            </div>
            <div className="col-span-2 flex items-center gap-2 px-1 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--reader-green))] shadow-[0_0_0_4px_hsl(var(--reader-green)/0.12)]" />
              A quiet place to make progress every day
            </div>
          </div>
        </div>
      </section>

      {/* 2. Continue Where You Left Off */}
      <HomeClient recommendedEpisode={recommendedEpisode} />

      {/* 3. Today's input */}
      <section aria-labelledby="today-heading" className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-[hsl(var(--accent-warm))]">
              Today
            </span>
            <h2 id="today-heading" className="font-serif text-2xl sm:text-3xl text-[hsl(var(--foreground))] mt-1">
              A little understandable English
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              Start with one piece. Stay with it for as long as it feels useful.
            </p>
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] sm:inline-flex">
            <Compass className="w-3.5 h-3.5" />
            Chosen for steady progress
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/podcasts/${nextEpisode.id}`}
            className="group surface-elevated p-5 sm:p-6 flex flex-col min-h-[210px] justify-between hover:-translate-y-1 transition-all hover:shadow-[0_14px_30px_hsl(var(--podcast-sienna)/0.12)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[hsl(var(--podcast-sienna)/0.1)] text-[hsl(var(--podcast-sienna))] flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Listen · 10 min
              </span>
            </div>
            <div className="mt-6">
              <h3 className="font-serif text-xl text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--podcast-sienna))] transition-colors">
                {nextEpisode.title}
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {nextEpisode.seriesTitle} · {nextEpisode.levelLabel || 'A2–B2'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--podcast-sienna))] mt-5">
              Listen now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          <Link
            href={`/readers/${nextReader.id}`}
            className="group surface-card p-5 sm:p-6 flex flex-col min-h-[210px] justify-between hover:-translate-y-1 transition-all hover:shadow-[0_14px_30px_hsl(var(--reader-green)/0.12)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[hsl(var(--reader-green)/0.1)] text-[hsl(var(--reader-green))] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Read · 15 min
              </span>
            </div>
            <div className="mt-6">
              <h3 className="font-serif text-xl text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--reader-green))] transition-colors">
                {nextReader.title}
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {nextReader.levelLabel} · Audio-supported reader
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--reader-green))] mt-5">
              Read a chapter
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </section>

      {/* 4. Today's Expression */}
      <section className="surface-inset p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Quote className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col items-start gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Expression Spotlight
            </span>
          </div>
          <div>
            <h3 className="font-serif text-2xl sm:text-3xl text-[hsl(var(--foreground))] leading-tight">
              To learn the ropes
            </h3>
            <span className="text-sm font-mono text-[hsl(var(--muted-foreground))] mt-1 block">
              /tuː lɜːn ðə roʊps/
            </span>
          </div>
          <p className="text-base text-[hsl(var(--foreground))] leading-relaxed max-w-lg mt-2">
            Meaning: To understand how a particular job or task is organized. Originates from sailing ships where sailors had to learn how to tie and handle miles of complex rigging.
          </p>
          <Link
            href="/podcasts/daily-1"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--primary))] hover:underline mt-2"
          >
            <span>Listen in context</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 5. Explore the library */}
      <section aria-labelledby="map-heading">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--accent-warm))]">More ways to learn</span>
            <h2 id="map-heading" className="mt-1 flex items-center gap-2 text-2xl font-serif font-medium text-[hsl(var(--foreground))]">
            <Map className="w-5 h-5 text-[hsl(var(--accent-warm))]" />
            Explore the library
            </h2>
          </div>
          <Link href="/search" className="hidden items-center gap-1 text-xs font-semibold text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))] sm:inline-flex">
            Browse all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="surface-card overflow-hidden">
          {/* Pathway 1: Listening */}
          <Link href="/podcasts?series=daily-english" className="group block p-5 border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--foreground)/0.02)] transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--podcast-sienna)/0.1)] text-[hsl(var(--podcast-sienna))] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--podcast-sienna))] transition-colors">
                    Daily Spoken English
                  </h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {manifest.counts.dailyEnglish.toLocaleString()} episodes · A2-B2 level
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 hidden sm:flex">
                <div className="text-right">
                  <div className="text-xs font-semibold text-[hsl(var(--foreground))]">Start Unit 1</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Introducing Yourself</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Pathway 2: Reading */}
          <Link href="/readers" className="group block p-5 border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--foreground)/0.02)] transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--reader-green)/0.1)] text-[hsl(var(--reader-green))] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--reader-green))] transition-colors">
                    Extensive Reading
                  </h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {manifest.counts.readers.toLocaleString()} graded books · Audio synced
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 hidden sm:flex">
                <div className="text-right">
                  <div className="text-xs font-semibold text-[hsl(var(--foreground))]">Start Book 1</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Andersen's Fairy Tales</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Pathway 3: Culture & Nuance */}
          <Link href="/podcasts?series=cultural-english" className="group block p-5 border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--foreground)/0.02)] transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--course-sapphire)/0.1)] text-[hsl(var(--course-sapphire))] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--course-sapphire))] transition-colors">
                    Cultural Nuance & Idioms
                  </h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {manifest.counts.culturalEnglish.toLocaleString()} episodes · B2-C1 level
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 hidden sm:flex">
                <div className="text-right">
                  <div className="text-xs font-semibold text-[hsl(var(--foreground))]">Start Unit 1</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Thanksgiving Traditions</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Pathway 4: Accent */}
          <Link href="/accent" className="group block p-5 hover:bg-[hsl(var(--foreground)/0.02)] transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent-warm)/0.1)] text-[hsl(var(--accent-warm))] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--accent-warm))] transition-colors">
                    American Accent Studio
                  </h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {manifest.counts.americanAccent.toLocaleString()} phonetic drill units
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 hidden sm:flex">
                <div className="text-right">
                  <div className="text-xs font-semibold text-[hsl(var(--foreground))]">Start Unit 1</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Flap T Mechanics</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
