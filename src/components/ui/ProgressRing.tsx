'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackColor?: string;
  progressColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 40,
  strokeWidth = 3,
  className,
  trackColor = 'text-[hsl(var(--muted))]',
  progressColor = 'text-[hsl(var(--primary))]',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{
          // @ts-ignore
          '--ring-circumference': `${circumference}px`,
          '--ring-offset': `${offset}px`,
        }}
      >
        <circle
          className={cn('fill-transparent stroke-current', trackColor)}
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn('fill-transparent stroke-current transition-all duration-1000 ease-out', progressColor)}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}px`}
          strokeDashoffset={`${offset}px`}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
