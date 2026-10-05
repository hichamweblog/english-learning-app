'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Book, ExternalLink, Download, FileText, X, Sparkles, BookOpen } from 'lucide-react';
import type { ReferenceBook } from '@/types/content';
import { resolveMediaUrl, formatBytes, cn } from '@/lib/utils';

interface Props {
  initialBooks: ReferenceBook[];
}

export function ReferenceBrowser({ initialBooks }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    const set = new Set(initialBooks.map((b) => b.category));
    return ['all', ...Array.from(set)];
  }, [initialBooks]);

  const filtered = useMemo(() => {
    let list = initialBooks;
    if (selectedCategory !== 'all') {
      list = list.filter((b) => b.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => b.title.toLowerCase().includes(q));
    }
    return list;
  }, [initialBooks, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-stone-200 dark:border-stone-800">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all capitalize',
              selectedCategory === cat
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
            )}
          >
            {cat === 'all' ? 'All Reference Folios' : cat}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search reference books by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-stone-500">
          Showing <span className="font-semibold text-stone-900 dark:text-stone-100">{filtered.length}</span> reference items
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((book) => {
          const pdfUrl = resolveMediaUrl(book.pdfPath);

          return (
            <div
              key={book.id}
              className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group hover:border-amber-500/50 dark:hover:border-amber-500/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {book.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {book.hasExtractedContent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        <Sparkles className="w-2.5 h-2.5" />
                        Interactive
                      </span>
                    )}
                    <span className="text-[11px] text-stone-400 font-mono">
                      {formatBytes(book.sizeBytes)}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/library/${book.id}`}
                  className="font-serif text-base font-normal text-stone-900 dark:text-stone-100 line-clamp-2 hover:text-amber-800 dark:hover:text-amber-400 transition-colors"
                >
                  {book.title}
                </Link>

                {book.author && (
                  <p className="text-xs text-stone-400 mt-1 line-clamp-1">
                    {book.author}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <Link
                  href={`/library/${book.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-400 hover:underline"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{book.hasExtractedContent ? 'Study Folio' : 'View Folio'}</span>
                </Link>

                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
                  >
                    <span>PDF</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
