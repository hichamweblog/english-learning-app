'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  ExternalLink,
  Edit3,
  Bookmark,
  Copy,
  Download,
  Check,
  Headphones,
  Sparkles,
} from 'lucide-react';
import type { PodcastEpisode } from '@/types/content';
import { useAudioStore, useProgressStore } from '@/lib/store';
import { resolveMediaUrl, formatTime, cn } from '@/lib/utils';

interface Props {
  episode: PodcastEpisode;
  prevEpisode: PodcastEpisode | null;
  nextEpisode: PodcastEpisode | null;
}

export function EpisodeStudyView({ episode, prevEpisode, nextEpisode }: Props) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();
  const { completedItems, toggleCompleted, addRecentItem } = useProgressStore();

  const [activeTab, setActiveTab] = useState<'guide' | 'notes'>('guide');
  const [noteText, setNoteText] = useState('');
  const [copied, setCopied] = useState(false);

  const isCurrentActive = currentTrack?.id === episode.id && isPlaying;
  const isCompleted = completedItems[episode.id] || false;

  const audioUrl = resolveMediaUrl(episode.audioPath);
  const pdfUrl = episode.pdfPath ? resolveMediaUrl(episode.pdfPath) : null;

  // Load and save personal notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`notes_${episode.id}`);
    if (saved) setNoteText(saved);

    addRecentItem({
      id: episode.id,
      type: 'podcast',
      title: episode.title,
      seriesTitle: episode.seriesTitle,
      url: `/podcasts/${episode.id}`,
    });
  }, [episode, addRecentItem]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    localStorage.setItem(`notes_${episode.id}`, text);
  };

  const copyNotes = () => {
    navigator.clipboard.writeText(noteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadNotes = () => {
    const blob = new Blob([noteText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${episode.title.replace(/[^a-zA-Z0-9]/g, '_')}_notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePlay = () => {
    if (currentTrack?.id === episode.id) {
      togglePlay();
      return;
    }
    playTrack({
      id: episode.id,
      title: episode.title,
      seriesTitle: episode.seriesTitle,
      audioPath: episode.audioPath,
      pdfPath: episode.pdfPath,
      levelLabel: episode.levelLabel,
      itemUrl: `/podcasts/${episode.id}`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Next/Prev Controls */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <Link
          href={`/podcasts?series=${episode.series}`}
          className="hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1 font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to {episode.seriesTitle}</span>
        </Link>

        {/* Prev / Next Episode Jumpers */}
        <div className="flex items-center gap-1.5">
          {prevEpisode && (
            <Link
              href={`/podcasts/${prevEpisode.id}`}
              className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 font-mono text-[11px]"
              title={prevEpisode.title}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>#{prevEpisode.number}</span>
            </Link>
          )}
          {nextEpisode && (
            <Link
              href={`/podcasts/${nextEpisode.id}`}
              className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 font-mono text-[11px]"
              title={nextEpisode.title}
            >
              <span>#{nextEpisode.number}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Main Episode Masthead */}
      <div className="p-6 sm:p-8 rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#14161C] shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
              Episode #{episode.number}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              {episode.seriesTitle}
            </span>
            {episode.levelLabel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                {episode.levelLabel}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleCompleted(episode.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border',
              isCompleted
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                : 'text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Marked Complete' : 'Mark as Complete'}</span>
          </button>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-stone-900 dark:text-stone-50">
          {episode.title}
        </h1>

        {/* Primary Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePlay}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 font-semibold text-sm shadow-md hover:scale-102 active:scale-98 transition-all"
          >
            {isCurrentActive ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Lesson Audio</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play Lesson Audio</span>
              </>
            )}
          </button>

          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open PDF in New Window</span>
            </a>
          )}
        </div>
      </div>

      {/* Workspace Tabs: Study Guide vs Vocabulary Notebook */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={cn(
              'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'guide'
                ? 'border-stone-900 text-stone-950 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Study Guide & Transcript</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={cn(
              'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'notes'
                ? 'border-stone-900 text-stone-950 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            )}
          >
            <Edit3 className="w-4 h-4" />
            <span>Personal Vocabulary & Notes</span>
            {noteText.trim() && (
              <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400" />
            )}
          </button>
        </div>

        {/* Tab 1: Embedded PDF Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-3">
            {pdfUrl ? (
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900 shadow-xs h-[750px] relative">
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0`}
                  title="Study Guide PDF"
                  className="w-full h-full border-none"
                />
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 text-stone-500">
                <p className="font-serif text-lg text-stone-800 dark:text-stone-200">Audio-Only Unit</p>
                <p className="text-xs mt-1 text-stone-500">Listen along using the audio controls above to complete this lesson.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Personal Notes & Targeted Vocabulary */}
        {activeTab === 'notes' && (
          <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100">
                  Lesson Word Bank & Expressions
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Save new collocations, cultural idioms, and your own practice sentences. Auto-saved locally.
                </p>
              </div>

              {noteText.trim() && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyNotes}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadNotes}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export .txt</span>
                  </button>
                </div>
              )}
            </div>

            <textarea
              value={noteText}
              onChange={handleNotesChange}
              placeholder="Record vocabulary from this lesson...&#10;&#10;e.g.&#10;• to learn the ropes: to learn how a new role or system works&#10;• take with a grain of salt: don't accept completely as true&#10;&#10;My practice sentence: When I started at the laboratory, it took me two months to learn the ropes."
              rows={14}
              className="w-full p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FAF8F5] dark:bg-stone-950 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  );
}
