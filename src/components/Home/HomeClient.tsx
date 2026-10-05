'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Play,
  Pause,
  CheckCircle2,
  ArrowRight,
  Headphones,
  BookOpen,
} from 'lucide-react';
import { useProgressStore, useAudioStore } from '@/lib/store';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { cn } from '@/lib/utils';

export function HomeClient() {
  const [mounted, setMounted] = useState(false);
  const { recentItems, completedItems } = useProgressStore();
  const { currentTrack, isPlaying, togglePlay } = useAudioStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || recentItems.length === 0) {
    return (
      <div className="surface-card p-8 rounded-2xl flex flex-col items-center justify-center text-center">
        <BookOpen className="w-8 h-8 text-[hsl(var(--muted-foreground))] mb-3 opacity-50" />
        <h3 className="font-serif text-lg text-[hsl(var(--foreground))]">Start Your First Lesson</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 max-w-sm">
          Jump into the daily spoken English pathway or pick a graded reader to begin your journey.
        </p>
      </div>
    );
  }

  const latestItem = recentItems[0];
  const isLatestPlaying = currentTrack?.id === latestItem.id && isPlaying;
  const isLatestCurrent = currentTrack?.id === latestItem.id;
  const isDone = completedItems[latestItem.id] || false;
  
  // Dummy progress calculation (in a real app, we'd fetch savedPositions / duration)
  // For the sake of the redesign UI, we'll give it a visual state based on completion
  const progressPercent = isDone ? 100 : latestItem.progressPercent || 35;

  const handleResume = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentTrack?.id === latestItem.id) {
      togglePlay();
      return;
    }
    window.location.href = latestItem.url;
  };

  return (
    <div className="surface-card p-6 sm:p-8 rounded-2xl relative overflow-hidden group">
      {/* Subtle top accent border based on content type */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        latestItem.type === 'reader' ? "bg-[hsl(var(--reader-green))]" : "bg-[hsl(var(--podcast-sienna))]"
      )} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex flex-1 items-start gap-5">
          <ProgressRing 
            progress={progressPercent} 
            size={56} 
            strokeWidth={4}
            progressColor={latestItem.type === 'reader' ? 'text-[hsl(var(--reader-green))]' : 'text-[hsl(var(--podcast-sienna))]'}
          >
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--foreground)/0.04)] flex items-center justify-center text-[hsl(var(--foreground))] group-hover:scale-110 transition-transform">
              {latestItem.type === 'reader' ? (
                <BookOpen className="w-4 h-4" />
              ) : (
                <Headphones className="w-4 h-4" />
              )}
            </div>
          </ProgressRing>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Continue • {latestItem.seriesTitle}
              </span>
              {isDone && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[hsl(var(--primary))] font-bold uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <Link
              href={latestItem.url}
              className="text-xl sm:text-2xl font-serif text-[hsl(var(--foreground))] hover:underline block leading-tight"
            >
              {latestItem.title}
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResume}
          className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))] font-semibold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {isLatestPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>{progressPercent > 0 && progressPercent < 100 ? 'Resume' : 'Start Lesson'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
