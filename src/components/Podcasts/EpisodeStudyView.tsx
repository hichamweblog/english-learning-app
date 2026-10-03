'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Plus
} from 'lucide-react';
import type {
  PodcastEpisode,
  ExtractedEpisodeData,
  ExtractedVipData,
  GlossaryEntry
} from '@/types/content';
import { useAudioStore, useProgressStore } from '@/lib/store';
import { resolveMediaUrl, cn } from '@/lib/utils';

interface Props {
  episode: PodcastEpisode;
  prevEpisode: PodcastEpisode | null;
  nextEpisode: PodcastEpisode | null;
  extractedData?: ExtractedEpisodeData | null;
  extractedVip?: ExtractedVipData | null;
}

export function EpisodeStudyView({
  episode,
  prevEpisode,
  nextEpisode,
  extractedData,
  extractedVip
}: Props) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();
  const { completedItems, toggleCompleted, addRecentItem } = useProgressStore();

  // Tab State
  const defaultTab = extractedData?.glossary?.length
    ? 'glossary'
    : extractedVip?.vocabulary?.length
    ? 'vocabulary'
    : episode.pdfPath
    ? 'guide'
    : 'notes';

  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Search & Filter in Glossary
  const [glossarySearch, setGlossarySearch] = useState('');

  // Quiz State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});

  // Transcript Reader Settings
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Personal Notes State
  const [noteText, setNoteText] = useState('');
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    localStorage.setItem(`notes_${episode.id}`, text);
  };

  const appendToNotes = (entry: GlossaryEntry) => {
    const snippet = `• ${entry.term}: ${entry.definition}${
      entry.exampleSentence ? `\n  Example: "${entry.exampleSentence}"` : ''
    }\n\n`;
    const updated = (noteText ? noteText.trim() + '\n\n' : '') + snippet;
    setNoteText(updated);
    localStorage.setItem(`notes_${episode.id}`, updated);
    showToast(`Added "${entry.term}" to your notebook`);
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

  const [glossaryFilter, setGlossaryFilter] = useState<'all' | 'phrases'>('all');
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Filtered Glossary
  const filteredGlossary = useMemo(() => {
    let list = extractedData?.glossary || [];
    if (glossaryFilter === 'phrases' && extractedData?.usefulPhrases && extractedData.usefulPhrases.length > 0) {
      list = extractedData.usefulPhrases;
    }
    if (!glossarySearch.trim()) return list;
    const q = glossarySearch.toLowerCase();
    return list.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        (item.exampleSentence && item.exampleSentence.toLowerCase().includes(q))
    );
  }, [extractedData, glossarySearch, glossaryFilter]);

  const copyTranscript = () => {
    if (!extractedData?.transcript?.fullText) return;
    navigator.clipboard.writeText(extractedData.transcript.fullText);
    setCopiedTranscript(true);
    showToast('Full transcript copied to clipboard');
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const downloadTranscript = () => {
    if (!extractedData?.transcript?.fullText) return;
    const blob = new Blob([extractedData.transcript.fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${episode.title.replace(/[^a-zA-Z0-9]/g, '_')}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded full transcript (.txt)');
  };

  // Handle Quiz Selection
  const handleSelectOption = (questionNumber: number, optionKey: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionNumber]: optionKey,
    }));
    setQuizSubmitted((prev) => ({
      ...prev,
      [questionNumber]: true,
    }));
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted({});
  };

  // Quiz Score Calculation
  const quizQuestions = extractedData?.questions || [];
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = quizQuestions.filter(
    (q) => selectedAnswers[q.questionNumber] === q.correctAnswer
  ).length;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold shadow-xl border border-stone-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

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
            {extractedData && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <Sparkles className="w-3 h-3" />
                <span>Extracted Unit</span>
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
          {extractedData?.title || episode.title}
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
              <span>Original PDF Guide</span>
            </a>
          )}
        </div>
      </div>

      {/* Structured Navigation Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 overflow-x-auto pb-px">
          {/* Glossary Tab (Daily / Cultural) */}
          {extractedData && extractedData.glossary.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('glossary')}
              className={cn(
                'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0',
                activeTab === 'glossary'
                  ? 'border-stone-900 text-stone-950 dark:border-amber-400 dark:text-amber-400'
                  : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span>Glossary ({extractedData.glossary.length})</span>
            </button>
          )}

          {/* Comprehension Quiz Tab (Daily) */}
          {extractedData && extractedData.questions.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={cn(
                'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0',
                activeTab === 'quiz'
                  ? 'border-stone-900 text-stone-950 dark:border-amber-400 dark:text-amber-400'
                  : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              )}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Quiz ({extractedData.questions.length})</span>
            </button>
          )}

          {/* Culture Note Tab (Daily) */}
          {extractedData?.cultureNote && (
            <button
              type="button"
              onClick={() => setActiveTab('culture')}
              className={cn(
                'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0',
                activeTab === 'culture'
                  ? 'border-stone-900 text-stone-950 dark:border-amber-400 dark:text-amber-400'
                  : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span>Culture Note</span>
            </button>
          )}

          {/* Insiders Know Tab (Cultural English) */}
          {extractedData?.insidersKnow && (
            <button
              type="button"
              onClick={() => setActiveTab('insiders')}
              className={cn(
                'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0',
                activeTab === 'insiders'
                  ? 'border-stone-900 text-stone-950 dark:border-amber-400 dark:text-amber-400'
                  : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span>What Insiders Know</span>
            </button>
          )}

          {/* Transcript Tab */}
          {extractedData?.transcript && (
            <button
              type="button"
              onClick={() => setActiveTab('transcript')}
              className={cn(
                'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0',
                activeTab === 'transcript'
                  ? 'border-stone-900 text-stone-950 dark:border-amber-400 dark:text-amber-400'
                  : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
              )}
            >
              <FileText className="w-4 h-4" />
              <span>Transcript</span>
            </button>
          )}

          {/* VIP Dialogue Tab */}
          {extractedVip && (
            <>
              {extractedVip.dialog.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('vip-dialog')}
                  className={cn(
                    'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0',
                    activeTab === 'vip-dialog'
                      ? 'border-stone-900 text-stone-950 dark:border-amber-400 dark:text-amber-400'
                      : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Dialogue ({extractedVip.dialog.length} turns)</span>
                </button>
              )}

              {extractedVip.readingPassage && (
                <button
                  type="button"
                  onClick={() => setActiveTab('vip-reading')}
                  className={cn(
                    'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0',
                    activeTab === 'vip-reading'
                      ? 'border-stone-900 text-stone-950 dark:border-amber-400 dark:text-amber-400'
                      : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                  )}
                >
                  <FileText className="w-4 h-4" />
                  <span>Reading Passage</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('vip-vocab')}
                className={cn(
                  'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0',
                  activeTab === 'vip-vocab'
                    ? 'border-stone-900 text-stone-950 dark:border-amber-400 dark:text-amber-400'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                )}
              >
                <BookOpen className="w-4 h-4" />
                <span>Slang & Phrases ({extractedVip.vocabulary.length})</span>
              </button>
            </>
          )}

          {/* Original PDF Guide Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={cn(
              'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0',
              activeTab === 'guide'
                ? 'border-stone-900 text-stone-950 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            )}
          >
            <File className="w-4 h-4" />
            <span>PDF Guide</span>
          </button>

          {/* Personal Notebook Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={cn(
              'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0',
              activeTab === 'notes'
                ? 'border-stone-900 text-stone-950 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            )}
          >
            <Edit3 className="w-4 h-4" />
            <span>Notebook</span>
            {noteText.trim() && (
              <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400" />
            )}
          </button>
        </div>

        {/* TAB 1: INTERACTIVE GLOSSARY */}
        {activeTab === 'glossary' && extractedData && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    placeholder="Filter terms or definitions..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {extractedData.usefulPhrases && extractedData.usefulPhrases.length > 0 && (
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setGlossaryFilter('all')}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-medium transition-colors',
                        glossaryFilter === 'all'
                          ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                          : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                      )}
                    >
                      All Terms ({extractedData.glossary.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGlossaryFilter('phrases')}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1',
                        glossaryFilter === 'phrases'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 shadow-2xs font-semibold'
                          : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                      )}
                    >
                      <span>Useful Phrases & Idioms</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-200/60 dark:bg-amber-900/60">
                        {extractedData.usefulPhrases.length}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <span className="text-xs text-stone-500">
                Showing {filteredGlossary.length} {glossaryFilter === 'phrases' ? 'phrases' : 'terms'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGlossary.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#14161C] shadow-2xs space-y-3 hover:border-stone-300 dark:hover:border-stone-700 transition-colors group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                        {entry.term}
                      </h4>
                      <button
                        type="button"
                        onClick={() => appendToNotes(entry)}
                        title="Add to Notebook"
                        className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                      {entry.definition}
                    </p>
                  </div>

                  {entry.exampleSentence && (
                    <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800/80 text-xs text-stone-600 dark:text-stone-400 italic font-serif">
                      "{entry.exampleSentence}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* WHAT ELSE DOES IT MEAN SECTION */}
            {extractedData.whatElse && extractedData.whatElse.length > 0 && (
              <div className="pt-8 border-t border-stone-200 dark:border-stone-800 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <span>What Else Does It Mean?</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Additional nuances, slang variations, and alternative idioms for terms used in this episode.
                  </p>
                </div>

                <div className="space-y-4">
                  {extractedData.whatElse.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] space-y-2"
                    >
                      <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                        {item.term}
                      </h4>
                      <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed">
                        {item.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTERACTIVE COMPREHENSION QUIZ */}
        {activeTab === 'quiz' && extractedData && (
          <div className="max-w-3xl space-y-6">
            <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                  Episode Comprehension Check
                </h3>
                <p className="text-xs text-stone-500">
                  Test your understanding of the audio dialogue and story context.
                </p>
              </div>

              {answeredCount > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                    Score: {correctCount} / {quizQuestions.length}
                  </span>
                  <button
                    type="button"
                    onClick={resetQuiz}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 text-xs text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {quizQuestions.map((q) => {
                const selected = selectedAnswers[q.questionNumber];
                const submitted = quizSubmitted[q.questionNumber];
                const isCorrect = selected === q.correctAnswer;

                return (
                  <div
                    key={q.questionNumber}
                    className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] space-y-4 shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 font-mono text-xs font-bold flex items-center justify-center shrink-0 text-stone-700 dark:text-stone-300">
                        {q.questionNumber}
                      </span>
                      <h4 className="font-serif text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100 leading-snug">
                        {q.question}
                      </h4>
                    </div>

                    <div className="space-y-2 pt-2">
                      {q.options.map((opt) => {
                        const isThisSelected = selected === opt.key;
                        const isThisCorrect = q.correctAnswer === opt.key;

                        let buttonStyles =
                          'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850 text-stone-800 dark:text-stone-200';

                        if (submitted) {
                          if (isThisCorrect) {
                            buttonStyles =
                              'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200';
                          } else if (isThisSelected && !isThisCorrect) {
                            buttonStyles =
                              'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200';
                          }
                        } else if (isThisSelected) {
                          buttonStyles =
                            'border-stone-900 dark:border-amber-400 bg-stone-100 dark:bg-stone-800';
                        }

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleSelectOption(q.questionNumber, opt.key)}
                            className={cn(
                              'w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-sans flex items-start gap-3 transition-colors',
                              buttonStyles
                            )}
                          >
                            <span className="font-mono font-bold uppercase w-5 text-stone-500 shrink-0">
                              {opt.key})
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {submitted && isThisCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                            {submitted && isThisSelected && !isThisCorrect && (
                              <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {submitted && (
                      <div
                        className={cn(
                          'p-3 rounded-xl text-xs font-semibold flex items-center gap-2',
                          isCorrect
                            ? 'bg-emerald-100/60 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100/60 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                        )}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Correct answer! Excellent listening comprehension.</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              Incorrect. The official answer is ({q.correctAnswer?.toUpperCase()}).
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CULTURE NOTE */}
        {activeTab === 'culture' && extractedData?.cultureNote && (
          <div className="max-w-3xl p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Culture Note</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 dark:text-stone-50">
              {extractedData.cultureNote.title}
            </h3>

            <div className="pt-2 text-sm sm:text-base text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed font-serif">
              {extractedData.cultureNote.content}
            </div>
          </div>
        )}

        {/* TAB 4: WHAT INSIDERS KNOW (Cultural English) */}
        {activeTab === 'insiders' && extractedData?.insidersKnow && (
          <div className="max-w-3xl p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">What Insiders Know</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 dark:text-stone-50">
              {extractedData.insidersKnow.title}
            </h3>

            <div className="pt-2 text-sm sm:text-base text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed font-serif">
              {extractedData.insidersKnow.content}
            </div>
          </div>
        )}

        {/* TAB 5: VERBATIM TRANSCRIPT */}
        {activeTab === 'transcript' && extractedData?.transcript && (
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C]">
              <div className="flex items-center gap-3">
                {extractedData.transcript.wordCount && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {extractedData.transcript.wordCount.toLocaleString()} words
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-stone-500 font-medium">Size:</span>
                  {(['normal', 'large', 'xlarge'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFontSize(size)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border',
                        fontSize === size
                          ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 border-transparent'
                          : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                      )}
                    >
                      {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyTranscript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors"
                >
                  {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTranscript ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={downloadTranscript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .txt</span>
                </button>
              </div>
            </div>

            {/* Standout Dialogue Card */}
            {extractedData.transcript.dialogue && (
              <div className="p-6 rounded-2xl border border-amber-300/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Story / Dialogue</span>
                </div>
                <div
                  className={cn(
                    'font-serif text-stone-900 dark:text-stone-100 whitespace-pre-line leading-relaxed',
                    fontSize === 'normal'
                      ? 'text-base'
                      : fontSize === 'large'
                      ? 'text-lg'
                      : 'text-xl'
                  )}
                >
                  {extractedData.transcript.dialogue}
                </div>
              </div>
            )}

            {/* Complete Spoken Script */}
            <div className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] shadow-2xs space-y-4">
              <h4 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                Full Audio Narration & Explanation
              </h4>
              <div
                className={cn(
                  'text-stone-700 dark:text-stone-300 whitespace-pre-line font-serif leading-relaxed',
                  fontSize === 'normal'
                    ? 'text-sm sm:text-base'
                    : fontSize === 'large'
                    ? 'text-base sm:text-lg'
                    : 'text-lg sm:text-xl'
                )}
              >
                {extractedData.transcript.fullText}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: VIP DIALOGUE / PASSAGE / VOCABULARY */}
        {activeTab === 'vip-dialog' && extractedVip && (
          <div className="max-w-3xl space-y-3">
            {extractedVip.dialog.map((turn, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-4 rounded-2xl border max-w-[85%] space-y-1',
                  turn.speaker === 'A'
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 ml-0 mr-auto'
                    : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 ml-auto mr-0 text-right'
                )}
              >
                <span className="text-[11px] font-mono font-bold text-stone-500 uppercase">
                  Speaker {turn.speaker}
                </span>
                <p className="text-sm sm:text-base text-stone-900 dark:text-stone-100 font-sans leading-relaxed text-left">
                  {turn.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'vip-reading' && extractedVip?.readingPassage && (
          <div className="max-w-3xl p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] space-y-3">
            <h3 className="font-serif text-2xl font-normal text-stone-900 dark:text-stone-50">
              Reading Passage
            </h3>
            <div className="text-base text-stone-700 dark:text-stone-300 font-serif leading-relaxed whitespace-pre-line">
              {extractedVip.readingPassage}
            </div>
          </div>
        )}

        {activeTab === 'vip-vocab' && extractedVip && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {extractedVip.vocabulary.map((entry, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-amber-800 dark:text-amber-400">
                      {entry.term}
                    </h4>
                    <button
                      type="button"
                      onClick={() => appendToNotes(entry)}
                      title="Add to Notebook"
                      className="p-1 rounded-md border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    {entry.definition}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 7: ORIGINAL PDF VIEWER */}
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

        {/* TAB 8: PERSONAL VOCABULARY & NOTES */}
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
