'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Volume2, ArrowDownCircle, CheckCircle, Radio, BookmarkPlus, X } from 'lucide-react';
import type { SectionAlignment, AlignedParagraph, AlignedWord } from '@/types/alignment';
import type { GlossaryEntry } from '@/types/content';
import { useAudioStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getAlignmentCapability } from '@/lib/alignment';

interface Props {
  alignment?: SectionAlignment | null;
  fallbackText?: string;
  trackId: string;
  fontSize?: number; // 14-28
  lineHeight?: number; // 1.5, 1.75, 2.0
  readingTheme?: 'default' | 'sepia' | 'ocean' | 'night';
  className?: string;
  glossary?: GlossaryEntry[];
  onSaveGlossaryEntry?: (entry: GlossaryEntry) => void;
}

export function SyncedReadAlong({
  alignment,
  fallbackText,
  trackId,
  fontSize = 20,
  lineHeight = 1.75,
  readingTheme = 'default',
  className,
  glossary = [],
  onSaveGlossaryEntry,
}: Props) {
  const { currentTrack, isPlaying, seek, playTrack } = useAudioStore();
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [selectedEntry, setSelectedEntry] = useState<GlossaryEntry | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledParaRef = useRef<string | null>(null);

  const isCurrentTrackPlaying = currentTrack?.id === trackId && isPlaying;

  const alignmentCapability = getAlignmentCapability(alignment);

  // Flatten all words into a sorted list for fast binary search
  const flatWords = useMemo(() => {
    if (!alignment?.paragraphs) return [];
    const list: (AlignedWord & { paragraphId: string })[] = [];
    for (const p of alignment.paragraphs) {
      for (const w of p.words) {
        list.push({ ...w, paragraphId: p.id });
      }
    }
    return list;
  }, [alignment]);

  // Fast binary search for active word given currentTime
  const findActiveIndices = useCallback(
    (time: number) => {
      if (alignmentCapability === 'unavailable') return { word: null, paragraphId: null };

      let low = 0;
      let high = flatWords.length - 1;
      let found: (AlignedWord & { paragraphId: string }) | null = null;

      while (alignmentCapability === 'word' && low <= high) {
        const mid = Math.floor((low + high) / 2);
        const w = flatWords[mid];
        if (time >= w.start && time <= w.end) {
          found = w;
          break;
        } else if (time < w.start) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      // If in a very brief micro-pause between connected words (< 250ms), keep previous word
      // but do NOT linger during natural speech pauses (> 250ms) to ensure 100% acoustic lock
      if (!found && high >= 0 && high < flatWords.length) {
        const prev = flatWords[high];
        const next = high + 1 < flatWords.length ? flatWords[high + 1] : null;
        if (next && time >= prev.end && time < next.start && (next.start - prev.end) < 0.25) {
          found = prev;
        }
      }

      if (found) {
        return { word: found, paragraphId: found.paragraphId };
      }

      // Fallback: check paragraphs directly
      if (alignment?.paragraphs) {
        for (const p of alignment.paragraphs) {
          if (time >= p.start && time <= p.end) {
            return { word: null, paragraphId: p.id };
          }
        }
      }

      return { word: null, paragraphId: null };
    },
    [flatWords, alignment, alignmentCapability]
  );

  // High-frequency time listener via global-audio-element and requestAnimationFrame
  useEffect(() => {
    const isCurrentTrack = currentTrack?.id === trackId;
    if (!isCurrentTrack) {
      if (activeWordId !== null) setActiveWordId(null);
      if (activeParagraphId !== null) setActiveParagraphId(null);
      return;
    }

    const audioElement = document.getElementById('global-audio-element') as HTMLAudioElement | null;
    if (!audioElement) return;

    const updateWordAtTime = () => {
      const time = audioElement.currentTime;
      const { word, paragraphId } = findActiveIndices(time);

      if (word && word.id !== activeWordId) {
        setActiveWordId(word.id);
      } else if (!word && activeWordId !== null) {
        setActiveWordId(null);
      }

      if (paragraphId && paragraphId !== activeParagraphId) {
        setActiveParagraphId(paragraphId);
      }
    };

    updateWordAtTime();

    if (isPlaying) {
      let animFrameId: number;
      const loop = () => {
        updateWordAtTime();
        animFrameId = requestAnimationFrame(loop);
      };
      animFrameId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animFrameId);
    } else {
      audioElement.addEventListener('timeupdate', updateWordAtTime);
      audioElement.addEventListener('seeked', updateWordAtTime);
      return () => {
        audioElement.removeEventListener('timeupdate', updateWordAtTime);
        audioElement.removeEventListener('seeked', updateWordAtTime);
      };
    }
  }, [currentTrack?.id, trackId, isPlaying, findActiveIndices, activeWordId, activeParagraphId]);

  // Smooth auto-scroll to active paragraph
  useEffect(() => {
    if (!autoScroll || !activeParagraphId || activeParagraphId === lastScrolledParaRef.current) {
      return;
    }

    lastScrolledParaRef.current = activeParagraphId;
    const el = document.getElementById(activeParagraphId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeParagraphId, autoScroll]);

  // Click on word to seek
  const glossaryByTerm = useMemo(() => {
    return new Map(glossary.map((entry) => [entry.term.trim().toLowerCase(), entry]));
  }, [glossary]);

  const handleWordClick = (word: AlignedWord) => {
    seek(word.start);
    const normalized = word.text.replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase();
    setSelectedEntry(glossaryByTerm.get(normalized) || null);
  };

  const hasAlignment = alignmentCapability !== 'unavailable';

  return (
    <div ref={containerRef} className={cn('relative space-y-6', className)}>
      {/* Synchronization Toolbar */}
      {hasAlignment && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-xl bg-[hsl(var(--foreground)/0.03)] border border-[hsl(var(--border))] text-xs select-none">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] font-semibold text-[11px]">
              <Radio className="w-3 h-3 animate-pulse" />
              {alignmentCapability === 'word' ? 'Word-synced audio' : 'Paragraph-synced audio'}
            </span>
            <span className="text-[hsl(var(--muted-foreground))] hidden sm:inline">
              {alignmentCapability === 'word' ? 'Click any word to seek' : 'Audio follows each paragraph'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoScroll((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors border',
                autoScroll
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border-[hsl(var(--border))] shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] border-transparent hover:bg-[hsl(var(--foreground)/0.06)]'
              )}
            >
              <ArrowDownCircle className={cn('w-3.5 h-3.5', autoScroll ? 'text-[hsl(var(--primary))]' : '')} />
              <span>Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      )}

      {selectedEntry && (
        <aside className="surface-elevated relative max-w-md p-4 sm:p-5" aria-live="polite">
          <button
            type="button"
            onClick={() => setSelectedEntry(null)}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--foreground)/0.06)]"
            aria-label="Close word explanation"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="pr-8 text-xs font-bold uppercase tracking-wider text-[hsl(var(--accent-warm))]">
            In context
          </p>
          <h3 className="mt-1 font-serif text-xl text-[hsl(var(--foreground))]">{selectedEntry.term}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
            {selectedEntry.definition}
          </p>
          {selectedEntry.exampleSentence && (
            <p className="mt-3 border-l-2 border-[hsl(var(--accent-warm)/0.5)] pl-3 text-sm italic text-[hsl(var(--foreground))]">
              “{selectedEntry.exampleSentence}”
            </p>
          )}
          {onSaveGlossaryEntry && (
            <button
              type="button"
              onClick={() => onSaveGlossaryEntry(selectedEntry)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.06)]"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              Save to notebook
            </button>
          )}
        </aside>
      )}

      {/* Main Reading Viewport */}
      {hasAlignment ? (
        <div
          className={cn('font-serif space-y-6')}
          style={{ fontSize: `${fontSize}px`, lineHeight }}
        >
          {alignment?.paragraphs.map((p) => {
            const isCurrentP = activeParagraphId === p.id;
            return (
              <div
                key={p.id}
                id={p.id}
                className={cn(
                  'reading-spotlight',
                  isCurrentP ? 'reading-spotlight-active' : (activeParagraphId && isPlaying) ? 'reading-spotlight-dim' : ''
                )}
              >
                {alignmentCapability === 'word'
                  ? p.words.map((w) => {
                      const isCurrentW = activeWordId === w.id;
                      return (
                        <span
                          key={w.id}
                          id={w.id}
                          onClick={() => handleWordClick(w)}
                          title={`Seek to ${Math.floor(w.start / 60)}:${String(Math.floor(w.start % 60)).padStart(2, '0')}`}
                          className={cn(
                            'cursor-pointer transition-all duration-100',
                            isCurrentW
                              ? 'word-highlight'
                              : 'hover:text-[hsl(var(--primary))] hover:underline decoration-[hsl(var(--primary)/0.4)] underline-offset-4'
                          )}
                        >
                          {w.text}{' '}
                        </span>
                      );
                    })
                  : p.text}
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback Unaligned View */
        <div className="space-y-4">
          <div
            className={cn('font-serif whitespace-pre-line')}
            style={{ fontSize: `${fontSize}px`, lineHeight }}
          >
            {fallbackText}
          </div>
          {fallbackText && (
            <p className="border-t border-[hsl(var(--border))] pt-3 text-xs text-[hsl(var(--muted-foreground))]">
              Follow-along timing is not available for this item yet. You can still listen and read at your own pace.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
