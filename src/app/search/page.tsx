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
    'Search across all 2,278 podcast episodes, 265 graded readers, and 43 reference books.',
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
          Instant local index across all 2,278 spoken audio units, 265 graded readers, and 43 reference folios.
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
