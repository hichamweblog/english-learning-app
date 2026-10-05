'use client';

import React from 'react';
import Link from 'next/link';
import {
  Mic,
  Play,
  Pause,
  Video,
  FileText,
  CheckCircle2,
  ExternalLink,
  Volume2,
  Sparkles,
} from 'lucide-react';
import type { PodcastEpisode } from '@/types/content';
import { useAudioStore, useProgressStore } from '@/lib/store';
import { resolveMediaUrl, cn } from '@/lib/utils';
import { AlignmentBadge } from '@/components/AudioPlayer/AlignmentBadge';

interface Props {
  lessons: PodcastEpisode[];
}

export function AccentBrowser({ lessons }: Props) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();
  const { completedItems, toggleCompleted } = useProgressStore();

  const handlePlay = (lesson: PodcastEpisode) => {
    if (currentTrack?.id === lesson.id) {
      togglePlay();
      return;
    }
    playTrack({
      id: lesson.id,
      title: lesson.title,
      seriesTitle: lesson.seriesTitle,
      audioPath: lesson.audioPath,
      pdfPath: lesson.pdfPath,
      levelLabel: lesson.levelLabel,
      itemUrl: `/accent`,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {lessons.map((lesson) => {
        const isCurrentlyPlaying = currentTrack?.id === lesson.id && isPlaying;
        const isCurrentActive = currentTrack?.id === lesson.id;
        const isCompleted = completedItems[lesson.id] || false;
        const pdfUrl = lesson.pdfPath ? resolveMediaUrl(lesson.pdfPath) : null;
        const videoUrl = lesson.videoPath ? resolveMediaUrl(lesson.videoPath) : null;

        return (
          <div
            key={lesson.id}
            className={cn(
              'p-5 rounded-2xl border bg-white dark:bg-[#14161C] transition-all flex flex-col justify-between gap-4 shadow-2xs hover:shadow-xs relative overflow-hidden',
              isCurrentActive
                ? 'border-amber-500/80 ring-1 ring-amber-500/30'
                : 'border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600/60'
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/accent/${lesson.id}`}
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900"
                  >
                    {lesson.number === 0 ? 'Intro' : `Unit ${lesson.number}`}
                  </Link>
                  <AlignmentBadge sources={[
                    `/data/alignments/accent/${lesson.id}.json`,
                    `/data/alignments/accent/unit-${String(lesson.number).padStart(2, '0')}.json`,
                  ]} />
                </div>

                <button
                  type="button"
                  onClick={() => toggleCompleted(lesson.id)}
                  aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                  className={cn(
                    'p-1 rounded-full transition-colors',
                    isCompleted
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'text-stone-300 dark:text-stone-700 hover:text-stone-500'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>

              <Link href={`/accent/${lesson.id}`} className="group/title block">
                <h3 className="min-w-0 font-serif text-lg font-medium text-stone-900 dark:text-stone-100 group-hover/title:text-amber-700 dark:group-hover/title:text-amber-400">
                  {lesson.title}
                </h3>
              </Link>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Acoustic pronunciation model with audio drill exercises & guide.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 border-t border-stone-100 pt-3 dark:border-stone-800/80 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => handlePlay(lesson)}
                className={cn(
                  'inline-flex w-full shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-all sm:w-auto',
                  isCurrentlyPlaying
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-950/80'
                )}
              >
                {isCurrentlyPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Drill</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>Play Drill</span>
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                <Link
                  href={`/accent/${lesson.id}`}
                  className="text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400"
                >
                  Open unit
                </Link>
                {videoUrl && (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Watch Video Lesson"
                    className="p-1.5 text-stone-500 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                  >
                    <Video className="w-4 h-4" />
                    <span className="hidden sm:inline">Video</span>
                  </a>
                )}

                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open Unit PDF"
                    className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
