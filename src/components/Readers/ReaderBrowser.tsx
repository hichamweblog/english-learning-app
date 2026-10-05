'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Headphones,
  Search,
  CheckCircle2,
  Filter,
  Sparkles,
  X,
} from 'lucide-react';
import type { GradedReaderBook, ReaderLevel } from '@/types/content';
import { useProgressStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface Props {
  initialReaders: GradedReaderBook[];
}

export function ReaderBrowser({ initialReaders }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string>(
    searchParams.get('level') || 'all'
  );
  const [audioOnly, setAudioOnly] = useState(searchParams.get('audio') === '1');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<'recommended' | 'shortest' | 'title'>('recommended');
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const { completedItems, recentItems } = useProgressStore();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedLevel === 'all') params.delete('level');
    else params.set('level', selectedLevel);
    if (audioOnly) params.set('audio', '1');
    else params.delete('audio');
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    else params.delete('q');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [audioOnly, pathname, router, searchParams, searchQuery, selectedLevel]);

  const levelTabs = [
    { id: 'all', label: 'All Levels', count: initialReaders.length },
    {
      id: 'starter',
      label: 'Starter (A1)',
      count: initialReaders.filter((r) => r.level === 'starter').length,
    },
    {
      id: 'elementary',
      label: 'Elementary (A2)',
      count: initialReaders.filter((r) => r.level === 'elementary').length,
    },
    {
      id: 'pre-intermediate',
      label: 'Pre-Intermediate (B1)',
      count: initialReaders.filter((r) => r.level === 'pre-intermediate').length,
    },
    {
      id: 'intermediate',
      label: 'Intermediate (B1+)',
      count: initialReaders.filter((r) => r.level === 'intermediate').length,
    },
    {
      id: 'upper-intermediate',
      label: 'Upper-Intermediate (B2)',
      count: initialReaders.filter((r) => r.level === 'upper-intermediate').length,
    },
    {
      id: 'advanced',
      label: 'Advanced (C1)',
      count: initialReaders.filter((r) => r.level === 'advanced').length,
    },
  ];

  const filtered = useMemo(() => {
    let list = initialReaders;

    if (selectedLevel !== 'all') {
      list = list.filter((r) => r.level === selectedLevel);
    }

    if (audioOnly) {
      list = list.filter((r) => r.hasAudio);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.seriesCode.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'shortest') return (a.totalWordCount || 0) - (b.totalWordCount || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      const aRecent = recentItems.find((item) => item.id === a.id);
      const bRecent = recentItems.find((item) => item.id === b.id);
      if (aRecent && !bRecent) return -1;
      if (!aRecent && bRecent) return 1;
      return (bRecent?.lastAccessed || 0) - (aRecent?.lastAccessed || 0);
    });
  }, [initialReaders, selectedLevel, audioOnly, searchQuery, sortBy, recentItems]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const recentReader = recentItems.find((item) => item.type === 'reader');
  const recentReaderBook = recentReader ? initialReaders.find((reader) => reader.id === recentReader.id) : undefined;

  return (
    <div className="space-y-6">
      {recentReader && recentReaderBook && (
        <section className="surface-elevated flex flex-col gap-4 rounded-2xl border border-[hsl(var(--reader-green)/0.25)] bg-[hsl(var(--reader-green)/0.05)] p-5 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="continue-reading-heading">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--reader-green))]">Continue reading</span>
            <h2 id="continue-reading-heading" className="mt-1 truncate font-serif text-2xl text-[hsl(var(--foreground))]">{recentReaderBook.title}</h2>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {recentReader.progressPercent ? `${Math.round(recentReader.progressPercent)}% complete · ` : 'In progress · '}
              {recentReaderBook.levelLabel} · {recentReaderBook.totalChapters || recentReaderBook.chapters.length} chapters
            </p>
          </div>
          <Link href={recentReader.url} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--foreground))] px-4 py-2.5 text-sm font-bold text-[hsl(var(--background))]">
            Continue
          </Link>
        </section>
      )}

      {/* Level Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-stone-200 pb-2 dark:border-stone-800">
        {levelTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setSelectedLevel(tab.id);
              setPage(1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              selectedLevel === tab.id
                ? 'bg-emerald-800 text-white dark:bg-emerald-600 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                selectedLevel === tab.id
                  ? 'bg-emerald-950 text-emerald-200 dark:bg-emerald-800'
                  : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Audio Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search books by title or series..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
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

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={audioOnly}
              onChange={(e) => {
                setAudioOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span>Audio available only ({initialReaders.filter((r) => r.hasAudio).length})</span>
          </label>

          <span className="text-xs text-stone-500">
            Showing <strong className="text-stone-900 dark:text-stone-100">{paginated.length}</strong> of {filtered.length} books
          </span>
          <label className="sr-only" htmlFor="reader-sort">Sort books</label>
          <select
            id="reader-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            className="min-h-9 rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-700 dark:border-stone-800 dark:bg-[#14161C] dark:text-stone-200"
          >
            <option value="recommended">Recommended</option>
            <option value="shortest">Shortest first</option>
            <option value="title">Title A–Z</option>
          </select>
          {(selectedLevel !== 'all' || audioOnly || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedLevel('all');
                setAudioOnly(false);
                setSearchQuery('');
                setPage(1);
              }}
              className="min-h-9 rounded-lg px-2 text-xs font-semibold text-stone-600 underline-offset-2 hover:underline dark:text-stone-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Reader Book Cards Grid (Literary Bookshelf Look) */}
      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 px-5 py-10 text-center dark:border-stone-700">
          <p className="font-serif text-lg text-stone-800 dark:text-stone-200">No books match these filters.</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Try another level, search term, or audio filter.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
        {paginated.map((reader) => {
          const isCompleted = completedItems[reader.id] || false;
          const recent = recentItems.find((item) => item.id === reader.id);
          const progress = isCompleted ? 100 : Math.min(100, Math.max(0, recent?.progressPercent || 0));

          return (
            <div
              key={reader.id}
              className="group relative flex flex-col h-full"
            >
              <Link
                href={`/readers/${reader.id}`}
                aria-label={`${isCompleted ? 'Finished' : progress > 0 ? `${progress}% complete` : 'Not started'}: ${reader.title}, ${reader.levelLabel}`}
                className={cn(
                  "relative aspect-[2/3] rounded-md shadow-md border-r-2 border-b-[3px] border-[hsl(var(--foreground)/0.15)] flex flex-col justify-between p-4 sm:p-5 transition-all duration-300",
                  "bg-gradient-to-br from-[hsl(var(--reader-green)/0.8)] to-[hsl(var(--reader-green))]",
                  "hover:shadow-xl hover:-translate-y-1 hover:border-r-4 hover:border-b-[5px]",
                  "overflow-hidden"
                )}
              >
                {/* Book Spine Highlight Overlay */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent" />
                <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />

                <div className="relative z-10 flex flex-col h-full justify-between">
                  {/* Top: Metadata */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-white/90">
                      {reader.levelLabel}
                    </span>
                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-white drop-shadow-sm" />
                    )}
                  </div>

                  {/* Center/Bottom: Title */}
                  <div className="mt-auto pt-4">
                    <h3 className="font-serif text-lg sm:text-xl font-medium text-white leading-tight drop-shadow-sm">
                      {reader.title}
                    </h3>
                    <p className="text-[10px] text-white/70 font-mono mt-2 flex justify-between items-center">
                      <span>{reader.seriesCode}</span>
                      {reader.hasAudio && <Headphones className="w-3 h-3 opacity-70" />}
                    </p>
                    {progress > 0 && (
                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/20" aria-hidden="true">
                        <div className="h-full rounded-full bg-white/80" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-xs font-semibold disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-stone-500 px-3 font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-xs font-semibold disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
