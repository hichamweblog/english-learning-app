import React from 'react';
import { getAmericanAccentLessons } from '@/lib/content/load';
import { AccentBrowser } from '@/components/Accent/AccentBrowser';

export const metadata = {
  title: 'American Accent & Phonetics Studio — ContentFirst English',
  description:
    '19 structured units on American English pronunciation, rhythm, pitch, vowels, and mashups with audio, video, and PDF guides.',
};

export default function AccentPage() {
  const lessons = getAmericanAccentLessons();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 dark:text-stone-50">
          Accent & Phonetics Studio
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Master acoustic rhythm, flapping, pitch contours, vowel shifts, and connected colloquial speech.
        </p>
      </div>
      <div className="surface-inset flex flex-col gap-2 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--accent-warm))]">Practice loop</span>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Listen first, repeat one small pattern, then return to meaningful input.</p>
        </div>
        <span className="text-xs font-semibold text-[hsl(var(--foreground))]">One drill at a time</span>
      </div>

      <AccentBrowser lessons={lessons} />
    </div>
  );
}
