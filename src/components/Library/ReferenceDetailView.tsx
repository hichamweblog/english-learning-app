'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  CheckCircle2,
  FileText,
  ExternalLink,
  BookOpen,
  Copy,
  Download,
  Check,
  Search,
  BookMarked,
  HelpCircle,
  MessageSquareQuote,
  Sparkles,
  ListOrdered,
  Play,
  Pause,
  Headphones,
} from 'lucide-react';
import type { ReferenceBook } from '@/types/content';
import { useProgressStore, useAudioStore } from '@/lib/store';
import { resolveMediaUrl, formatBytes, cn } from '@/lib/utils';

interface Props {
  book: ReferenceBook;
}

export function ReferenceDetailView({ book }: Props) {
  const { completedItems, toggleCompleted, addRecentItem } = useProgressStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();

  const isCompleted = completedItems[book.id] || false;
  const pdfUrl = resolveMediaUrl(book.pdfPath);

  const handlePlayItemAudio = (title: string, audioPath: string, itemId: string) => {
    const trackId = `ref-${book.id}-${itemId}`;
    if (currentTrack?.id === trackId) {
      togglePlay();
      return;
    }
    playTrack({
      id: trackId,
      title: `${book.title} — ${title}`,
      seriesTitle: `Reference Folio (${book.category})`,
      audioPath,
      pdfPath: book.pdfPath,
      itemUrl: `/library/${book.id}`,
    });
  };

  // Determine items list (chapters, lessons, or entries)
  const itemsType: 'chapters' | 'lessons' | 'entries' | 'none' = useMemo(() => {
    if (book.chapters && book.chapters.length > 0) return 'chapters';
    if (book.lessons && book.lessons.length > 0) return 'lessons';
    if (book.entries && book.entries.length > 0) return 'entries';
    return 'none';
  }, [book]);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'interactive' | 'pdf'>(
    book.hasExtractedContent ? 'interactive' : 'pdf'
  );
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [readingTheme, setReadingTheme] = useState<'default' | 'sepia' | 'night'>('default');
  const [noteText, setNoteText] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'reader' | 'notes'>('reader');
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(`notes_${book.id}`);
    if (saved) setNoteText(saved);

    addRecentItem({
      id: book.id,
      type: 'reference',
      title: book.title,
      seriesTitle: `Reference (${book.category})`,
      url: `/library/${book.id}`,
    });
  }, [book, addRecentItem]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    localStorage.setItem(`notes_${book.id}`, text);
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
    a.download = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}_notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered items list
  const filteredChapters = useMemo(() => {
    if (!book.chapters) return [];
    if (!itemSearchQuery.trim()) return book.chapters;
    const q = itemSearchQuery.toLowerCase().trim();
    return book.chapters.filter((c) => c.title.toLowerCase().includes(q));
  }, [book.chapters, itemSearchQuery]);

  const filteredLessons = useMemo(() => {
    if (!book.lessons) return [];
    if (!itemSearchQuery.trim()) return book.lessons;
    const q = itemSearchQuery.toLowerCase().trim();
    return book.lessons.filter((l) => l.title.toLowerCase().includes(q));
  }, [book.lessons, itemSearchQuery]);

  const filteredEntries = useMemo(() => {
    if (!book.entries) return [];
    if (!itemSearchQuery.trim()) return book.entries;
    const q = itemSearchQuery.toLowerCase().trim();
    return book.entries.filter(
      (e) => e.title.toLowerCase().includes(q) || (e.words && e.words.some((w) => w.toLowerCase().includes(q)))
    );
  }, [book.entries, itemSearchQuery]);

  const currentChapter = book.chapters ? book.chapters[selectedIdx] : undefined;
  const currentLesson = book.lessons ? book.lessons[selectedIdx] : undefined;
  const currentEntry = book.entries ? book.entries[selectedIdx] : undefined;

  const totalCount =
    book.totalChapters ||
    book.totalLessons ||
    book.totalEntries ||
    (book.chapters ? book.chapters.length : 0) ||
    (book.lessons ? book.lessons.length : 0) ||
    (book.entries ? book.entries.length : 0);

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/library"
          className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1 font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Reference Folios</span>
        </Link>
      </div>

      {/* Book Header Masthead */}
      <div className="p-6 sm:p-8 rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#14161C] shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              {book.category}
            </span>
            {book.author && (
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                by {book.author}
              </span>
            )}
            {book.publisher && (
              <span className="text-xs text-stone-400">
                • {book.publisher}
              </span>
            )}
            {book.hasExtractedContent && (
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Interactive Folio ({totalCount} {itemsType})
              </span>
            )}
            <span className="text-xs text-stone-400 font-mono">
              {formatBytes(book.sizeBytes)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleCompleted(book.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border',
              isCompleted
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                : 'text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Folio Completed' : 'Mark as Read'}</span>
          </button>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-stone-900 dark:text-stone-50">
          {book.title}
        </h1>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          {book.hasExtractedContent && (
            <button
              type="button"
              onClick={() => {
                setViewMode('interactive');
                setActiveTab('reader');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-sm shadow-md hover:scale-102 active:scale-98 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Interactive Folio</span>
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
              <span>Open Original PDF</span>
            </a>
          )}
        </div>
      </div>

      {/* Units / Chapters / Lessons Navigation Grid */}
      {book.hasExtractedContent && itemsType !== 'none' && (
        <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              Contents & Units ({totalCount})
            </h2>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search unit titles..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {itemsType === 'chapters' &&
              filteredChapters.map((ch, idx) => {
                const originalIdx = book.chapters?.indexOf(ch) ?? idx;
                const isSelected = selectedIdx === originalIdx;
                return (
                  <button
                    key={ch.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedIdx(originalIdx);
                      setViewMode('interactive');
                    }}
                    className={cn(
                      'p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all',
                      isSelected
                        ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 ring-1 ring-amber-500/20'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/60 dark:bg-stone-900/50'
                    )}
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] text-stone-400 font-mono block">
                        Chapter #{ch.chapterNumber || originalIdx + 1}
                      </span>
                      <h4 className="font-serif text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                        {ch.title}
                      </h4>
                    </div>
                    {ch.hasAudio && (
                      <Headphones className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}

            {itemsType === 'lessons' &&
              filteredLessons.map((l, idx) => {
                const originalIdx = book.lessons?.indexOf(l) ?? idx;
                const isSelected = selectedIdx === originalIdx;
                return (
                  <button
                    key={l.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedIdx(originalIdx);
                      setViewMode('interactive');
                    }}
                    className={cn(
                      'p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all',
                      isSelected
                        ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 ring-1 ring-amber-500/20'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/60 dark:bg-stone-900/50'
                    )}
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] text-stone-400 font-mono block">
                        Lesson #{l.lessonNumber || originalIdx + 1}
                      </span>
                      <h4 className="font-serif text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                        {l.title}
                      </h4>
                    </div>
                    {l.hasAudio && (
                      <Headphones className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}

            {itemsType === 'entries' &&
              filteredEntries.map((e, idx) => {
                const originalIdx = book.entries?.indexOf(e) ?? idx;
                const isSelected = selectedIdx === originalIdx;
                return (
                  <button
                    key={e.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedIdx(originalIdx);
                      setViewMode('interactive');
                    }}
                    className={cn(
                      'p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all',
                      isSelected
                        ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 ring-1 ring-amber-500/20'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/60 dark:bg-stone-900/50'
                    )}
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] text-stone-400 font-mono block">
                        Entry #{e.entryNumber || originalIdx + 1}
                      </span>
                      <h4 className="font-serif text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                        {e.title}
                      </h4>
                    </div>
                    {e.hasAudio && (
                      <Headphones className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Workspace Tabs: Folio Reader vs Study Notebook */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('reader')}
              className={cn(
                'px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2',
                activeTab === 'reader'
                  ? 'border-amber-800 text-amber-900 dark:text-amber-400 dark:border-amber-500'
                  : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span>Folio Reader</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={cn(
                'px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2',
                activeTab === 'notes'
                  ? 'border-amber-800 text-amber-900 dark:text-amber-400 dark:border-amber-500'
                  : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              )}
            >
              <BookMarked className="w-4 h-4" />
              <span>Study Notes</span>
              {noteText.trim() && (
                <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
              )}
            </button>
          </div>

          {activeTab === 'reader' && (
            <div className="flex items-center gap-3">
              {book.hasExtractedContent && pdfUrl && (
                <div className="flex items-center bg-stone-100 dark:bg-stone-900 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('interactive')}
                    className={cn(
                      'px-2.5 py-1 rounded-md transition-all',
                      viewMode === 'interactive'
                        ? 'bg-white dark:bg-stone-800 text-amber-800 dark:text-amber-400 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    )}
                  >
                    Interactive Folio
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('pdf')}
                    className={cn(
                      'px-2.5 py-1 rounded-md transition-all',
                      viewMode === 'pdf'
                        ? 'bg-white dark:bg-stone-800 text-amber-800 dark:text-amber-400 shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    )}
                  >
                    Original PDF
                  </button>
                </div>
              )}

              {viewMode === 'interactive' && book.hasExtractedContent && (
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
          book.hasExtractedContent && viewMode === 'interactive' ? (
            <div
              className={cn(
                'p-6 sm:p-10 rounded-2xl border transition-all space-y-8',
                readingTheme === 'default' && 'bg-white dark:bg-[#14161C] border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100',
                readingTheme === 'sepia' && 'bg-[#FAF6EE] text-[#433422] border-amber-200',
                readingTheme === 'night' && 'bg-[#181A20] text-stone-200 border-stone-800'
              )}
            >
              {/* Chapters Content */}
              {itemsType === 'chapters' && currentChapter && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/60 dark:border-stone-800 pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Chapter {currentChapter.chapterNumber || selectedIdx + 1} of {book.chapters?.length}
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1">
                        {currentChapter.title}
                      </h2>
                    </div>

                    {currentChapter.hasAudio && currentChapter.audioPath && (
                      <button
                        type="button"
                        onClick={() =>
                          handlePlayItemAudio(
                            currentChapter.title,
                            currentChapter.audioPath!,
                            `ch-${currentChapter.chapterNumber || selectedIdx + 1}`
                          )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs shadow-xs hover:scale-102 active:scale-98 transition-all"
                      >
                        {currentTrack?.id === `ref-${book.id}-ch-${currentChapter.chapterNumber || selectedIdx + 1}` && isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pause Audio</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            <span>Listen to Audio</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Opening Conversation / Dialogue Turns */}
                  {currentChapter.openingConversation?.turns && currentChapter.openingConversation.turns.length > 0 && (
                    <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                        <MessageSquareQuote className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                        Opening Conversation
                      </div>
                      <div className="space-y-3">
                        {currentChapter.openingConversation.turns.map((turn: any, i: number) => (
                          <div key={i} className="flex gap-3">
                            <span className="font-sans font-bold text-xs uppercase tracking-wide text-amber-800 dark:text-amber-400 w-20 shrink-0">
                              {turn.speaker}
                            </span>
                            <span className="font-serif text-sm leading-relaxed">
                              {turn.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Story Text / Narrative */}
                  {currentChapter.storyText && (
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
                  )}

                  {/* Raw / General Content */}
                  {currentChapter.content && !currentChapter.storyText && (
                    <div
                      className={cn(
                        'font-serif leading-relaxed whitespace-pre-line',
                        fontSize === 'sm' && 'text-sm sm:text-base leading-7',
                        fontSize === 'base' && 'text-base sm:text-lg leading-8',
                        fontSize === 'lg' && 'text-lg sm:text-xl leading-9',
                        fontSize === 'xl' && 'text-xl sm:text-2xl leading-10'
                      )}
                    >
                      {currentChapter.content}
                    </div>
                  )}

                  {/* Exercises */}
                  {currentChapter.exercises && (
                    <div className="mt-8 p-6 rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-4">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                        <h3 className="font-serif text-lg font-semibold text-amber-950 dark:text-amber-200">
                          Exercises & Practice
                        </h3>
                      </div>
                      <div className="font-sans text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed">
                        {currentChapter.exercises}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lessons Content (e.g. 1000 Collocations) */}
              {itemsType === 'lessons' && currentLesson && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/60 dark:border-stone-800 pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Lesson {currentLesson.lessonNumber || selectedIdx + 1} of {book.lessons?.length}
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1">
                        {currentLesson.title}
                      </h2>
                    </div>

                    {currentLesson.hasAudio && currentLesson.audioPath && (
                      <button
                        type="button"
                        onClick={() =>
                          handlePlayItemAudio(
                            currentLesson.title,
                            currentLesson.audioPath!,
                            `lesson-${currentLesson.lessonNumber || selectedIdx + 1}`
                          )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs shadow-xs hover:scale-102 active:scale-98 transition-all"
                      >
                        {currentTrack?.id === `ref-${book.id}-lesson-${currentLesson.lessonNumber || selectedIdx + 1}` && isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pause Lesson Audio</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            <span>Play Lesson Audio</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div
                    className={cn(
                      'font-serif leading-relaxed whitespace-pre-line',
                      fontSize === 'sm' && 'text-sm sm:text-base leading-7',
                      fontSize === 'base' && 'text-base sm:text-lg leading-8',
                      fontSize === 'lg' && 'text-lg sm:text-xl leading-9',
                      fontSize === 'xl' && 'text-xl sm:text-2xl leading-10'
                    )}
                  >
                    {currentLesson.content}
                  </div>
                </div>
              )}

              {/* Entries Content (e.g. 600 Confusing Words) */}
              {itemsType === 'entries' && currentEntry && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/60 dark:border-stone-800 pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Entry {currentEntry.entryNumber || selectedIdx + 1} of {book.entries?.length}
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-normal mt-1">
                        {currentEntry.title}
                      </h2>
                    </div>

                    {currentEntry.hasAudio && currentEntry.audioPath && (
                      <button
                        type="button"
                        onClick={() =>
                          handlePlayItemAudio(
                            currentEntry.title,
                            currentEntry.audioPath!,
                            `entry-${currentEntry.entryNumber || selectedIdx + 1}`
                          )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs shadow-xs hover:scale-102 active:scale-98 transition-all"
                      >
                        {currentTrack?.id === `ref-${book.id}-entry-${currentEntry.entryNumber || selectedIdx + 1}` && isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pause Audio</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            <span>Listen to Audio</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div
                    className={cn(
                      'font-serif leading-relaxed whitespace-pre-line',
                      fontSize === 'sm' && 'text-sm sm:text-base leading-7',
                      fontSize === 'base' && 'text-base sm:text-lg leading-8',
                      fontSize === 'lg' && 'text-lg sm:text-xl leading-9',
                      fontSize === 'xl' && 'text-xl sm:text-2xl leading-10'
                    )}
                  >
                    {currentEntry.explanation}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* PDF Embed View */
            <div className="w-full h-[85vh] rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 shadow-2xs">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title={book.title}
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-stone-500">
                  <FileText className="w-12 h-12 stroke-[1.5] text-stone-400 mb-3" />
                  <p className="font-serif text-base text-stone-800 dark:text-stone-200">
                    PDF document file could not be loaded.
                  </p>
                </div>
              )}
            </div>
          )
        )}

        {/* Study Notes Tab */}
        {activeTab === 'notes' && (
          <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
                  Folio Study Notes
                </h3>
                <p className="text-xs text-stone-500">
                  Your notes are saved locally and auto-persisted.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyNotes}
                  disabled={!noteText.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-40"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={downloadNotes}
                  disabled={!noteText.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            <textarea
              rows={16}
              value={noteText}
              onChange={handleNotesChange}
              placeholder="Record grammatical rules, idioms, collocations, or reflections from this reference folio..."
              className="w-full p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-100 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
