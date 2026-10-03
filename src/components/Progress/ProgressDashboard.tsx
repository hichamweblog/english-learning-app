'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Flame,
  BookOpen,
  Headphones,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Calendar,
} from 'lucide-react';
import { useProgressStore, useAudioStore } from '@/lib/store';
import { formatTime, cn } from '@/lib/utils';

export function ProgressDashboard() {
  const [mounted, setMounted] = useState(false);
  const { completedItems, recentItems, toggleCompleted } = useProgressStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const completedList = Object.entries(completedItems).filter(([_, isDone]) => isDone);
  const podcastCompleted = completedList.filter(([id]) => !id.startsWith('reader')).length;
  const readersCompleted = completedList.filter(([id]) => id.startsWith('reader')).length;

  // Estimate total listening immersion (approx 18 mins per podcast episode, 45 mins per reader)
  const totalImmersionMinutes = (podcastCompleted * 18) + (readersCompleted * 45);
  const immersionHours = (totalImmersionMinutes / 60).toFixed(1);

  // 7-day consistency tracker mockup dots
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-8">
      {/* Header Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-stone-900 dark:text-stone-50">
            Immersion & Mastery Ledger
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Your personal record of authentic listening, reading, and vocabulary acquisition.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] shadow-2xs">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Immersion Time</span>
          </div>
          <span className="font-mono text-3xl font-bold text-stone-900 dark:text-stone-100">
            {immersionHours}h
          </span>
          <span className="text-xs text-stone-400 block mt-1">Authentic Speech Absorbed</span>
        </div>

        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] shadow-2xs">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <Headphones className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Podcasts</span>
          </div>
          <span className="font-mono text-3xl font-bold text-stone-900 dark:text-stone-100">
            {podcastCompleted}
          </span>
          <span className="text-xs text-stone-400 block mt-1">Episodes Mastered</span>
        </div>

        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] shadow-2xs">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Graded Readers</span>
          </div>
          <span className="font-mono text-3xl font-bold text-stone-900 dark:text-stone-100">
            {readersCompleted}
          </span>
          <span className="text-xs text-stone-400 block mt-1">Books Finished</span>
        </div>

        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] shadow-2xs">
          <div className="flex items-center gap-2 text-stone-500 mb-2">
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Study Habit</span>
          </div>
          <span className="font-mono text-3xl font-bold text-stone-900 dark:text-stone-100">
            {completedList.length > 0 ? 'Active' : 'Today'}
          </span>
          <span className="text-xs text-stone-400 block mt-1">Daily Exposure</span>
        </div>
      </div>

      {/* 7-Day Habit Tracker Card */}
      <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-[#F6F3EC]/70 dark:bg-[#16181F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-base font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            Weekly Immersion Consistency
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            15 to 30 minutes of listening every day delivers steady fluency breakthroughs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {weekDays.map((day, idx) => (
            <div key={day} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-mono text-stone-400">{day}</span>
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold transition-all',
                  idx <= 4
                    ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-stone-950'
                    : 'bg-stone-200/80 dark:bg-stone-800 text-stone-400'
                )}
              >
                {idx <= 4 ? '✓' : '·'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent History Ledger */}
      <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          Recent Sessions History
        </h2>

        {recentItems.length === 0 ? (
          <p className="text-xs text-stone-500 py-4">
            No study sessions recorded yet. Play any podcast or reader chapter to begin!
          </p>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-4 group"
              >
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block">
                    {item.seriesTitle}
                  </span>
                  <Link
                    href={item.url}
                    className="font-serif text-base font-normal text-stone-900 dark:text-stone-100 hover:underline transition-colors truncate block"
                  >
                    {item.title}
                  </Link>
                </div>

                <Link
                  href={item.url}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-900 hover:text-white dark:hover:bg-stone-100 dark:hover:text-stone-900 transition-colors shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Items Ledger */}
      {completedList.length > 0 && (
        <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Mastered Units Ledger ({completedList.length})
            </h2>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800/80 max-h-96 overflow-y-auto pr-2">
            {completedList.map(([id]) => (
              <div key={id} className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-mono text-stone-700 dark:text-stone-300">
                  {id}
                </span>
                <button
                  type="button"
                  onClick={() => toggleCompleted(id)}
                  className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Remove mark
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
