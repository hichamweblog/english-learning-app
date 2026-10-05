import React from 'react';
import {
  getAllPodcastEpisodes,
  getGradedReaders,
  getReferenceBooks,
} from '@/lib/content/load';
import { GlobalSearch } from '@/components/Search/GlobalSearch';

export const metadata = {
  title: 'Omni-Search — ContentFirst English',
  description:
    'Search across all available podcast episodes, graded readers, and reference books.',
};

export default function SearchPage() {
  const podcasts = getAllPodcastEpisodes();
  const readers = getGradedReaders();
  const reference = getReferenceBooks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 dark:text-stone-50">
          Omni-Search & Lexical Index
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Find an idea, then return directly to listening or reading. Search across spoken audio, graded readers, and reference folios.
        </p>
      </div>

      <GlobalSearch
        podcasts={podcasts}
        readers={readers}
        reference={reference}
      />
    </div>
  );
}
