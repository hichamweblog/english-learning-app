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
import { useProgressStore } from '@/lib/store';
import { HeatmapCalendar } from '@/components/ui/HeatmapCalendar';
import { MilestoneTimeline, type Milestone } from '@/components/ui/MilestoneTimeline';
import { cn } from '@/lib/utils';

export function ProgressDashboard() {
  const [mounted, setMounted] = useState(false);
  const { completedItems, recentItems } = useProgressStore();

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

  // Generate fake heatmap data for the demo based on completed items count
  const today = new Date();
  const dummyHeatmapData: Record<string, number> = {};
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Fake some activity
    if (Math.random() > 0.4) {
      dummyHeatmapData[dateStr] = Math.floor(Math.random() * 5) + 1;
    }
  }

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
            {completedList.length > 0 ? '12' : '0'}
          </span>
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] block mt-1.5 uppercase tracking-wide">Day Consistency</span>
        </div>
      </div>

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
              <HeatmapCalendar data={dummyHeatmapData} />
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
