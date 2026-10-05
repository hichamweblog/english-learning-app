'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Flame,
  BookOpen,
  Headphones,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { useProgressStore, type ComfortRating } from '@/lib/store';
import { HeatmapCalendar } from '@/components/ui/HeatmapCalendar';
import { MilestoneTimeline, type Milestone } from '@/components/ui/MilestoneTimeline';
import { cn } from '@/lib/utils';

export function ProgressDashboard() {
  const [mounted, setMounted] = useState(false);
  const {
    completedItems,
    recentItems,
    exposureSecondsByDate,
    comfortRatings,
    setComfortRating,
    savedNotes,
    removeSavedNote,
    dailyGoalMinutes,
    setDailyGoalMinutes,
  } = useProgressStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const completedList = Object.entries(completedItems).filter(([_, isDone]) => isDone);
  const podcastCompleted = completedList.filter(([id]) => !id.startsWith('reader-') && !id.startsWith('course-') && !id.startsWith('accent-')).length;
  const readersCompleted = completedList.filter(([id]) => id.startsWith('reader')).length;

  const totalImmersionMinutes = Math.floor(
    Object.values(exposureSecondsByDate).reduce((sum, seconds) => sum + seconds, 0) / 60
  );
  const immersionHours = (totalImmersionMinutes / 60).toFixed(1);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayMinutes = Math.floor((exposureSecondsByDate[todayKey] || 0) / 60);
  const activeDays = Object.values(exposureSecondsByDate).filter((seconds) => seconds > 0).length;
  const latestSession = recentItems[0];
  const nextHref = latestSession?.url || '/podcasts';
  const nextTitle = latestSession ? `Continue ${latestSession.title}` : 'Start your first session';

  const heatmapData = Object.fromEntries(
    Object.entries(exposureSecondsByDate).map(([date, seconds]) => [date, Math.ceil(seconds / 60)])
  );

  // Milestones
  const milestones: Milestone[] = [
    {
      id: 'm1',
      title: 'The First Step',
      description: 'Complete your first listening or reading session.',
      isCompleted: completedList.length >= 1,
    },
    {
      id: 'm2',
      title: 'Consistent Ear',
      description: 'Accumulate 10 hours of authentic English immersion.',
      isCompleted: totalImmersionMinutes >= 600,
      isCurrent: totalImmersionMinutes > 0 && totalImmersionMinutes < 600,
    },
    {
      id: 'm3',
      title: 'Extensive Reader',
      description: 'Finish 5 entire graded audiobooks.',
      isCompleted: readersCompleted >= 5,
      isCurrent: readersCompleted > 0 && readersCompleted < 5,
    },
    {
      id: 'm4',
      title: 'Fluent Foundation',
      description: 'Master 100 Daily English episodes.',
      isCompleted: podcastCompleted >= 100,
      isCurrent: podcastCompleted > 0 && podcastCompleted < 100,
    }
  ];

  return (
    <div className="space-y-8 max-w-[960px] mx-auto pb-16">
      {/* Header Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-b border-[hsl(var(--border))] pb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[hsl(var(--foreground))]">
            Immersion Ledger
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5">
            Your personal record of authentic listening, reading, and vocabulary acquisition.
          </p>
        </div>
      </div>

      <section className="surface-elevated flex flex-col gap-4 rounded-3xl border border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.04)] p-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="next-input-heading">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--primary))]">Next input</span>
          <h2 id="next-input-heading" className="mt-1 font-serif text-2xl text-[hsl(var(--foreground))]">{nextTitle}</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Progress is most useful when it helps you choose what to do next.</p>
        </div>
        <Link href={nextHref} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--foreground))] px-4 py-2.5 text-sm font-bold text-[hsl(var(--background))] transition-transform hover:-translate-y-0.5">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="surface-elevated rounded-3xl p-6" aria-labelledby="goal-heading">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--primary))]">Today&apos;s target</span>
            <h2 id="goal-heading" className="mt-1 font-serif text-2xl text-[hsl(var(--foreground))]">
              {todayMinutes} of {dailyGoalMinutes} minutes
            </h2>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              A small, repeatable session is enough to keep your learning habit moving.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--secondary))]" role="progressbar" aria-valuenow={Math.min(todayMinutes, dailyGoalMinutes)} aria-valuemin={0} aria-valuemax={dailyGoalMinutes} aria-label="Today's learning target">
              <div className="h-full rounded-full bg-[hsl(var(--primary))] transition-[width]" style={{ width: `${Math.min(100, (todayMinutes / dailyGoalMinutes) * 100)}%` }} />
            </div>
          </div>
          <div className="shrink-0">
            <label htmlFor="daily-goal" className="mb-2 block text-xs font-semibold text-[hsl(var(--muted-foreground))]">Daily goal</label>
            <select
              id="daily-goal"
              value={dailyGoalMinutes}
              onChange={(event) => setDailyGoalMinutes(Number(event.target.value))}
              className="min-h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm text-[hsl(var(--foreground))]"
            >
              {[5, 10, 20, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="surface-elevated rounded-3xl p-6" aria-labelledby="saved-notes-heading">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--primary))]">Support layer</span>
            <h2 id="saved-notes-heading" className="mt-1 font-serif text-2xl text-[hsl(var(--foreground))]">Words & notes</h2>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Small observations worth carrying into your next input.</p>
          </div>
          <span className="rounded-full bg-[hsl(var(--secondary))] px-2.5 py-1 text-xs font-bold text-[hsl(var(--muted-foreground))]">{savedNotes.length}</span>
        </div>
        {savedNotes.length === 0 ? (
          <p className="mt-5 rounded-xl bg-[hsl(var(--secondary))] p-4 text-sm text-[hsl(var(--muted-foreground))]">Save a note from an Accent unit or a future transcript study session and it will appear here.</p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {savedNotes.slice(0, 8).map((savedNote) => (
              <article key={savedNote.id} className="rounded-xl border border-[hsl(var(--border))] p-4">
                <p className="text-sm text-[hsl(var(--foreground))]">{savedNote.note}</p>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                  <Link href={savedNote.sourceUrl} className="truncate font-semibold hover:text-[hsl(var(--primary))]">{savedNote.sourceTitle}</Link>
                  <button type="button" onClick={() => removeSavedNote(savedNote.id)} className="shrink-0 hover:text-red-600">Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="surface-card p-6 rounded-3xl shadow-sm border border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] mb-3">
            <Clock className="w-4 h-4 text-[hsl(var(--accent-warm))]" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Time</span>
          </div>

          <span className="font-mono text-4xl font-normal text-[hsl(var(--foreground))]">
            {immersionHours}h
          </span>
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] block mt-1.5 uppercase tracking-wide">Authentic Speech</span>
        </div>

        <div className="surface-card p-6 rounded-3xl shadow-sm border border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] mb-3">
            <Headphones className="w-4 h-4 text-[hsl(var(--podcast-sienna))]" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Podcasts</span>
          </div>
          <span className="font-mono text-4xl font-normal text-[hsl(var(--foreground))]">
            {podcastCompleted}
          </span>
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] block mt-1.5 uppercase tracking-wide">Episodes Mastered</span>
        </div>

        <div className="surface-card p-6 rounded-3xl shadow-sm border border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] mb-3">
            <BookOpen className="w-4 h-4 text-[hsl(var(--reader-green))]" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Readers</span>
          </div>
          <span className="font-mono text-4xl font-normal text-[hsl(var(--foreground))]">
            {readersCompleted}
          </span>
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] block mt-1.5 uppercase tracking-wide">Books Finished</span>
        </div>

        <div className="surface-card p-6 rounded-3xl shadow-sm border border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] mb-3">
            <Flame className="w-4 h-4 text-[hsl(var(--accent-warm))]" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Streak</span>
          </div>
          <span className="font-mono text-4xl font-normal text-[hsl(var(--foreground))]">
            {activeDays}
          </span>
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] block mt-1.5 uppercase tracking-wide">Day Consistency</span>
        </div>
      </div>

      {recentItems.length > 0 && (
        <section className="surface-inset p-5 sm:p-6 rounded-2xl" aria-labelledby="comfort-heading">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 id="comfort-heading" className="font-serif text-xl text-[hsl(var(--foreground))]">
                How did your last input feel?
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Your answer helps choose a better next piece. It is optional.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                ['too-hard', 'Too hard'],
                ['challenging', 'Challenging'],
                ['comfortable', 'Comfortable'],
                ['easy', 'Easy'],
              ] as [ComfortRating, string][]).map(([rating, label]) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setComfortRating(recentItems[0].id, rating)}
                  className={cn(
                    'min-h-10 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    comfortRatings[recentItems[0].id] === rating
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]'
                      : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column: Heatmap & Recent */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contribution Heatmap */}
          <div className="surface-inset p-6 sm:p-8 rounded-3xl border border-[hsl(var(--border))]">
            <h3 className="font-serif text-xl font-medium text-[hsl(var(--foreground))] flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
              Study Activity Map
            </h3>
            <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              <HeatmapCalendar data={heatmapData} />
            </div>
          </div>

          {/* Recent History Ledger */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-medium text-[hsl(var(--foreground))] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
              Recent Sessions
            </h3>

            {recentItems.length === 0 ? (
              <div className="surface-card p-8 rounded-2xl border border-[hsl(var(--border))] text-center">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  No study sessions recorded yet. Play any podcast or reader chapter to begin!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[hsl(var(--border))]">
                {recentItems.map((item) => (
                  <Link
                    href={item.url}
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-4 group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[hsl(var(--border))] group-hover:scale-105 transition-transform",
                        item.type === 'reader' ? "bg-[hsl(var(--reader-green)/0.05)] text-[hsl(var(--reader-green))]" : "bg-[hsl(var(--podcast-sienna)/0.05)] text-[hsl(var(--podcast-sienna))]"
                      )}>
                        {item.type === 'reader' ? (
                          <BookOpen className="w-4 h-4" />
                        ) : (
                          <Headphones className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-0.5">
                          {item.seriesTitle}
                        </div>
                        <div className="font-serif text-[15px] font-medium text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors truncate">
                          {item.title}
                        </div>
                      </div>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Milestones */}
        <div className="lg:col-span-1">
          <div className="surface-card p-6 sm:p-8 rounded-3xl shadow-sm border border-[hsl(var(--border))] sticky top-24">
            <h3 className="font-serif text-xl font-medium text-[hsl(var(--foreground))] mb-6">
              Mastery Journey
            </h3>
            <MilestoneTimeline milestones={milestones} />
          </div>
        </div>
      </div>
    </div>
  );
}
