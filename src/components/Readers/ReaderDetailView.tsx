'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  ChevronLeft,
  CheckCircle2,
  FileText,
  ExternalLink,
  Edit3,
  Headphones,
  BookOpen,
  Copy,
  Download,
  Check,
  Sun,
  Moon,
  Maximize2,
} from 'lucide-react';
import type { GradedReaderBook, GradedReaderChapter } from '@/types/content';
import { useAudioStore, useProgressStore } from '@/lib/store';
import { resolveMediaUrl, cn } from '@/lib/utils';

interface Props {
  reader: GradedReaderBook;
}

export function ReaderDetailView({ reader }: Props) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();
  const { completedItems, toggleCompleted, addRecentItem } = useProgressStore();

  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'interactive' | 'pdf'>('interactive');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [readingTheme, setReadingTheme] = useState<'default' | 'sepia' | 'night'>('default');
  const [noteText, setNoteText] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'reader' | 'notes'>('reader');

  const isCompleted = completedItems[reader.id] || false;
  const pdfUrl = resolveMediaUrl(reader.pdfPath);

  const currentChapter = reader.chapters[selectedChapterIdx] || reader.chapters[0];
  const hasExtractedText = !!(currentChapter && currentChapter.storyText && currentChapter.storyText.length > 50);

  useEffect(() => {
    const saved = localStorage.getItem(`notes_${reader.id}`);
    if (saved) setNoteText(saved);

    addRecentItem({
      id: reader.id,
      type: 'reader',
      title: reader.title,
      seriesTitle: `Reader (${reader.levelLabel})`,
      url: `/readers/${reader.id}`,
    });
  }, [reader, addRecentItem]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    localStorage.setItem(`notes_${reader.id}`, text);
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
    a.download = `${reader.title.replace(/[^a-zA-Z0-9]/g, '_')}_notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePlayChapter = (chapter: GradedReaderChapter, index: number) => {
    setSelectedChapterIdx(index);
    const trackId = `${reader.id}-ch-${chapter.chapterNumber}`;
    if (currentTrack?.id === trackId) {
      togglePlay();
      return;
    }
    playTrack({
      id: trackId,
      title: `${reader.title} — ${chapter.title}`,
      seriesTitle: `Graded Reader (${reader.levelLabel})`,
      audioPath: chapter.audioPath,
      pdfPath: reader.pdfPath,
      levelLabel: reader.levelLabel,
      itemUrl: `/readers/${reader.id}`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/readers"
          className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1 font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Readers Library</span>
        </Link>
      </div>

      {/* Book Header Masthead */}
      <div className="p-6 sm:p-8 rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#14161C] shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {reader.levelLabel}
            </span>
            <span className="text-xs text-stone-400 font-mono">
              {reader.seriesCode}
            </span>
            {reader.hasAudio && (
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-medium flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5" />
                {reader.audioTracksCount} Audio Chapters
              </span>
            )}
            {reader.hasExercises && (
              <span className="text-xs text-amber-700 dark:text-amber-400 font-mono font-medium px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40">
                Exercises & Activities
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleCompleted(reader.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border',
              isCompleted
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                : 'text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Book Finished' : 'Mark as Finished'}</span>
          </button>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-stone-900 dark:text-stone-50">
          {reader.title}
        </h1>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          {reader.chapters.length > 0 && (
            <button
              type="button"
              onClick={() => handlePlayChapter(reader.chapters[0], 0)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm shadow-md hover:scale-102 active:scale-98 transition-all"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Begin Chapter 1</span>
            </button>
          )}

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

      {/* Chapters Audio Playlist */}
      {reader.chapters.length > 0 && (
        <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Audio Chapters Playlist ({reader.chapters.length})
            </h2>
            <span className="text-xs text-stone-400">Click any chapter to listen & read along</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {reader.chapters.map((ch, idx) => {
              const trackId = `${reader.id}-ch-${ch.chapterNumber}`;
              const isChPlaying = currentTrack?.id === trackId && isPlaying;
              const isChActive = selectedChapterIdx === idx;

              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handlePlayChapter(ch, idx)}
                  className={cn(
                    'p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all',
                    isChActive
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500/20'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/60 dark:bg-stone-900/50'
                  )}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 font-mono block">
                      Track #{ch.chapterNumber} {ch.wordCount ? `• ${ch.wordCount} words` : ''}
                    </span>
                    <h4 className="font-serif text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                      {ch.title}
                    </h4>
                  </div>
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all',
                      isChPlaying
                        ? 'bg-emerald-800 text-white dark:bg-emerald-600'
                        : isChActive
                        ? 'bg-emerald-700 text-white dark:bg-emerald-700'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    )}
                  >
                    {isChPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Workspace Tabs: Book Reader vs Story Notebook */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('reader')}
              className={cn(
                'px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2',
                activeTab === 'reader'
                  ? 'border-emerald-800 text-emerald-900 dark:border-emerald-400 dark:text-emerald-400'
                  : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span>Chapter Reader</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={cn(
                'px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2',
                activeTab === 'notes'
                  ? 'border-emerald-800 text-emerald-900 dark:border-emerald-400 dark:text-emerald-400'
                  : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              )}
            >
              <Edit3 className="w-4 h-4" />
              <span>Story Notebook & Vocabulary</span>
              {noteText.trim() && (
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              )}
            </button>
          </div>

          {/* Reading Controls */}
          {activeTab === 'reader' && (
            <div className="flex items-center gap-3">
              {/* Toggle view between Interactive Text and Original PDF */}
              {hasExtractedText && pdfUrl && (
                <div className="flex items-center rounded-lg border border-stone-200 dark:border-stone-800 p-0.5 bg-stone-100 dark:bg-stone-900 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setViewMode('interactive')}
                    className={cn(
                      'px-2.5 py-1 rounded-md transition-all',
                      viewMode === 'interactive'
                        ? 'bg-white dark:bg-stone-800 text-emerald-800 dark:text-emerald-400 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    )}
                  >
                    Interactive Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('pdf')}
                    className={cn(
                      'px-2.5 py-1 rounded-md transition-all',
                      viewMode === 'pdf'
                        ? 'bg-white dark:bg-stone-800 text-emerald-800 dark:text-emerald-400 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    )}
                  >
                    Original PDF
                  </button>
                </div>
              )}

              {/* Font Size Selector (for Interactive Text) */}
              {viewMode === 'interactive' && hasExtractedText && (
                <div className="hidden sm:flex items-center gap-1 border border-stone-200 dark:border-stone-800 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFontSize('sm')}
                    className={cn('px-2 py-0.5 rounded', fontSize === 'sm' && 'bg-stone-200 dark:bg-stone-800 font-bold')}
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize('base')}
                    className={cn('px-2 py-0.5 rounded', fontSize === 'base' && 'bg-stone-200 dark:bg-stone-800 font-bold')}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize('lg')}
                    className={cn('px-2 py-0.5 rounded', fontSize === 'lg' && 'bg-stone-200 dark:bg-stone-800 font-bold')}
                  >
                    A+
                  </button>
                </div>
              )}

              {/* Reading Theme Selector */}
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <button
                  type="button"
                  onClick={() => setReadingTheme('default')}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-semibold border transition-all',
                    readingTheme === 'default'
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900'
                      : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                  )}
                >
                  Paper
                </button>
                <button
                  type="button"
                  onClick={() => setReadingTheme('sepia')}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-semibold border transition-all',
                    readingTheme === 'sepia'
                      ? 'bg-amber-200 text-amber-950 border-amber-300 font-bold'
                      : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                  )}
                >
                  Sepia
                </button>
                <button
                  type="button"
                  onClick={() => setReadingTheme('night')}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-semibold border transition-all',
                    readingTheme === 'night'
                      ? 'bg-stone-800 text-stone-100 border-stone-700'
                      : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                  )}
                >
                  Night
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reader Display */}
        {activeTab === 'reader' && (
          hasExtractedText && viewMode === 'interactive' ? (
            <div
              className={cn(
                'p-6 sm:p-10 rounded-2xl border transition-all space-y-8',
                readingTheme === 'default' && 'bg-white dark:bg-[#14161C] border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100',
                readingTheme === 'sepia' && 'bg-[#FAF6EE] text-[#433422] border-amber-200',
                readingTheme === 'night' && 'bg-[#181A20] text-stone-200 border-stone-800'
              )}
            >
              {/* Chapter Title Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/60 dark:border-stone-800 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Chapter {currentChapter.chapterNumber} of {reader.chapters.length}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1">
                    {currentChapter.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayChapter(currentChapter, selectedChapterIdx)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors"
                  >
                    {currentTrack?.id === `${reader.id}-ch-${currentChapter.chapterNumber}` && isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause Chapter Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        <span>Play Chapter Audio</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Story Text */}
              <div
                className={cn(
                  'font-serif leading-relaxed whitespace-pre-line',
                  fontSize === 'sm' && 'text-sm sm:text-base leading-7',
                  fontSize === 'base' && 'text-base sm:text-lg leading-8',
                  fontSize === 'lg' && 'text-lg sm:text-xl leading-9',
                  fontSize === 'xl' && 'text-xl sm:text-2xl leading-10'
                )}
              >
                {currentChapter.storyText}
              </div>

              {/* Activities & Exercises Card */}
              {currentChapter.hasActivities && currentChapter.activitiesText && (
                <div className="mt-8 p-6 rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                    <h3 className="font-serif text-lg font-semibold text-amber-950 dark:text-amber-200">
                      Chapter Activities & Comprehension Exercises
                    </h3>
                  </div>
                  <div className="font-sans text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed">
                    {currentChapter.activitiesText}
                  </div>
                </div>
              )}

              {/* Chapter Navigation Footer */}
              <div className="flex items-center justify-between border-t border-stone-200/60 dark:border-stone-800 pt-6">
                <button
                  type="button"
                  disabled={selectedChapterIdx === 0}
                  onClick={() => {
                    const prevIdx = selectedChapterIdx - 1;
                    handlePlayChapter(reader.chapters[prevIdx], prevIdx);
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  ← Previous Chapter
                </button>

                <span className="text-xs font-mono text-stone-400">
                  Track #{currentChapter.chapterNumber}
                </span>

                <button
                  type="button"
                  disabled={selectedChapterIdx === reader.chapters.length - 1}
                  onClick={() => {
                    const nextIdx = selectedChapterIdx + 1;
                    handlePlayChapter(reader.chapters[nextIdx], nextIdx);
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Next Chapter →
                </button>
              </div>
            </div>
          ) : pdfUrl ? (
            <div
              className={cn(
                'rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs h-[800px] relative transition-all',
                readingTheme === 'sepia' && 'reader-mode-sepia',
                readingTheme === 'night' && 'reader-mode-night',
                readingTheme === 'default' && 'bg-white dark:bg-stone-900'
              )}
            >
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                title="Graded Reader PDF"
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 text-stone-500">
              <p className="font-serif text-lg text-stone-800 dark:text-stone-200">Complete Audio Narration</p>
              <p className="text-xs mt-1 text-stone-500">Use the chapter playlist above to immerse yourself in the audiobook narration.</p>
            </div>
          )
        )}

        {/* Story Notes */}
        {activeTab === 'notes' && (
          <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-stone-900 dark:text-stone-100">
                  Book Notebook & Memorable Quotes
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Record unfamiliar vocabulary, write chapter summaries, or collect quotes. Auto-saved locally.
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
              placeholder="Record quotes, chapter reflections, and new words...&#10;&#10;e.g.&#10;Chapter 1: The merchant wanders into the dark forest and discovers the hidden palace...&#10;Words to remember: enchanted, merchant, misfortune, splendid"
              rows={14}
              className="w-full p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FAF8F5] dark:bg-stone-950 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  );
}
