'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { PodcastEpisode } from '@/types/content';
import { useAudioStore, useProgressStore } from '@/lib/store';
import { resolveMediaUrl, cn } from '@/lib/utils';
import { AlignmentBadge } from '@/components/AudioPlayer/AlignmentBadge';

interface Props {
  initialEpisodes: PodcastEpisode[];
}

export function PodcastBrowser({ initialEpisodes }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSeries = searchParams.get('series') || 'all';

  const [selectedSeries, setSelectedSeries] = useState<string>(initialSeries);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 48;

  const updateSeries = (series: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (series === 'all') params.delete('series');
    else params.set('series', series);
    router.replace(`/podcasts?${params.toString()}`, { scroll: false });
  };

  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();
  const { completedItems, toggleCompleted, recentItems, comfortRatings } = useProgressStore();

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
  const continueItem = recentItems.find((item) => item.type === 'podcast');
  const recommendedEpisode = initialEpisodes.find(
    (episode) => episode.series === 'daily-english' && episode.id !== continueItem?.id
  ) || initialEpisodes[0];
  const recommendationLabel = continueItem
    ? comfortRatings[continueItem.id] === 'too-hard'
      ? 'A gentler next step'
      : comfortRatings[continueItem.id] === 'easy'
        ? 'A small step up'
        : 'Close to your recent input'
    : 'A good place to begin';

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
      <section className="grid gap-3 lg:grid-cols-2" aria-label="Listening recommendations">
        {continueItem && (
          <Link
            href={continueItem.url}
            className="group surface-elevated flex items-center justify-between gap-4 rounded-2xl border-l-4 border-l-[hsl(var(--podcast-sienna))] p-5 transition-transform hover:-translate-y-0.5"
          >
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--podcast-sienna))]">Continue listening</span>
              <h2 className="mt-1 truncate font-serif text-xl text-[hsl(var(--foreground))]">{continueItem.title}</h2>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Pick up where you left off</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-[hsl(var(--podcast-sienna))] transition-transform group-hover:translate-x-1" />
          </Link>
        )}
        {recommendedEpisode && (
          <Link
            href={`/podcasts/${recommendedEpisode.id}`}
            className="group surface-inset flex items-center justify-between gap-4 rounded-2xl p-5 transition-colors hover:bg-[hsl(var(--foreground)/0.06)]"
          >
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--accent-warm))]">
                <Sparkles className="h-3.5 w-3.5" /> For you
              </span>
              <h2 className="mt-1 truncate font-serif text-xl text-[hsl(var(--foreground))]">{recommendedEpisode.title}</h2>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{recommendedEpisode.levelLabel || 'B1'} · {recommendationLabel}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-[hsl(var(--accent-warm))] transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </section>

      {/* Series Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[hsl(var(--border))]">
        {seriesTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setSelectedSeries(tab.id);
              updateSeries(tab.id);
            }}
            className={cn(
              'px-3.5 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-all flex items-center gap-1.5',
              selectedSeries === tab.id
                ? 'border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.04)] border-b-2 border-transparent'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-mono',
                selectedSeries === tab.id
                  ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]'
                  : 'bg-[hsl(var(--foreground)/0.06)]'
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search by topic or number (e.g. 42, job, phone)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-[hsl(var(--border))] bg-transparent focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto text-xs text-[hsl(var(--muted-foreground))]">
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--foreground)/0.04)] transition-colors font-medium"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'asc' ? 'Number: 1 → End' : 'Number: End → 1'}</span>
          </button>

          <span>
            Showing <strong className="text-[hsl(var(--foreground))]">{paginated.length}</strong> of {filtered.length}
          </span>
        </div>
      </div>

      {/* Episode Linear List */}
      <div className="flex flex-col gap-2">
        {paginated.map((ep) => {
          const isCurrentlyPlaying = currentTrack?.id === ep.id && isPlaying;
          const isCurrentActive = currentTrack?.id === ep.id;
          const isCompleted = completedItems[ep.id] || false;

          return (
            <div
              key={ep.id}
              className={cn(
                'group p-3 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md',
                isCurrentActive
                  ? 'border-[hsl(var(--podcast-sienna))] bg-[hsl(var(--podcast-sienna)/0.03)] ring-1 ring-[hsl(var(--podcast-sienna)/0.3)]'
                  : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--foreground)/0.02)]'
              )}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Play Button */}
                <button
                  type="button"
                  onClick={() => handlePlayEpisode(ep)}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform shadow-sm',
                    isCurrentlyPlaying
                      ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] scale-95'
                      : 'bg-[hsl(var(--foreground)/0.05)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.1)] hover:scale-105'
                  )}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[hsl(var(--podcast-sienna)/0.15)] text-[hsl(var(--podcast-sienna))]">
                      #{ep.number}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[hsl(var(--muted-foreground))] truncate">
                      {ep.seriesTitle}
                    </span>
                    <AlignmentBadge sources={[
                      `/data/alignments/podcasts/${ep.series}/${ep.id}.json`,
                      `/data/alignments/podcasts/${ep.series}/${ep.series === 'daily-english' ? `daily-${String(ep.number).padStart(4, '0')}` : ep.id}.json`,
                    ]} />
                  </div>

                  <Link
                    href={`/podcasts/${ep.id}`}
                    className="block font-serif text-base sm:text-lg font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--podcast-sienna))] transition-colors truncate"
                  >
                    {ep.title}
                  </Link>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-3 shrink-0 pl-14 sm:pl-0">
                <Link
                  href={`/podcasts/${ep.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.06)] transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Study Notes</span>
                </Link>

                <button
                  type="button"
                  onClick={() => toggleCompleted(ep.id)}
                  aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    isCompleted
                      ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)]'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--foreground)/0.06)] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
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
            className="px-3.5 py-1.5 rounded-lg border border-[hsl(var(--border))] text-xs font-semibold disabled:opacity-40 hover:bg-[hsl(var(--foreground)/0.04)] transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-[hsl(var(--muted-foreground))] px-2 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3.5 py-1.5 rounded-lg border border-[hsl(var(--border))] text-xs font-semibold disabled:opacity-40 hover:bg-[hsl(var(--foreground)/0.04)] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
