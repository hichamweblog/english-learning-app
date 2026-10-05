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
} from 'lucide-react';
import { getManifest } from '@/lib/content/load';
import { getDailyEnglishEpisodes, getGradedReaders } from '@/lib/content/load';
import { HomeClient } from '@/components/Home/HomeClient';

export default function HomePage() {
  const manifest = getManifest();
  const nextEpisode = getDailyEnglishEpisodes()[0];
  const nextReader = getGradedReaders()[0];

  // Simple greeting logic for server component
  const getGreeting = () => {
    return "Ready for your next session?";
  };

  return (
    <div className="space-y-12 max-w-[800px] mx-auto pb-16">
      
      {/* 1. Greeting */}
      <section className="pt-6 pb-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[hsl(var(--foreground))]">
          Good day. {getGreeting()}
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm">
          "Mastery is not a function of genius, but of daily, unglamorous persistence."
        </p>
      </section>

      {/* 2. Continue Where You Left Off */}
      <HomeClient />

      {/* 3. Today's input */}
      <section aria-labelledby="today-heading" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
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
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
            <Compass className="w-3.5 h-3.5" />
            Chosen for steady progress
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/podcasts/${nextEpisode.id}`}
            className="group surface-elevated p-5 sm:p-6 flex flex-col min-h-[190px] justify-between hover:-translate-y-0.5 transition-transform"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--podcast-sienna)/0.1)] text-[hsl(var(--podcast-sienna))] flex items-center justify-center">
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
            className="group surface-card p-5 sm:p-6 flex flex-col min-h-[190px] justify-between hover:-translate-y-0.5 transition-transform"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--reader-green)/0.1)] text-[hsl(var(--reader-green))] flex items-center justify-center">
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
          <h2 id="map-heading" className="text-xl font-serif font-medium text-[hsl(var(--foreground))] flex items-center gap-2">
            <Map className="w-5 h-5 text-[hsl(var(--accent-warm))]" />
            Explore the library
          </h2>
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
