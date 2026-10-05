'use client';

import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import type { SectionAlignment } from '@/types/alignment';
import { isSectionAlignment } from '@/lib/alignment';
import { cn } from '@/lib/utils';

interface Props {
  sources: string[];
  className?: string;
}

export function AlignmentBadge({ sources, className }: Props) {
  const [available, setAvailable] = useState(false);
  const sourceKey = sources.join('|');

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      for (const source of sources) {
        try {
          const response = await fetch(source);
          if (!response.ok) continue;
          const data = (await response.json()) as SectionAlignment;
          if (isSectionAlignment(data)) {
            if (mounted) setAvailable(true);
            return;
          }
        } catch {
          // Generated alignment files may arrive while the app is running.
        }
      }
      if (mounted) setAvailable(false);
    };
    void check();
    const interval = window.setInterval(() => void check(), 30_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [sourceKey]);

  if (!available) return null;

  return (
    <span
      title="Audio and transcript are synchronized"
      aria-label="Audio and transcript are synchronized"
      className={cn('inline-flex items-center text-emerald-600 dark:text-emerald-400', className)}
    >
      <Radio className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  );
}
