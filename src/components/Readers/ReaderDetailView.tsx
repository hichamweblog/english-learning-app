'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Settings,
  List,
} from 'lucide-react';
import type { GradedReaderBook, GradedReaderChapter } from '@/types/content';
import type { SectionAlignment } from '@/types/alignment';
import { SyncedReadAlong } from '@/components/AudioPlayer/SyncedReadAlong';
import { useAudioStore, useProgressStore, useReadingSettingsStore } from '@/lib/store';
import { ReadingSettingsPanel } from '@/components/ui/ReadingSettingsPanel';
import { resolveMediaUrl, cn } from '@/lib/utils';
import { isSectionAlignment } from '@/lib/alignment';
import { AlignmentBadge } from '@/components/AudioPlayer/AlignmentBadge';

interface Props {
  reader: GradedReaderBook;
}

export function ReaderDetailView({ reader }: Props) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();
  const { completedItems, toggleCompleted, addRecentItem, addSavedNote } = useProgressStore();

  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'interactive' | 'pdf'>('interactive');
  
  // Global Reading Settings
  const { 
    fontSize, lineHeight, theme, marginWidth,
    setFontSize, setLineHeight, setTheme, setMarginWidth
  } = useReadingSettingsStore();
  
  const [showSettings, setShowSettings] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [activeTab, setActiveTab] = useState<'reader' | 'notes'>('reader');
  const [alignment, setAlignment] = useState<SectionAlignment | null>(null);

  const isCompleted = completedItems[reader.id] || false;
  const pdfUrl = resolveMediaUrl(reader.pdfPath);

  const currentChapter = reader.chapters[selectedChapterIdx] || reader.chapters[0];
  const hasExtractedText = !!(currentChapter && currentChapter.storyText && currentChapter.storyText.length > 50);

  useEffect(() => {
    if (!reader || !currentChapter) return;
    const url = `/data/alignments/readers/${reader.id}/ch-${currentChapter.chapterNumber}.json`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setAlignment(isSectionAlignment(data) ? data : null);
      })
      .catch(() => setAlignment(null));
  }, [reader.id, currentChapter?.chapterNumber]);

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

  const saveReaderNote = () => {
    const note = noteText.trim();
    if (!note) return;
    addSavedNote({
      note,
      sourceTitle: reader.title,
      sourceUrl: `/readers/${reader.id}`,
    });
  };

  const handlePlayChapter = (chapter: GradedReaderChapter, index: number) => {
    setSelectedChapterIdx(index);
    addRecentItem({
      id: reader.id,
      type: 'reader',
      title: reader.title,
      seriesTitle: `Reader (${reader.levelLabel})`,
      url: `/readers/${reader.id}`,
      progressPercent: Math.round(((index + 1) / Math.max(1, reader.chapters.length)) * 100),
    });
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
    <div className="space-y-8 pb-32 max-w-[1600px] mx-auto w-full px-4 lg:px-8">
      {/* Reading room header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[hsl(var(--border))] pb-5">
        <Link
          href="/readers"
          className="flex w-fit items-center gap-1 text-sm font-semibold text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>{reader.title}</span>
        </Link>
        <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="font-semibold">Chapter {currentChapter.chapterNumber}</span>
          <span className="hidden sm:inline">· {currentChapter.title}</span>
          <AlignmentBadge sources={[`/data/alignments/readers/${reader.id}/ch-${currentChapter.chapterNumber}.json`]} />
          <button
            type="button"
            onClick={() => setShowSettings((open) => !open)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] px-3 py-1.5 font-semibold transition-colors hover:bg-[hsl(var(--foreground)/0.04)] hover:text-[hsl(var(--foreground))]"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Aa</span>
          </button>
        </div>
      </div>

      {/* TOP ROW: Book Meta (Left) & Contents (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Book Meta Card */}
        <div className="surface-card flex flex-col justify-between rounded-3xl border border-[hsl(var(--border))] p-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-sans font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[hsl(var(--reader-green)/0.15)] text-[hsl(var(--reader-green))]">
                {reader.levelLabel}
              </span>
              <span className="text-sm font-mono text-[hsl(var(--muted-foreground))]">
                {reader.seriesCode}
              </span>
            </div>
            <h1 className="font-serif text-3xl font-medium leading-snug tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
              {reader.title}
            </h1>
            <p className="max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Read at your pace with chapter audio, a calm space for notes, and optional text guidance when alignment is available.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <button
              type="button"
              onClick={() => handlePlayChapter(currentChapter, selectedChapterIdx)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))] font-semibold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {currentTrack?.id === `${reader.id}-ch-${currentChapter.chapterNumber}` && isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Reading</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Play Chapter {currentChapter.chapterNumber}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => toggleCompleted(reader.id)}
              aria-label={isCompleted ? `Mark ${reader.title} as unfinished` : `Mark ${reader.title} as finished`}
              className={cn(
                'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors border',
                isCompleted
                  ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.3)]'
                  : 'text-[hsl(var(--foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--foreground)/0.04)]'
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isCompleted ? 'Finished' : 'Mark Finished'}</span>
            </button>
            
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.04)] font-bold text-sm transition-colors border border-[hsl(var(--border))]"
              >
                <ExternalLink className="w-5 h-5" />
                <span>PDF</span>
              </a>
            )}
          </div>
        </div>

        {/* Contents (Fihris) Card */}
        <div className="surface-card rounded-3xl border border-[hsl(var(--border))] overflow-hidden flex flex-col max-h-[350px]">
          <div className="p-6 bg-[hsl(var(--foreground)/0.02)] border-b border-[hsl(var(--border))] flex items-center gap-3 text-[hsl(var(--foreground))] shrink-0">
            <List className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            <h3 className="text-xl font-serif font-medium">Contents (فهرس)</h3>
          </div>
          
          <div className="p-3 space-y-1 overflow-y-auto">
            {reader.chapters.map((chapter, idx) => {
              const isSelected = selectedChapterIdx === idx;
              const isChapterPlaying = currentTrack?.id === `${reader.id}-ch-${chapter.chapterNumber}` && isPlaying;

              return (
                <button
                  key={chapter.chapterNumber}
                  onClick={() => {
                    setSelectedChapterIdx(idx);
                    if (viewMode !== 'interactive') setViewMode('interactive');
                    setActiveTab('reader');
                  }}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left group',
                    isSelected
                      ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-md'
                      : 'hover:bg-[hsl(var(--foreground)/0.04)] text-[hsl(var(--foreground))]'
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                    <span className={cn(
                      'text-sm font-mono font-medium opacity-60 w-6 shrink-0',
                      isSelected && 'opacity-90'
                    )}>
                      {chapter.chapterNumber}
                    </span>
                    <span className={cn(
                      'font-medium text-base truncate',
                      isSelected ? 'font-bold' : ''
                    )}>
                      {chapter.title}
                    </span>
                  </div>
                  
                  {isSelected ? (
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--background)/0.2)] flex items-center justify-center shrink-0">
                      {isChapterPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--muted-foreground))]">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FULL WIDTH BOTTOM: Main Reading Area */}
      <div className="w-full space-y-6 pt-4">
        <div className="flex border-b border-[hsl(var(--border))]">
          <button
            type="button"
            onClick={() => setActiveTab('reader')}
            aria-pressed={activeTab === 'reader'}
            className={cn(
              'px-5 py-4 text-sm font-bold border-b-[3px] transition-colors sm:px-8',
              activeTab === 'reader'
                ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            Reading Room
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            aria-pressed={activeTab === 'notes'}
            className={cn(
              'flex items-center gap-2 border-b-[3px] px-5 py-4 text-sm font-bold transition-colors sm:px-8',
              activeTab === 'notes'
                ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            <Edit3 className="w-4 h-4" />
            Study Notes
          </button>
        </div>

        {activeTab === 'reader' ? (
          <div className={cn(
            "rounded-3xl min-h-[800px] transition-colors duration-500 relative",
            theme === 'default' && 'surface-card text-[hsl(var(--foreground))] border border-[hsl(var(--border))]',
            theme === 'sepia' && 'bg-[#F4E9D5] text-[#433422] border border-[#E3D6BC]',
            theme === 'ocean' && 'bg-[#F0F4F8] dark:bg-[#0A192F] text-[#0A192F] dark:text-[#E6F1FF] border border-[#112240]',
            theme === 'night' && 'bg-[#161821] text-[#E8E4DC] border border-[#2B2F3D]'
          )}>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 sm:px-8 border-b border-black/10 dark:border-white/10 sticky top-0 z-20 bg-inherit rounded-t-3xl backdrop-blur-sm bg-opacity-95">
              <div className="font-serif font-medium opacity-80 text-lg flex items-center gap-3">
                <span className="text-[hsl(var(--muted-foreground))] text-sm font-mono">{currentChapter.chapterNumber}</span>
                {currentChapter.title}
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-70 hover:opacity-100 flex items-center gap-2 font-bold text-sm"
                >
                  <Settings className="w-5 h-5" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
                
                {showSettings && (
                  <div className="absolute right-0 top-14 z-50">
                    <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                    <div className="relative z-50">
                      <ReadingSettingsPanel 
                        fontSize={fontSize}
                        lineHeight={lineHeight}
                        theme={theme}
                        marginWidth={marginWidth}
                        onFontSizeChange={setFontSize}
                        onLineHeightChange={setLineHeight}
                        onThemeChange={setTheme}
                        onMarginWidthChange={setMarginWidth}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Text Content */}
            <div className={cn(
              "p-6 sm:p-16 mx-auto transition-all",
              marginWidth === 'narrow' ? 'max-w-2xl' : marginWidth === 'wide' ? 'max-w-4xl' : 'max-w-3xl'
            )}>
              {hasExtractedText ? (
                <>
                  <SyncedReadAlong
                    alignment={alignment}
                    fallbackText={currentChapter.storyText}
                    trackId={`${reader.id}-ch-${currentChapter.chapterNumber}`}
                    fontSize={fontSize}
                    lineHeight={lineHeight}
                    readingTheme={theme}
                  />

                  {/* Activities & Exercises Card */}
                  {currentChapter.hasActivities && currentChapter.activitiesText && (
                    <div className="mt-24 p-8 rounded-3xl surface-inset border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-6">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                        <h3 className="text-lg font-bold uppercase tracking-widest text-amber-900 dark:text-amber-500">
                          End of Chapter Activities
                        </h3>
                      </div>
                      <div
                        className="font-sans text-base sm:text-lg leading-relaxed whitespace-pre-line text-amber-950 dark:text-amber-200 font-medium"
                      >
                        {currentChapter.activitiesText}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-32 text-[hsl(var(--muted-foreground))] space-y-6">
                  <p className="font-serif text-2xl">Interactive text not available.</p>
                  <button
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="px-6 py-3 rounded-xl bg-[hsl(var(--foreground)/0.06)] font-bold text-lg hover:bg-[hsl(var(--foreground)/0.1)] transition-colors"
                  >
                    Open Original PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Notes Tab
          <div className="space-y-4">
            <textarea
              value={noteText}
              onChange={handleNotesChange}
              placeholder="Write your study notes, vocabulary, or reflections here... They save automatically."
              className="w-full h-[600px] p-8 rounded-3xl border border-[hsl(var(--border))] bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-sans text-lg font-medium leading-relaxed"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={saveReaderNote}
                disabled={!noteText.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-base font-bold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save to Words & Notes
              </button>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(noteText)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[hsl(var(--border))] text-base font-bold hover:bg-[hsl(var(--foreground)/0.04)]"
              >
                <Copy className="w-5 h-5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
