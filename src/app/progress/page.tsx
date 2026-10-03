import React from 'react';
import { ProgressDashboard } from '@/components/Progress/ProgressDashboard';

export const metadata = {
  title: 'My Progress — ContentFirst English',
  description:
    'Track your completed lessons, reading achievements, listening time, and study streak.',
};

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Learning Progress
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Your personal completion tracking, listening history, and streak.
        </p>
      </div>

      <ProgressDashboard />
    </div>
  );
}
