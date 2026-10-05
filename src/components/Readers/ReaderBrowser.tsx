'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [audioOnly, setAudioOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const { completedItems, toggleCompleted } = useProgressStore();

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

    return list;
  }, [initialReaders, selectedLevel, audioOnly, searchQuery]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Level Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-stone-200 dark:border-stone-800">
        {levelTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setSelectedLevel(tab.id);
              setPage(1);
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5',
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

        <div className="flex items-center gap-4 self-start sm:self-auto">
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
        </div>
      </div>

      {/* Reader Book Cards Grid (Literary Bookshelf Look) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {paginated.map((reader) => {
          const isCompleted = completedItems[reader.id] || false;

          return (
            <div
              key={reader.id}
              className="group relative flex flex-col h-full"
            >
              <Link
                href={`/readers/${reader.id}`}
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
