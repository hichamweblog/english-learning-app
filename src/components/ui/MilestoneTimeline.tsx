'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent?: boolean;
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
  className?: string;
}

export function MilestoneTimeline({ milestones, className }: MilestoneTimelineProps) {
  return (
    <div className={cn('relative space-y-0', className)}>
      {milestones.map((milestone, index) => {
        const isLast = index === milestones.length - 1;
        
        return (
          <div key={milestone.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Timeline track */}
            {!isLast && (
              <div 
                className={cn(
                  'absolute left-3.5 top-8 bottom-0 w-px -ml-[0.5px]',
                  milestone.isCompleted ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--border))]'
                )} 
              />
            )}
            
            {/* Node */}
            <div className="relative z-10 flex-shrink-0 mt-1">
              {milestone.isCompleted ? (
                <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] flex items-center justify-center ring-4 ring-[hsl(var(--background))]">
                  <CheckCircle2 className="w-4 h-4 fill-current text-[hsl(var(--background))]" />
                </div>
              ) : milestone.isCurrent ? (
                <div className="w-7 h-7 rounded-full bg-[hsl(var(--background))] border-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] flex items-center justify-center ring-4 ring-[hsl(var(--background))]">
                  <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-[hsl(var(--muted))] border-2 border-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] flex items-center justify-center ring-4 ring-[hsl(var(--background))]">
                  <Lock className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className={cn(
              'flex-1 pt-1.5',
              !milestone.isCompleted && !milestone.isCurrent && 'opacity-60'
            )}>
              <h4 className={cn(
                'text-sm font-semibold',
                milestone.isCompleted ? 'text-[hsl(var(--foreground))]' : 
                milestone.isCurrent ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'
              )}>
                {milestone.title}
              </h4>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {milestone.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
