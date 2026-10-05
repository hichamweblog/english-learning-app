'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import {
  Search,
  Headphones,
  BookOpen,
  FileText,
  Play,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react';
import type {
  PodcastEpisode,
  GradedReaderBook,
  ReferenceBook,
} from '@/types/content';
import { useAudioStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface SearchResultItem {
  id: string;
  type: 'podcast' | 'reader' | 'reference';
  title: string;
  subtitle: string;
  url: string;
  audioPath?: string;
  pdfPath?: string | null;
  levelLabel?: string;
}

interface Props {
  podcasts: PodcastEpisode[];
  readers: GradedReaderBook[];
  reference: ReferenceBook[];
}

export function GlobalSearch({ podcasts, readers, reference }: Props) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'podcast' | 'reader' | 'reference'>('all');
  const { playTrack } = useAudioStore();

  // Combine into searchable items
  const allItems: SearchResultItem[] = useMemo(() => {
    const pItems: SearchResultItem[] = podcasts.map((p) => ({
      id: p.id,
      type: 'podcast',
      title: p.title,
      subtitle: `${p.seriesTitle} #${p.number}`,
      url: `/podcasts/${p.id}`,
      audioPath: p.audioPath,
      pdfPath: p.pdfPath,
      levelLabel: p.levelLabel,
    }));

    const rItems: SearchResultItem[] = readers.map((r) => ({
      id: r.id,
      type: 'reader',
      title: r.title,
      subtitle: `Reader — ${r.levelLabel} (${r.chapters.length} chapters)`,
      url: `/readers/${r.id}`,
      pdfPath: r.pdfPath,
      levelLabel: r.levelLabel,
    }));

    const refItems: SearchResultItem[] = reference.map((ref) => ({
      id: ref.id,
      type: 'reference',
      title: ref.title,
      subtitle: `Reference Folio — ${ref.category}`,
      url: `/library`,
      pdfPath: ref.pdfPath,
    }));

    return [...pItems, ...rItems, ...refItems];
  }, [podcasts, readers, reference]);

  // Create Fuse index
  const fuse = useMemo(() => {
    return new Fuse(allItems, {
      keys: ['title', 'subtitle', 'type'],
      threshold: 0.35,
      distance: 100,
    });
  }, [allItems]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return allItems.slice(0, 30);
    }
    const searched = fuse.search(query).map((res) => res.item);
    if (activeFilter === 'all') return searched;
    return searched.filter((item) => item.type === activeFilter);
  }, [query, fuse, allItems, activeFilter]);

  const handlePlayPodcast = (item: SearchResultItem) => {
    if (item.audioPath) {
      playTrack({
        id: item.id,
        title: item.title,
        seriesTitle: item.subtitle,
        audioPath: item.audioPath,
        pdfPath: item.pdfPath,
        levelLabel: item.levelLabel,
        itemUrl: item.url,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Omni-Search Input Box */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          autoFocus
          placeholder="Search by keyword, topic, idiom, or title (e.g. interview, weather, Oliver Twist)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-10 py-3.5 text-sm sm:text-base rounded-2xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-[#14161C] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors shadow-2xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Catalog' },
          { id: 'podcast', label: 'Podcasts' },
          { id: 'reader', label: 'Graded Readers' },
          { id: 'reference', label: 'Reference Folios' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id as any)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
              activeFilter === tab.id
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
            )}
          >
            {tab.label}
          </button>
        ))}

        <span className="text-xs text-stone-400 ml-auto font-mono">
          {results.length} matches
        </span>
      </div>

      {/* Results List */}
      <div className="space-y-2.5">
        {results.length === 0 && (
          <div className="surface-inset rounded-2xl p-8 text-center">
            <p className="font-serif text-xl text-[hsl(var(--foreground))]">No matching input yet</p>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Try a broader topic, series name, or title.
            </p>
          </div>
        )}
        {results.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] hover:border-stone-300 dark:hover:border-stone-700 transition-all flex items-center justify-between gap-4 group shadow-2xs"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
                  item.type === 'podcast' && 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20',
                  item.type === 'reader' && 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/20',
                  item.type === 'reference' && 'bg-stone-500/10 text-stone-800 dark:text-stone-300 border-stone-500/20'
                )}
              >
                {item.type === 'podcast' && <Headphones className="w-4 h-4" />}
                {item.type === 'reader' && <BookOpen className="w-4 h-4" />}
                {item.type === 'reference' && <FileText className="w-4 h-4" />}
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  {item.subtitle}
                </span>
                <Link
                  href={item.url}
                  className="block font-serif text-base font-normal text-stone-900 dark:text-stone-100 group-hover:underline transition-colors truncate"
                >
                  {item.title}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {item.audioPath && (
                <button
                  type="button"
                  onClick={() => handlePlayPodcast(item)}
                  title="Play Lesson Audio"
                  aria-label="Play Lesson Audio"
                  className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-900 hover:text-white dark:hover:bg-stone-100 dark:hover:text-stone-900 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              )}

              <Link
                href={item.url}
                className="p-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
              >
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
