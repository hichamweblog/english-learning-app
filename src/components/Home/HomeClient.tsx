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
  Clock3,
  CalendarDays,
} from 'lucide-react';
import { useProgressStore, useAudioStore } from '@/lib/store';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { cn } from '@/lib/utils';
import type { PodcastEpisode } from '@/types/content';
import { trackLearningEvent } from '@/lib/analytics';

interface Props {
  recommendedEpisode?: PodcastEpisode;
}

export function HomeClient({ recommendedEpisode }: Props) {
  const [mounted, setMounted] = useState(false);
  const {
    recentItems,
    completedItems,
    savedPositions,
    comfortRatings,
    exposureSecondsByDate,
    dailyGoalMinutes,
    setDailyGoalMinutes,
    learningGoal,
    setLearningGoal,
  } = useProgressStore();
  const { currentTrack, isPlaying, currentTime, duration, togglePlay } = useAudioStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const latestItem = recentItems[0] || (recommendedEpisode ? {
    id: recommendedEpisode.id,
    type: 'podcast' as const,
    title: recommendedEpisode.title,
    seriesTitle: recommendedEpisode.seriesTitle,
    url: `/podcasts/${recommendedEpisode.id}`,
    progressPercent: 0,
  } : null);

  if (!latestItem) {
    return (
      <div className="surface-card p-8 rounded-2xl flex flex-col items-center justify-center text-center">
        <BookOpen className="w-8 h-8 text-[hsl(var(--muted-foreground))] mb-3 opacity-50" />
        <h3 className="font-serif text-lg text-[hsl(var(--foreground))]">Choose your first session</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 max-w-sm">
          Pick a short listening or reading session below to start building your routine.
        </p>
      </div>
    );
  }

  const isLatestPlaying = currentTrack?.id === latestItem.id && isPlaying;
  const isDone = completedItems[latestItem.id] || false;
  const savedPosition = savedPositions[latestItem.id] || 0;
  const liveProgress = currentTrack?.id === latestItem.id && duration > 0
    ? currentTime / duration * 100
    : 0;
  const progressPercent = isDone ? 100 : Math.min(100, Math.max(0, liveProgress || latestItem.progressPercent || 0));
  const lastComfort = comfortRatings[latestItem.id];
  const recommendationReason = lastComfort === 'too-hard'
    ? 'A gentler next step after a difficult session.'
    : lastComfort === 'easy'
    ? 'A small step up after comfortable input.'
    : lastComfort === 'challenging'
    ? 'A similar level to keep your momentum.'
    : 'A short, familiar piece to keep your routine going.';
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const weeklyMinutes = Object.entries(exposureSecondsByDate).reduce((total, [date, seconds]) => {
    return new Date(`${date}T00:00:00`).getTime() >= weekStart.getTime() ? total + seconds / 60 : total;
  }, 0);
  const weeklyHours = Math.floor(weeklyMinutes / 60);
  const weeklyRemainder = Math.round(weeklyMinutes % 60);

  const handleResume = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentTrack?.id === latestItem.id) {
      togglePlay();
      return;
    }
    trackLearningEvent('session_started', { itemId: latestItem.id, source: 'today' });
    window.location.href = latestItem.url;
  };

  return (
    <div className="space-y-4">
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
                {recentItems.length > 0 ? `Continue • ${latestItem.seriesTitle}` : 'Your first session'}
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
              <span>              {progressPercent > 0 || savedPosition > 0 ? 'Resume' : 'Start session'}</span>
            </>
          )}
        </button>
      </div>
      {lastComfort && (
        <p className="mt-5 border-t border-[hsl(var(--border))] pt-4 text-xs text-[hsl(var(--muted-foreground))]">
          Next input will stay close to this session because you marked it{' '}
          <span className="font-semibold text-[hsl(var(--foreground))]">
            {lastComfort.replace('-', ' ')}
          </span>
          .
        </p>
      )}
      {recommendedEpisode && recentItems.length > 0 && (
        <Link
          href={`/podcasts/${recommendedEpisode.id}`}
          className="mt-4 block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--foreground)/0.025)] p-4 hover:bg-[hsl(var(--foreground)/0.05)]"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--accent-warm))]">
            Recommended next
          </span>
          <span className="mt-1 block font-serif text-lg text-[hsl(var(--foreground))]">
            {recommendedEpisode.title}
          </span>
          <span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">
            {recommendedEpisode.levelLabel || 'A2–B2'} · about 10 minutes · {recommendationReason}
          </span>
        </Link>
      )}
      </div>
      {recentItems.length === 0 && (
        <div className="mt-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--foreground)/0.025)] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[hsl(var(--accent-warm))]">Make it yours</p>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Choose a daily target that feels easy to repeat. You can change it any time.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[5, 10, 20].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setDailyGoalMinutes(minutes)}
                className={cn(
                  'min-h-10 rounded-lg border px-3 text-xs font-semibold transition-colors',
                  dailyGoalMinutes === minutes
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]'
                    : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                {minutes} minutes
              </button>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">What would you like to improve first?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                ['conversation', 'Understand conversations'],
                ['speaking', 'Speak naturally'],
                ['reading', 'Read confidently'],
                ['pronunciation', 'Improve pronunciation'],
                ['vocabulary', 'Build vocabulary'],
              ] as const).map(([goal, label]) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => {
                    setLearningGoal(goal);
                    trackLearningEvent('goal_updated', { source: 'today' });
                  }}
                  className={cn(
                    'min-h-10 rounded-lg border px-3 text-xs font-semibold transition-colors',
                    learningGoal === goal
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]'
                      : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="surface-inset flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent-warm)/0.12)] text-[hsl(var(--accent-warm))]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">This week</p>
            <p className="mt-0.5 font-serif text-xl text-[hsl(var(--foreground))]">
              {weeklyHours}h {weeklyRemainder}m <span className="font-sans text-xs text-[hsl(var(--muted-foreground))]">of English input</span>
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Daily target: {dailyGoalMinutes} minutes</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="inline-flex items-center gap-1.5"><Headphones className="h-3.5 w-3.5 text-[hsl(var(--podcast-sienna))]" /> Listening</span>
          <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-[hsl(var(--reader-green))]" /> Reading</span>
          <Clock3 className="hidden h-4 w-4 sm:block" />
        </div>
      </div>
    </div>
  );
}
