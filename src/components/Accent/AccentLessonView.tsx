'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileText, Play, Pause, BookOpen, Settings } from 'lucide-react';
import type { PodcastEpisode } from '@/types/content';
import type { SectionAlignment } from '@/types/alignment';
import { useAudioStore, useProgressStore, useReadingSettingsStore } from '@/lib/store';
import { resolveMediaUrl, cn } from '@/lib/utils';
import { isSectionAlignment } from '@/lib/alignment';
import { SyncedReadAlong } from '@/components/AudioPlayer/SyncedReadAlong';
import { ReadingSettingsPanel } from '@/components/ui/ReadingSettingsPanel';
import { AlignmentBadge } from '@/components/AudioPlayer/AlignmentBadge';

interface Props {
  lesson: PodcastEpisode;
  transcript: string;
}

export function AccentLessonView({ lesson, transcript }: Props) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();
  const { completedItems, toggleCompleted, savedNotes, addSavedNote, removeSavedNote } = useProgressStore();
  const {
    fontSize, lineHeight, theme, marginWidth,
    setFontSize, setLineHeight, setTheme, setMarginWidth,
  } = useReadingSettingsStore();
  const [noteText, setNoteText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [alignment, setAlignment] = useState<SectionAlignment | null>(null);
  const isCurrent = currentTrack?.id === lesson.id;
  const isCompleted = completedItems[lesson.id] || false;
  const videoUrl = lesson.videoPath ? resolveMediaUrl(lesson.videoPath) : '';
  const pdfUrl = lesson.pdfPath ? resolveMediaUrl(lesson.pdfPath) : '';
  const lessonNotes = savedNotes.filter((note) => note.sourceUrl === `/accent/${lesson.id}`);

  useEffect(() => {
    let mounted = true;
    const unitNumber = lesson.number > 0 ? String(lesson.number).padStart(2, '0') : '00';
    const candidates = [
      `/data/alignments/accent/${lesson.id}.json`,
      `/data/alignments/accent/unit-${unitNumber}.json`,
    ];

    const loadAlignment = async () => {
      for (const url of candidates) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;
          const data = await response.json();
          if (mounted && isSectionAlignment(data)) {
            setAlignment(data);
            return;
          }
        } catch {
          // Alignment is progressive; the transcript remains available without it.
        }
      }
      if (mounted) setAlignment(null);
    };

    void loadAlignment();
    return () => {
      mounted = false;
    };
  }, [lesson.id, lesson.number]);

  const handlePlay = () => {
    if (isCurrent) {
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
      itemUrl: `/accent/${lesson.id}`,
    });
  };

  return (
    <>
      <header className="rounded-3xl border border-amber-500/30 bg-linear-to-br from-amber-500/15 via-stone-100 to-transparent p-6 dark:via-stone-900/70 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">
              {lesson.number === 0 ? 'Course introduction' : `Unit ${lesson.number}`}
            </span>
            <h1 className="mt-2 font-serif text-4xl text-stone-950 dark:text-stone-50">{lesson.title}</h1>
            <AlignmentBadge sources={[
              `/data/alignments/accent/${lesson.id}.json`,
              `/data/alignments/accent/unit-${String(lesson.number).padStart(2, '0')}.json`,
            ]} className="mt-3" />
            <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
              Listen carefully, watch the mouth movements, then practice with the transcript.
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleCompleted(lesson.id)}
            className={cn('inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold', isCompleted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-white/70 text-stone-700 dark:bg-stone-800 dark:text-stone-200')}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isCompleted ? 'Practiced' : 'Mark practiced'}
          </button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-elevated rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">Step 1 · Listen</p>
              <h2 className="mt-1 font-serif text-2xl">Training audio</h2>
            </div>
            <button type="button" onClick={handlePlay} className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white dark:bg-stone-100 dark:text-stone-900">
              {isCurrent && isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
              {isCurrent && isPlaying ? 'Pause' : 'Play audio'}
            </button>
          </div>
          <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">Repeat this track several times. Use the global player to keep listening while you read.</p>
        </div>

        <div className="surface-elevated rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">Step 2 · Watch</p>
          <h2 className="mt-1 font-serif text-2xl">Video lesson</h2>
          {videoUrl ? <video controls preload="metadata" src={videoUrl} className="mt-4 aspect-video w-full rounded-xl bg-black" /> : <p className="mt-4 rounded-xl bg-stone-100 p-4 text-sm text-stone-500 dark:bg-stone-800 dark:text-stone-400">Video is not available for this unit yet.</p>}
        </div>
      </section>

      <section className="surface-elevated rounded-2xl p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">Step 3 · Read aloud</p>
            <h2 className="mt-1 font-serif text-2xl">Unit transcript</h2>
          </div>
          <div className="relative flex items-center gap-2">
            <button type="button" onClick={() => setShowSettings((open) => !open)} className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.05)]">
              <Settings className="h-4 w-4" /> Display
            </button>
            {showSettings && (
              <>
                <button type="button" aria-label="Close display settings" className="fixed inset-0 z-40 cursor-default" onClick={() => setShowSettings(false)} />
                <ReadingSettingsPanel
                  className="absolute right-0 top-12 z-50"
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  theme={theme}
                  marginWidth={marginWidth}
                  onFontSizeChange={setFontSize}
                  onLineHeightChange={setLineHeight}
                  onThemeChange={setTheme}
                  onMarginWidthChange={setMarginWidth}
                />
              </>
            )}
            {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-bold dark:border-stone-700"><FileText className="h-4 w-4" /> Open PDF guide</a>}
          </div>
        </div>
        <div className={cn(
          'mt-5 rounded-xl border p-5 transition-colors',
          theme === 'default' && 'border-stone-200 bg-[#FAF7F0] text-[#22252C]',
          theme === 'sepia' && 'border-[#E3D6BC] bg-[#F4E9D5] text-[#433422]',
          theme === 'ocean' && 'border-[#112240] bg-[#F0F4F8] text-[#0A192F] dark:bg-[#0A192F] dark:text-[#E6F1FF]',
          theme === 'night' && 'border-[#2B2F3D] bg-[#161821] text-[#E8E4DC]'
        )}>
          {transcript ? (
            <SyncedReadAlong
              alignment={alignment}
              fallbackText={transcript}
              trackId={lesson.id}
              fontSize={fontSize}
              lineHeight={lineHeight}
              readingTheme={theme}
              className={cn(
                'max-h-[34rem] overflow-y-auto',
                marginWidth === 'narrow' ? 'max-w-2xl' : marginWidth === 'wide' ? 'max-w-5xl' : 'max-w-4xl'
              )}
            />
          ) : (
            <p className="font-serif text-base leading-8">Transcript is not available for this unit yet.</p>
          )}
        </div>
      </section>

      <section className="surface-elevated rounded-2xl p-5 sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">Step 4 · Notice</p>
        <h2 className="mt-1 font-serif text-2xl">Words & notes</h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Capture one pronunciation observation or practice sentence to revisit later.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="What did you notice?" className="min-h-20 flex-1 rounded-xl border border-stone-200 bg-transparent p-3 text-sm outline-none focus:border-amber-500 dark:border-stone-700" />
          <button
            type="button"
            disabled={!noteText.trim()}
            onClick={() => {
              addSavedNote({ note: noteText.trim(), sourceTitle: lesson.title, sourceUrl: `/accent/${lesson.id}` });
              setNoteText('');
            }}
            className="self-end rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:self-start"
          >
            Save note
          </button>
        </div>
        {lessonNotes.length > 0 && (
          <div className="mt-5 space-y-2">
            {lessonNotes.map((note) => (
              <div key={note.id} className="flex items-start justify-between gap-3 rounded-xl bg-stone-50 p-3 text-sm dark:bg-stone-900/70">
                <p className="whitespace-pre-wrap">{note.note}</p>
                <button type="button" onClick={() => removeSavedNote(note.id)} className="shrink-0 text-xs font-semibold text-stone-500 hover:text-red-600">Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between border-t border-stone-200 pt-5 text-sm dark:border-stone-800">
        <Link href="/accent" className="font-semibold text-stone-600 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-400"><BookOpen className="mr-1 inline h-4 w-4" /> All units</Link>
        <span className="text-stone-500 dark:text-stone-400">Listen → Watch → Read aloud</span>
      </div>
    </>
  );
}
