'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Play,
  Pause,
  CheckCircle2,
  FileText,
  Filter,
  Headphones,
  SlidersHorizontal,
  ArrowUpDown,
  X,
} from 'lucide-react';
import type { PodcastEpisode } from '@/types/content';
import { useAudioStore, useProgressStore } from '@/lib/store';
import { resolveMediaUrl, cn } from '@/lib/utils';

interface Props {
  initialEpisodes: PodcastEpisode[];
}

export function PodcastBrowser({ initialEpisodes }: Props) {
  const searchParams = useSearchParams();
  const initialSeries = searchParams.get('series') || 'all';

  const [selectedSeries, setSelectedSeries] = useState<string>(initialSeries);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 48;

  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();
  const { completedItems, toggleCompleted } = useProgressStore();

  const seriesTabs: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'All Series', count: initialEpisodes.length },
    {
      id: 'daily-english',
      label: 'Daily English',
      count: initialEpisodes.filter((e) => e.series === 'daily-english').length,
    },
    {
      id: 'cultural-english',
      label: 'Cultural English',
      count: initialEpisodes.filter((e) => e.series === 'cultural-english').length,
    },
    {
      id: 'fluent-vip',
      label: 'Fluent VIP',
      count: initialEpisodes.filter((e) => e.series === 'fluent-vip').length,
    },
    {
      id: 'fluent-english',
      label: 'Fluent English',
      count: initialEpisodes.filter((e) => e.series === 'fluent-english').length,
    },
    {
      id: 'american-accent',
      label: 'Accent Lessons',
      count: initialEpisodes.filter((e) => e.series === 'american-accent').length,
    },
  ];

  // Filtering & Sorting
  const filtered = useMemo(() => {
    let list = initialEpisodes;

    if (selectedSeries !== 'all') {
      list = list.filter((e) => e.series === selectedSeries);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          String(e.number).includes(q) ||
          e.seriesTitle.toLowerCase().includes(q)
      );
    }

    // Sort by episode number
    const sorted = [...list].sort((a, b) => {
      const numA = typeof a.number === 'number' ? a.number : parseInt(String(a.number)) || 0;
      const numB = typeof b.number === 'number' ? b.number : parseInt(String(b.number)) || 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });

    return sorted;
  }, [initialEpisodes, selectedSeries, searchQuery, sortOrder]);

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [selectedSeries, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handlePlayEpisode = (ep: PodcastEpisode) => {
    if (currentTrack?.id === ep.id) {
      togglePlay();
      return;
    }
    playTrack({
      id: ep.id,
      title: ep.title,
      seriesTitle: ep.seriesTitle,
      audioPath: ep.audioPath,
      pdfPath: ep.pdfPath,
      levelLabel: ep.levelLabel,
      itemUrl: `/podcasts/${ep.id}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Series Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-stone-200 dark:border-stone-800">
        {seriesTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedSeries(tab.id)}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5',
              selectedSeries === tab.id
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                selectedSeries === tab.id
                  ? 'bg-stone-800 text-stone-200 dark:bg-stone-200 dark:text-stone-800'
                  : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar, Sorting, & Result Count */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by topic or number (e.g. 42, job, phone)..."
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

        <div className="flex items-center gap-3 self-start sm:self-auto text-xs text-stone-500">
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors font-medium"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'asc' ? 'Number: 1 → End' : 'Number: End → 1'}</span>
          </button>

          <span>
            Showing <strong className="text-stone-900 dark:text-stone-100">{paginated.length}</strong> of {filtered.length}
          </span>
        </div>
      </div>

      {/* Episode Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {paginated.map((ep) => {
          const isCurrentlyPlaying = currentTrack?.id === ep.id && isPlaying;
          const isCurrentActive = currentTrack?.id === ep.id;
          const isCompleted = completedItems[ep.id] || false;

          return (
            <div
              key={ep.id}
              className={cn(
                'group p-4 rounded-xl border bg-white dark:bg-[#14161C] transition-all flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs',
                isCurrentActive
                  ? 'border-amber-500/80 ring-1 ring-amber-500/30 dark:border-amber-400/80'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-amber-800 dark:text-amber-400">
                      #{ep.number}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-stone-400 dark:text-stone-500 truncate">
                      {ep.seriesTitle}
                    </span>
                  </div>

                  <Link
                    href={`/podcasts/${ep.id}`}
                    className="block font-serif text-base font-normal text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors line-clamp-2"
                  >
                    {ep.title}
                  </Link>
                </div>

                {/* Mark as Complete Checkmark */}
                <button
                  type="button"
                  onClick={() => toggleCompleted(ep.id)}
                  aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  className={cn(
                    'p-1 rounded-full transition-colors shrink-0',
                    isCompleted
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'text-stone-300 dark:text-stone-700 hover:text-stone-500'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
                {/* Inline Play/Pause Trigger */}
                <button
                  type="button"
                  onClick={() => handlePlayEpisode(ep)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    isCurrentlyPlaying
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  )}
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      <span>Listen</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  {ep.pdfPath && (
                    <a
                      href={resolveMediaUrl(ep.pdfPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open Study Guide PDF"
                      className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </a>
                  )}

                  <Link
                    href={`/podcasts/${ep.id}`}
                    className="font-semibold text-stone-700 dark:text-stone-300 hover:underline"
                  >
                    Study Unit →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
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
