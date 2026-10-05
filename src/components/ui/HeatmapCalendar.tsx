'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface HeatmapCalendarProps {
  /** Map of 'YYYY-MM-DD' date string to activity count */
  data: Record<string, number>;
  /** Optional container class name */
  className?: string;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAY_LABELS = ['M', '', 'W', '', 'F', '', ''];

function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getActivityColorClass(count: number): string {
  if (count <= 0) {
    return 'bg-[hsl(var(--muted))]';
  }
  if (count <= 2) {
    return 'bg-amber-200 dark:bg-amber-900/80';
  }
  if (count <= 5) {
    return 'bg-amber-400 dark:bg-amber-600';
  }
  return 'bg-amber-600 dark:bg-amber-400';
}

export function HeatmapCalendar({ data = {}, className }: HeatmapCalendarProps) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    // Monday-based day of week (0 = Monday, ..., 6 = Sunday)
    const currentDayOfWeek = (today.getDay() + 6) % 7;

    // Start of the current week (Monday)
    const currentWeekMonday = new Date(today);
    currentWeekMonday.setDate(today.getDate() - currentDayOfWeek);

    // Start of the 12-week range (11 weeks before current week Monday)
    const startMonday = new Date(currentWeekMonday);
    startMonday.setDate(currentWeekMonday.getDate() - 11 * 7);

    // Generate 12 columns, 7 days each
    const generatedWeeks: Date[][] = [];
    for (let w = 0; w < 12; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startMonday);
        date.setDate(startMonday.getDate() + (w * 7 + d));
        week.push(date);
      }
      generatedWeeks.push(week);
    }

    // Determine month labels where a new month starts
    const labels = generatedWeeks.map((week, colIdx) => {
      // Check if the 1st day of a month falls in this week
      const firstOfMonth = week.find((d) => d.getDate() === 1);
      if (firstOfMonth) {
        return MONTH_NAMES[firstOfMonth.getMonth()];
      }

      // For the first column, show month label if next week does not start a new month
      if (colIdx === 0) {
        const nextWeekHasFirst = generatedWeeks[1]?.some((d) => d.getDate() === 1);
        if (!nextWeekHasFirst) {
          return MONTH_NAMES[week[0].getMonth()];
        }
      }

      return null;
    });

    return { weeks: generatedWeeks, monthLabels: labels };
  }, []);

  return (
    <div
      className={cn('inline-flex flex-col select-none', className)}
      role="region"
      aria-label="Activity heatmap"
    >
      {/* Month Labels Header */}
      <div className="flex items-center gap-2 mb-1.5" aria-hidden="true">
        {/* Spacer aligned with day labels column */}
        <div className="w-3.5 shrink-0" />

        {/* Month column headers */}
        <div className="flex gap-[2px]">
          {weeks.map((_, colIdx) => (
            <div key={colIdx} className="w-[11px] relative h-3.5 shrink-0">
              {monthLabels[colIdx] ? (
                <span className="absolute left-0 top-0 text-[10px] font-sans font-medium text-[hsl(var(--muted-foreground))] select-none whitespace-nowrap leading-none">
                  {monthLabels[colIdx]}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Grid with Day Labels */}
      <div className="flex items-start gap-2">
        {/* Day Labels Column (M, W, F) */}
        <div
          className="flex flex-col gap-[2px] w-3.5 shrink-0"
          aria-hidden="true"
        >
          {DAY_LABELS.map((label, rowIdx) => (
            <div
              key={rowIdx}
              className="h-[11px] flex items-center justify-end pr-0.5 text-[9px] font-sans font-medium text-[hsl(var(--muted-foreground))] leading-none select-none"
            >
              {label}
            </div>
          ))}
        </div>

        {/* 12-week Columns × 7 Rows */}
        <div
          className="flex gap-[2px]"
          role="grid"
          aria-label="Contribution heatmap over the last 12 weeks"
        >
          {weeks.map((week, colIdx) => (
            <div
              key={colIdx}
              className="flex flex-col gap-[2px] shrink-0"
              role="row"
            >
              {week.map((date) => {
                const dateStr = formatDateKey(date);
                const count = data[dateStr] ?? 0;
                const tooltip = `${dateStr}: ${count} items`;
                const colorClass = getActivityColorClass(count);

                return (
                  <div
                    key={dateStr}
                    role="gridcell"
                    tabIndex={0}
                    title={tooltip}
                    aria-label={tooltip}
                    className={cn(
                      'w-[11px] h-[11px] rounded-sm transition-colors',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500',
                      colorClass
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HeatmapCalendar;
