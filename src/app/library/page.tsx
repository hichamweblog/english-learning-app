import React from 'react';
import Link from 'next/link';
import { getReferenceBooks } from '@/lib/content/load';
import { ReferenceBrowser } from '@/components/Library/ReferenceBrowser';

export const metadata = {
  title: 'Reference Folios & Dictionaries — ContentFirst English',
  description:
    'Comprehensive collection of 43 reference books: English for Everyone, Oxford & Longman visual dictionaries, idiom guides, and grammar resources.',
};

export default function LibraryPage() {
  const books = getReferenceBooks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-900 dark:text-stone-50">
          Reference Folios & Lexicons
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          43 essential visual lexicons, English for Everyone volumes, phraseological guides, and grammar treatises.
        </p>
      </div>
      <div className="surface-inset flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Reference is here when you need support—not as a detour from learning.
        </p>
        <Link href="/podcasts" className="inline-flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--primary))] hover:underline">
          Return to input <span aria-hidden>→</span>
        </Link>
      </div>

      <ReferenceBrowser initialBooks={books} />
    </div>
  );
}
