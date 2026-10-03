import React from 'react';
import { getGradedReaders } from '@/lib/content/load';
import { ReaderBrowser } from '@/components/Readers/ReaderBrowser';

export const metadata = {
  title: 'Graded Readers Bookshelf — ContentFirst English',
  description:
    'Extensive reading library with 265 classic & modern graded readers across 6 levels from Starter to Advanced, with chapter audio.',
};

export default function ReadersPage() {
  const readers = getGradedReaders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 dark:text-stone-50">
          Graded Readers Bookshelf
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          265 adapted classic and contemporary literary titles across 6 stages with native chapter audio.
        </p>
      </div>

      <ReaderBrowser initialReaders={readers} />
    </div>
  );
}
