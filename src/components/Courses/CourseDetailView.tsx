'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Edit3,
  Copy,
  Download,
  Check,
  BookOpen,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Search,
  MessageSquare,
  File,
  Type,
  Headphones,
  Video,
  Volume2,
  BookMarked,
  Award,
  Settings
} from 'lucide-react';
import type {
  Course,
  CourseLesson,
  CourseLessonDialogueTurn,
  CourseLessonVocabItem,
  CourseLessonPhraseItem,
  CourseLessonQuizQuestion
} from '@/types/content';
import type { SectionAlignment } from '@/types/alignment';
import { SyncedReadAlong } from '@/components/AudioPlayer/SyncedReadAlong';
import { useProgressStore, useAudioStore, useReadingSettingsStore } from '@/lib/store';
import { ReadingSettingsPanel } from '@/components/ui/ReadingSettingsPanel';
import { resolveMediaUrl, cn } from '@/lib/utils';
import { isSectionAlignment } from '@/lib/alignment';
import { AlignmentBadge } from '@/components/AudioPlayer/AlignmentBadge';

interface Props {
  course: Course;
}

export function CourseDetailView({ course }: Props) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();
  
  const { addSavedNote, completedItems, setCompleted } = useProgressStore();
  const { 
    fontSize, lineHeight, theme, marginWidth,
    setFontSize, setLineHeight, setTheme, setMarginWidth
  } = useReadingSettingsStore();
  const [showSettings, setShowSettings] = useState(false);

  const [activeLessonNumber, setActiveLessonNumber] = useState<number>(
    course.lessons.length > 0 ? course.lessons[0].lessonNumber : 1
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [completedLessons, setCompletedLessons] = useState<Record<number, boolean>>({});
  const [lessonNotes, setLessonNotes] = useState<Record<number, string>>({});
  const [writingSubmissions, setWritingSubmissions] = useState<Record<number, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'dialogue' | 'transcript' | 'vocab' | 'phrases' | 'quiz' | 'writing' | 'pdf'>('transcript');

  // Interactive Quiz State per lesson
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});
  const [quizScores, setQuizScores] = useState<Record<number, { score: number; total: number; percentage: number }>>({});

  // Dynamic Word Alignment State
  const [lessonAlignment, setLessonAlignment] = useState<SectionAlignment | null>(null);

  // Fetch alignment JSON if available for active lesson
  useEffect(() => {
    let isMounted = true;
    const fetchAlignment = async () => {
      try {
        const res = await fetch(`/data/alignments/courses/${course.id}/lesson-${activeLessonNumber}.json`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setLessonAlignment(isSectionAlignment(data) ? data : null);
        } else {
          if (isMounted) setLessonAlignment(null);
        }
      } catch {
        if (isMounted) setLessonAlignment(null);
      }
    };
    fetchAlignment();
    return () => {
      isMounted = false;
    };
  }, [course.id, activeLessonNumber]);

  // Sync completion, notes, and quiz state with localStorage
  useEffect(() => {
    try {
      const savedCompleted = localStorage.getItem(`course_completed_${course.id}`);
      if (savedCompleted) setCompletedLessons(JSON.parse(savedCompleted));

      const savedNotes = localStorage.getItem(`course_notes_${course.id}`);
      if (savedNotes) setLessonNotes(JSON.parse(savedNotes));

      const savedWriting = localStorage.getItem(`course_writing_${course.id}`);
      if (savedWriting) setWritingSubmissions(JSON.parse(savedWriting));

      const savedScores = localStorage.getItem(`course_quiz_scores_${course.id}`);
      if (savedScores) setQuizScores(JSON.parse(savedScores));
    } catch {
      // ignore storage error
    }
  }, [course.id]);

  useEffect(() => {
    const fromProgress = course.lessons.reduce<Record<number, boolean>>((acc, lesson) => {
      if (completedItems[`course-${course.id}-lesson-${lesson.lessonNumber}`]) {
        acc[lesson.lessonNumber] = true;
      }
      return acc;
    }, {});
    if (Object.keys(fromProgress).length > 0) {
      setCompletedLessons((current) => ({ ...fromProgress, ...current }));
    }
  }, [completedItems, course.id, course.lessons]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleLessonComplete = (num: number) => {
    const next = { ...completedLessons, [num]: !completedLessons[num] };
    setCompletedLessons(next);
    setCompleted(`course-${course.id}-lesson-${num}`, next[num]);
    try {
      localStorage.setItem(`course_completed_${course.id}`, JSON.stringify(next));
    } catch {}
    showToast(next[num] ? 'Lesson marked as completed! 🎉' : 'Lesson marked as pending');
  };

  const handleNoteChange = (num: number, text: string) => {
    const next = { ...lessonNotes, [num]: text };
    setLessonNotes(next);
    try {
      localStorage.setItem(`course_notes_${course.id}`, JSON.stringify(next));
    } catch {}
  };

  const handleWritingChange = (num: number, text: string) => {
    const next = { ...writingSubmissions, [num]: text };
    setWritingSubmissions(next);
    try {
      localStorage.setItem(`course_writing_${course.id}`, JSON.stringify(next));
    } catch {}
  };

  const activeLesson: CourseLesson | undefined = useMemo(() => {
    return course.lessons.find((l) => l.lessonNumber === activeLessonNumber) || course.lessons[0];
  }, [course.lessons, activeLessonNumber]);

  // Set default tab when lesson changes
  useEffect(() => {
    if (!activeLesson) return;
    if (activeLesson.fullText) {
      setActiveTab('transcript');
    } else if (activeLesson.dialogue && activeLesson.dialogue.length > 0) {
      setActiveTab('dialogue');
    } else if (activeLesson.vocabulary && activeLesson.vocabulary.length > 0) {
      setActiveTab('vocab');
    } else if (activeLesson.phrases && activeLesson.phrases.length > 0) {
      setActiveTab('phrases');
    } else if (activeLesson.quiz && activeLesson.quiz.questions.length > 0) {
      setActiveTab('quiz');
    } else {
      setActiveTab('transcript');
    }
  }, [activeLessonNumber]);

  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return course.lessons;
    const q = searchQuery.toLowerCase().trim();
    return course.lessons.filter(
      (l) => l.title.toLowerCase().includes(q) || String(l.lessonNumber).includes(q)
    );
  }, [course.lessons, searchQuery]);

  const activeIndex = course.lessons.findIndex((l) => l.lessonNumber === activeLesson?.lessonNumber);
  const prevLesson = activeIndex > 0 ? course.lessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < course.lessons.length - 1 ? course.lessons[activeIndex + 1] : null;

  const totalCompleted = Object.values(completedLessons).filter(Boolean).length;
  const progressPercent = Math.round((totalCompleted / Math.max(1, course.totalLessons)) * 100);

  const handlePlayAudio = (lesson: CourseLesson) => {
    if (!lesson.audioPath) return;
    const trackId = `course-${course.id}-l${lesson.lessonNumber}`;
    if (currentTrack?.id === trackId) {
      togglePlay();
      return;
    }
    playTrack({
      id: trackId,
      title: `${course.title} — Lesson ${lesson.lessonNumber}: ${lesson.title}`,
      seriesTitle: `${course.category} (${course.levelLabel})`,
      audioPath: lesson.audioPath,
      pdfPath: lesson.pdfPath || course.masterPdfPath,
      itemUrl: `/courses/${course.id}`,
    });
  };

  const isCurrentLessonPlaying =
    activeLesson?.audioPath &&
    currentTrack?.id === `course-${course.id}-l${activeLesson.lessonNumber}` &&
    isPlaying;

  // Quiz submission handler
  const handleSelectQuizAnswer = (lessonNum: number, questionId: number, optionKey: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [`${lessonNum}_${questionId}`]: optionKey,
    }));
  };

  const handleCheckQuiz = (lesson: CourseLesson) => {
    if (!lesson.quiz || !lesson.quiz.questions) return;
    const key = `quiz_${course.id}_${lesson.lessonNumber}`;
    setQuizSubmitted((prev) => ({ ...prev, [key]: true }));

    let correctCount = 0;
    lesson.quiz.questions.forEach((q) => {
      const selected = selectedAnswers[`${lesson.lessonNumber}_${q.id}`];
      if (selected && q.correctAnswer && selected.toUpperCase() === q.correctAnswer.toUpperCase()) {
        correctCount++;
      }
    });

    const total = lesson.quiz.questions.length;
    const scoreData = {
      score: correctCount,
      total,
      percentage: Math.round((correctCount / total) * 100),
    };

    const newScores = { ...quizScores, [lesson.lessonNumber]: scoreData };
    setQuizScores(newScores);
    try {
      localStorage.setItem(`course_quiz_scores_${course.id}`, JSON.stringify(newScores));
    } catch {}

    showToast(`Quiz completed: ${scoreData.score}/${scoreData.total} (${scoreData.percentage}%)`);
  };

  const handleResetQuiz = (lesson: CourseLesson) => {
    const key = `quiz_${course.id}_${lesson.lessonNumber}`;
    setQuizSubmitted((prev) => ({ ...prev, [key]: false }));
    const newAnswers = { ...selectedAnswers };
    lesson.quiz?.questions.forEach((q) => {
      delete newAnswers[`${lesson.lessonNumber}_${q.id}`];
    });
    setSelectedAnswers(newAnswers);
  };

  const masterPdfUrl = resolveMediaUrl(course.masterPdfPath);
  const activePdfUrl = resolveMediaUrl(activeLesson?.pdfPath);
  const activeVideoUrl = resolveMediaUrl(activeLesson?.videoPath);

  const lessonQuizSubmitted = activeLesson ? quizSubmitted[`quiz_${course.id}_${activeLesson.lessonNumber}`] : false;
  const currentQuizScore = activeLesson ? quizScores[activeLesson.lessonNumber] : null;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white dark:bg-amber-400 dark:text-stone-950 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 dark:text-stone-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Row Grid: Active Lesson Meta (Left) & Lesson Directory (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Course Header & Active Lesson Workstation Meta */}
        <div className="lg:col-span-8 surface-card p-6 sm:p-8 rounded-3xl border border-[hsl(var(--border))] space-y-6">
          {/* Header & Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[hsl(var(--border))]">
            <div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to All Courses</span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                  {course.category}
                </span>
                <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  {course.levelLabel}
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[hsl(var(--foreground))] mt-1">
                {course.title}
              </h1>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
                By {course.author} · {course.totalLessons} Lessons
              </p>
            </div>

            {/* Action Controls: Master PDF & Progress */}
            <div className="flex flex-wrap items-center gap-3">
              {masterPdfUrl && (
                <a
                  href={masterPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--foreground)/0.04)] transition-all shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                  <span>Full Course Book (PDF)</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )}

              <div className="px-3.5 py-2 rounded-xl border border-[hsl(var(--border))] flex items-center gap-2">
                <div className="w-16 h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                  <div
                    className="h-full bg-[hsl(var(--primary))] rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  {totalCompleted}/{course.totalLessons} ({progressPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Active Lesson Meta */}
          {activeLesson && (
            <div className="space-y-6">
              {/* Lesson Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[hsl(var(--primary))]">
                      {activeLesson.lessonNumber === 0 ? 'Getting started' : `Lesson ${activeLesson.lessonNumber}`}
                    </span>
                    {activeLesson.wordCount && (
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        · {activeLesson.wordCount.toLocaleString()} words
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-medium text-[hsl(var(--foreground))] mt-0.5">
                    {activeLesson.title}
                  </h2>
                  <AlignmentBadge sources={[`/data/alignments/courses/${course.id}/lesson-${activeLesson.lessonNumber}.json`]} className="mt-2" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleLessonComplete(activeLesson.lessonNumber)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                      completedLessons[activeLesson.lessonNumber]
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--foreground)/0.04)]'
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {completedLessons[activeLesson.lessonNumber] ? 'Completed' : 'Complete lesson'}
                    </span>
                  </button>
                  {nextLesson && (
                    <button
                      type="button"
                      onClick={() => setActiveLessonNumber(nextLesson.lessonNumber)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[hsl(var(--foreground))] px-3 py-1.5 text-xs font-bold text-[hsl(var(--background))]"
                    >
                      Next lesson
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Video Player (if video lesson) */}
              {activeLesson.hasVideo && activeVideoUrl && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-sky-500" />
                    Video Lecture
                  </span>
                  <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow-md border border-stone-800">
                    <video
                      key={activeVideoUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                      src={activeVideoUrl}
                    >
                      Your browser does not support video playback.
                    </video>
                  </div>
                </div>
              )}

              {/* Audio Player Card (if audio lesson) */}
              {activeLesson.hasAudio && activeLesson.audioPath && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[hsl(var(--primary)/0.05)] border border-[hsl(var(--primary)/0.15)] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(activeLesson)}
                      className="w-12 h-12 rounded-2xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:scale-[1.02] flex items-center justify-center shadow-xs transition-transform shrink-0"
                    >
                      {isCurrentLessonPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                    <div>
                      <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        {isCurrentLessonPlaying ? 'Now Playing Lesson Audio' : 'Lesson Audio Master'}
                      </h4>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        Native pronunciation & explanations by Shayna
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={resolveMediaUrl(activeLesson.audioPath)}
                      download
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--foreground)/0.04)] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download MP3</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Lesson Directory */}
        <div className="lg:col-span-4 surface-card p-3.5 rounded-3xl border border-[hsl(var(--border))] max-h-[600px] flex flex-col">
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-50" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[hsl(var(--border))] bg-transparent focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>

          <div className="overflow-y-auto space-y-1 pr-1 custom-scrollbar flex-1">
            {filteredLessons.map((lesson, idx) => {
              const isActive = lesson.lessonNumber === activeLesson?.lessonNumber;
              const isDone = completedLessons[lesson.lessonNumber];
              const isTrackPlaying =
                lesson.audioPath &&
                currentTrack?.id === `course-${course.id}-l${lesson.lessonNumber}` &&
                isPlaying;
              const lessonScore = quizScores[lesson.lessonNumber];

              return (
                <button
                  key={`${lesson.lessonNumber}-${idx}`}
                  type="button"
                  onClick={() => setActiveLessonNumber(lesson.lessonNumber)}
                  className={cn(
                    'w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between gap-2 group',
                    isActive
                      ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] shadow-xs'
                      : 'hover:bg-[hsl(var(--foreground)/0.04)] text-[hsl(var(--foreground))]'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        'w-8 h-8 rounded-xl text-xs font-mono font-bold flex items-center justify-center shrink-0',
                        isActive
                          ? 'bg-[hsl(var(--background)/0.2)] text-[hsl(var(--background))]'
                          : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                      )}
                    >
                      {lesson.lessonNumber === 0 ? 'Start' : String(lesson.lessonNumber).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium truncate block">{lesson.title}</span>
                      {lessonScore && (
                        <span
                          className={cn(
                            'text-[10px] font-mono font-semibold',
                            isActive ? 'opacity-80' : 'text-emerald-600 dark:text-emerald-400'
                          )}
                        >
                          Quiz: {lessonScore.percentage}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-70">
                    {lesson.hasAudio && (
                      <Headphones
                        className={cn(
                          'w-3.5 h-3.5',
                          isTrackPlaying
                            ? 'text-[hsl(var(--primary))] animate-pulse opacity-100'
                            : ''
                        )}
                      />
                    )}
                    {lesson.hasVideo && (
                      <Video className="w-3.5 h-3.5" />
                    )}
                    {lesson.hasQuiz && (
                      <HelpCircle className="w-3.5 h-3.5" />
                    )}
                    {isDone && (
                      <CheckCircle2
                        className={cn(
                          'w-4 h-4 ml-1',
                          isActive ? 'opacity-100' : 'text-emerald-500 opacity-100'
                        )}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Width Bottom Area */}
      <div className="w-full space-y-6 pt-4">
        {activeLesson ? (
          <>
            {/* Study Workspace Tabs Navigation */}
            <div className="flex flex-wrap items-center gap-1 border-b border-[hsl(var(--border))] pb-px">
              {activeLesson.fullText && (
                <button
                  type="button"
                  onClick={() => setActiveTab('transcript')}
                  className={cn(
                    'px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-[3px] flex items-center gap-2',
                    activeTab === 'transcript'
                      ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                      : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  <FileText className="w-4 h-4" />
                  <span>Transcript</span>
                </button>
              )}

              {activeLesson.dialogue && activeLesson.dialogue.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('dialogue')}
                  className={cn(
                    'px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-[3px] flex items-center gap-2',
                    activeTab === 'dialogue'
                      ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                      : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Dialogue</span>
                </button>
              )}

              {activeLesson.vocabulary && activeLesson.vocabulary.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('vocab')}
                  className={cn(
                    'px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-[3px] flex items-center gap-2',
                    activeTab === 'vocab'
                      ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                      : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Vocabulary ({activeLesson.vocabulary.length})</span>
                </button>
              )}

              {activeLesson.phrases && activeLesson.phrases.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('phrases')}
                  className={cn(
                    'px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-[3px] flex items-center gap-2',
                    activeTab === 'phrases'
                      ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                      : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Phrases ({activeLesson.phrases.length})</span>
                </button>
              )}

              {activeLesson.quiz && activeLesson.quiz.questions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('quiz')}
                  className={cn(
                    'px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-[3px] flex items-center gap-2',
                    activeTab === 'quiz'
                      ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                      : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Quiz ({activeLesson.quiz.questions.length})</span>
                  {currentQuizScore && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600">
                      {currentQuizScore.percentage}%
                    </span>
                  )}
                </button>
              )}

              {activeLesson.writingTask && (
                <button
                  type="button"
                  onClick={() => setActiveTab('writing')}
                  className={cn(
                    'px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-[3px] flex items-center gap-2',
                    activeTab === 'writing'
                      ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                      : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Writing</span>
                </button>
              )}

              {(activeLesson.pdfPath || course.masterPdfPath) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('pdf')}
                  className={cn(
                    'px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-[3px] flex items-center gap-2',
                    activeTab === 'pdf'
                      ? 'border-[hsl(var(--primary))] text-[hsl(var(--foreground))]'
                      : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF Guide</span>
                </button>
              )}
            </div>

              {/* Tab 1a: Conversation Dialogue */}
              {activeTab === 'dialogue' && (
                <div className="space-y-6">
                  {/* Dialogue Turns (if conversation turns detected) */}
                  {activeLesson.dialogue && activeLesson.dialogue.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                          <span>Conversation Dialogue</span>
                        </h4>
                        <span className="text-[10px] text-stone-400">
                          {activeLesson.dialogue.length} speaker turns
                        </span>
                      </div>

                      <div className="space-y-2.5 p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800">
                        {activeLesson.dialogue.map((turn, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-[#14161C] border border-stone-100 dark:border-stone-800/80 shadow-2xs group hover:border-amber-300 dark:hover:border-amber-700/50 transition-colors"
                          >
                            <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center shrink-0 uppercase">
                              {turn.speaker.charAt(0)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                                {turn.speaker}
                              </span>
                              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 mt-0.5 leading-relaxed">
                                {turn.text}
                              </p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSpeak(turn.text)}
                                title="Listen with Speech"
                                className="p-1 rounded text-stone-400 hover:text-amber-600 dark:hover:text-amber-400"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(turn.text, `turn-${i}`)}
                                title="Copy turn"
                                className="p-1 rounded text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                              >
                                {copiedId === `turn-${i}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 1b: Full Transcript */}
              {activeTab === 'transcript' && (
                <div className="space-y-6">
                  {/* Full Clean Lesson Text */}
                  {activeLesson.fullText && (
                    <div className={cn(
                      "p-6 sm:p-12 rounded-3xl transition-colors duration-500",
                      theme === 'default' && 'bg-white text-stone-900 border border-[hsl(var(--border))]',
                      theme === 'sepia' && 'bg-[#F4E9D5] text-[#433422] border border-[#E3D6BC]',
                      theme === 'ocean' && 'bg-[#F0F4F8] dark:bg-[#0A192F] text-[#0A192F] dark:text-[#E6F1FF] border border-[#112240]',
                      theme === 'night' && 'bg-[#161821] text-[#E8E4DC] border border-[#2B2F3D]'
                    )}>
                      {/* Toolbar */}
                      <div className="flex items-center justify-between pb-6 mb-6 border-b border-black/10 dark:border-white/10 sticky top-0 z-20 bg-inherit backdrop-blur-sm bg-opacity-95">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-500" />
                          <h4 className="font-serif text-lg font-bold opacity-80">Full Lesson Text</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(activeLesson.fullText || '', 'full-text')}
                            className="p-1.5 rounded-lg hover:bg-[hsl(var(--foreground)/0.04)] transition-colors opacity-70 hover:opacity-100 flex items-center gap-1.5 font-bold text-xs"
                          >
                            {copiedId === 'full-text' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            <span className="hidden sm:inline">{copiedId === 'full-text' ? 'Copied' : 'Copy'}</span>
                          </button>
                          
                          <div className="relative">
                            <button
                              onClick={() => setShowSettings(!showSettings)}
                              className="p-1.5 rounded-lg hover:bg-[hsl(var(--foreground)/0.04)] transition-colors opacity-70 hover:opacity-100 flex items-center gap-1.5 font-bold text-xs"
                            >
                              <Settings className="w-4 h-4" />
                              <span className="hidden sm:inline">Settings</span>
                            </button>
                            
                            {showSettings && (
                              <div className="absolute right-0 top-10 z-50">
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
                      </div>

                      <SyncedReadAlong
                        alignment={lessonAlignment}
                        fallbackText={activeLesson.fullText}
                        trackId={`course-${course.id}-l${activeLesson.lessonNumber}`}
                        fontSize={fontSize}
                        lineHeight={lineHeight}
                        readingTheme={theme}
                        className={cn(
                          marginWidth === 'narrow' ? 'max-w-2xl' : marginWidth === 'wide' ? 'max-w-5xl' : 'max-w-4xl'
                        )}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Vocabulary */}
              {activeTab === 'vocab' && activeLesson.vocabulary && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        Lesson Vocabulary Bank
                      </h4>
                      <p className="text-xs text-stone-500">
                        {activeLesson.vocabulary.length} key terms, idioms, and phrasal verbs
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeLesson.vocabulary.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600/60 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-serif font-bold text-base text-amber-700 dark:text-amber-400">
                              {item.term}
                            </h5>
                            <button
                              type="button"
                              onClick={() => handleSpeak(item.term)}
                              title="Listen to pronunciation"
                              className="p-1 rounded text-stone-400 hover:text-amber-600 dark:hover:text-amber-400"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-stone-700 dark:text-stone-300 mt-1 leading-relaxed">
                            {item.definition}
                          </p>
                          {item.example && (
                            <p className="text-xs italic text-stone-500 dark:text-stone-400 mt-2 pl-2 border-l-2 border-amber-300 dark:border-amber-700">
                              “{item.example}”
                            </p>
                          )}
                        </div>

                        <div className="pt-3 mt-3 border-t border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              const snippet = `• ${item.term}: ${item.definition}${
                                item.example ? ` (e.g. "${item.example}")` : ''
                              }\n`;
                              const cur = lessonNotes[activeLesson.lessonNumber] || '';
                              handleNoteChange(activeLesson.lessonNumber, cur ? `${cur}\n${snippet}` : snippet);
                              addSavedNote({
                                term: item.term,
                                definition: item.definition,
                                note: item.example ? `${item.definition}\nExample: "${item.example}"` : item.definition,
                                sourceTitle: `${course.title} — ${activeLesson.title}`,
                                sourceUrl: `/courses/${course.id}`,
                              });
                              showToast(`Added "${item.term}" to your notes!`);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400"
                          >
                            <BookMarked className="w-3 h-3" />
                            <span>Save to Notes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(`${item.term}: ${item.definition}`, `voc-${idx}`)}
                            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                          >
                            {copiedId === `voc-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Useful Phrases */}
              {activeTab === 'phrases' && activeLesson.phrases && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Situational Expressions & Useful Phrases
                    </h4>
                    <p className="text-xs text-stone-500">
                      Practical expressions organized by communicative context
                    </p>
                  </div>

                  <div className="space-y-3">
                    {activeLesson.phrases.map((phrase, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 group hover:border-amber-300 dark:hover:border-amber-700/50 transition-colors"
                      >
                        <div className="space-y-0.5">
                          {phrase.category && (
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                              {phrase.category}
                            </span>
                          )}
                          <p className="text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100">
                            {phrase.phrase}
                          </p>
                          {phrase.explanation && (
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                              {phrase.explanation}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleSpeak(phrase.phrase)}
                            title="Speak phrase"
                            className="p-1 rounded text-stone-400 hover:text-amber-600 dark:hover:text-amber-400"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(phrase.phrase, `phr-${idx}`)}
                            title="Copy phrase"
                            className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                          >
                            {copiedId === `phr-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Interactive Quiz */}
              {activeTab === 'quiz' && activeLesson.quiz && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>{activeLesson.quiz.title}</span>
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                        Test your understanding of the vocabulary and structures learned in this lesson.
                      </p>
                    </div>

                    {currentQuizScore && lessonQuizSubmitted && (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#14161C] border border-amber-500/30 text-center">
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Score</span>
                          <span
                            className={cn(
                              'text-sm font-bold',
                              currentQuizScore.percentage >= 70
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            )}
                          >
                            {currentQuizScore.score} / {currentQuizScore.total} ({currentQuizScore.percentage}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {activeLesson.quiz.questions.map((q) => {
                      const selected = selectedAnswers[`${activeLesson.lessonNumber}_${q.id}`];
                      const isCorrect = selected && q.correctAnswer && selected.toUpperCase() === q.correctAnswer.toUpperCase();
                      const isIncorrect = selected && q.correctAnswer && selected.toUpperCase() !== q.correctAnswer.toUpperCase();

                      return (
                        <div
                          key={q.id}
                          className={cn(
                            'p-4 sm:p-5 rounded-2xl border transition-all',
                            lessonQuizSubmitted
                              ? isCorrect
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                              : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                              {q.id}. {q.question}
                            </span>
                            {lessonQuizSubmitted && (
                              <span className="shrink-0">
                                {isCorrect ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-rose-500" />
                                )}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, optIdx) => {
                              const optLetter = opt.charAt(0).toUpperCase();
                              const isThisSelected = selected === optLetter;
                              const isThisTheCorrectAnswer = lessonQuizSubmitted && q.correctAnswer?.toUpperCase() === optLetter;

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  disabled={lessonQuizSubmitted}
                                  onClick={() => handleSelectQuizAnswer(activeLesson.lessonNumber, q.id, optLetter)}
                                  className={cn(
                                    'w-full text-left p-3 rounded-xl text-xs font-medium transition-all flex items-center justify-between border',
                                    isThisSelected
                                      ? lessonQuizSubmitted
                                        ? isCorrect
                                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                          : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                        : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                      : isThisTheCorrectAnswer
                                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 border-emerald-400 font-bold'
                                      : 'bg-white dark:bg-[#14161C] border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 text-stone-700 dark:text-stone-300'
                                  )}
                                >
                                  <span>{opt}</span>
                                  {isThisTheCorrectAnswer && (
                                    <Check className="w-3.5 h-3.5 ml-1 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {lessonQuizSubmitted && isIncorrect && q.correctAnswer && (
                            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-2.5">
                              Correct answer: <span className="underline">{q.correctAnswer}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                    {!lessonQuizSubmitted ? (
                      <button
                        type="button"
                        onClick={() => handleCheckQuiz(activeLesson)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit & Check Answers</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResetQuiz(activeLesson)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Retake Quiz</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 5: Writing Task */}
              {activeTab === 'writing' && activeLesson.writingTask && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Writing & Practice Prompt
                    </span>
                    <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-serif">
                      {activeLesson.writingTask}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                        Your Practice Response
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {(writingSubmissions[activeLesson.lessonNumber] || '').trim().split(/\s+/).filter(Boolean).length} words · Auto-saved
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      placeholder="Write your response, sentences, or short essay here to put the lesson into practice..."
                      value={writingSubmissions[activeLesson.lessonNumber] || ''}
                      onChange={(e) => handleWritingChange(activeLesson.lessonNumber, e.target.value)}
                      className="w-full p-4 text-xs sm:text-sm rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Tab 6: Original PDF Viewer */}
              {activeTab === 'pdf' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Lesson PDF Coursebook
                    </span>
                    <a
                      href={activePdfUrl || masterPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <span>Open in new tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {(activePdfUrl || masterPdfUrl) && (
                    <div className="w-full h-[640px] rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-stone-100 dark:bg-stone-900 shadow-inner">
                      <iframe
                        src={activePdfUrl || masterPdfUrl}
                        className="w-full h-full"
                        title={`PDF for ${activeLesson.title}`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Study Notes Card (always accessible) */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <BookMarked className="w-3.5 h-3.5 text-amber-500" />
                    Personal Study Notes & Vocabulary
                  </span>
                  <span className="text-[10px] text-stone-400">Auto-saved to device</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Record useful idioms, phrases, or grammar notes from this lesson..."
                  value={lessonNotes[activeLesson.lessonNumber] || ''}
                  onChange={(e) => handleNoteChange(activeLesson.lessonNumber, e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
                />
              </div>

              {/* Bottom Pagination Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
                {prevLesson ? (
                  <button
                    type="button"
                    onClick={() => setActiveLessonNumber(prevLesson.lessonNumber)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#14161C] text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous: Lesson {prevLesson.lessonNumber}</span>
                  </button>
                ) : (
                  <div />
                )}

                {nextLesson && (
                  <button
                    type="button"
                    onClick={() => setActiveLessonNumber(nextLesson.lessonNumber)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white transition-colors shadow-2xs"
                  >
                    <span>Next: Lesson {nextLesson.lessonNumber}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
          </>
        ) : (
          <div className="p-12 text-center text-[hsl(var(--muted-foreground))] border border-dashed border-[hsl(var(--border))] rounded-3xl">
            Select a lesson to begin.
          </div>
        )}
      </div>
    </div>
  );
}
