'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Headphones,
  BookOpen,
} from 'lucide-react';
import { useProgressStore, useAudioStore } from '@/lib/store';
import { formatTime, cn } from '@/lib/utils';

export function HomeClient() {
  const [mounted, setMounted] = useState(false);
  const { recentItems, completedItems } = useProgressStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || recentItems.length === 0) {
    return null;
  }

  const latestItem = recentItems[0];
  const isLatestPlaying = currentTrack?.id === latestItem.id && isPlaying;
  const isLatestCurrent = currentTrack?.id === latestItem.id;
  const isDone = completedItems[latestItem.id] || false;

  const handleResume = (item: typeof latestItem) => {
    if (currentTrack?.id === item.id) {
      togglePlay();
      return;
    }
    // Navigate or trigger play
    window.location.href = item.url;
  };

  return (
    <section className="space-y-4" aria-labelledby="resume-heading">
      <div className="flex items-center justify-between">
        <h2 id="resume-heading" className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Resume Your Recent Study
        </h2>
        <Link
          href="/progress"
          className="text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1"
        >
          View all activity <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Hero Resume Spotlight Card */}
      <div className="p-5 sm:p-6 rounded-2xl border border-stone-300/80 dark:border-stone-800 bg-white dark:bg-[#14161C] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            {latestItem.type === 'reader' ? (
              <BookOpen className="w-6 h-6" />
            ) : (
              <Headphones className="w-6 h-6" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {latestItem.seriesTitle}
              </span>
              {isDone && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed
                </span>
              )}
            </div>

            <Link
              href={latestItem.url}
              className="text-base sm:text-lg font-serif font-medium text-stone-900 dark:text-stone-50 hover:underline block truncate"
            >
              {latestItem.title}
            </Link>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Pick up right where you paused your session.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={latestItem.url}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 font-semibold text-xs shadow-xs hover:scale-102 active:scale-98 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            <span>Continue Lesson</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
