import React, { Suspense } from 'react';
import { getAllPodcastEpisodes } from '@/lib/content/load';
import { PodcastBrowser } from '@/components/Podcasts/PodcastBrowser';

export const metadata = {
  title: 'Podcasts & Spoken Audio — ContentFirst English',
  description:
    'Browse over 2,250 podcast episodes with authentic audio and transcripts across Daily English, Cultural English, and Fluent VIP.',
};

export default function PodcastsPage() {
  const episodes = getAllPodcastEpisodes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 dark:text-stone-50">
          Podcasts & Conversational Corpus
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          2,278 structured spoken audio lessons with accompanying transcripts, vocabulary notes, and cultural analysis.
        </p>
      </div>

      <Suspense fallback={<div className="p-12 text-center text-sm text-stone-400 font-serif">Loading catalog index...</div>}>
        <PodcastBrowser initialEpisodes={episodes} />
      </Suspense>
    </div>
  );
}
