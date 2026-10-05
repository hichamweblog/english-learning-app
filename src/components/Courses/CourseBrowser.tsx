'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  GraduationCap,
  Headphones,
  Video,
  FileText,
  X,
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { Course } from '@/types/content';
import { resolveMediaUrl, cn } from '@/lib/utils';

interface Props {
  initialCourses: Course[];
}

export function CourseBrowser({ initialCourses }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedLevel, setSelectedLevel] = useState<string>(searchParams.get('level') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});

  const updateFilters = (next: { category?: string; level?: string; q?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === 'all') params.delete(key);
      else params.set(key, value);
    }
    router.replace(`/courses?${params.toString()}`, { scroll: false });
  };

  React.useEffect(() => {
    const progress: Record<string, number> = {};
    initialCourses.forEach((c) => {
      try {
        const saved =
          localStorage.getItem(`course_completed_${c.id}`) ||
          localStorage.getItem(`course_completed_lessons_${c.id}`);
        if (saved) {
          const completed = JSON.parse(saved);
          const totalCompleted = Object.values(completed).filter(Boolean).length;
          progress[c.id] = Math.round((totalCompleted / Math.max(1, c.totalLessons)) * 100);
        }
      } catch (e) {}
    });
    setCourseProgress(progress);
  }, [initialCourses]);

  const categories = useMemo(() => {
    const set = new Set(initialCourses.map((c) => c.category));
    return ['all', ...Array.from(set)];
  }, [initialCourses]);

  const levels = useMemo(() => {
    const set = new Set(initialCourses.map((c) => c.levelLabel));
    return ['all', ...Array.from(set)];
  }, [initialCourses]);

  const filtered = useMemo(() => {
    let list = initialCourses;
    if (selectedCategory !== 'all') {
      list = list.filter((c) => c.category === selectedCategory);
    }
    if (selectedLevel !== 'all') {
      list = list.filter((c) => c.levelLabel === selectedLevel);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.lessons.some((l) => l.title.toLowerCase().includes(q))
      );
    }
    return list;
  }, [initialCourses, selectedCategory, selectedLevel, searchQuery]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalLessons = initialCourses.reduce((sum, c) => sum + c.totalLessons, 0);
    const audioLessons = initialCourses.reduce(
      (sum, c) => sum + c.lessons.filter((l) => l.hasAudio).length,
      0
    );
    const videoLessons = initialCourses.reduce(
      (sum, c) => sum + c.lessons.filter((l) => l.hasVideo).length,
      0
    );
    return { totalCourses: initialCourses.length, totalLessons, audioLessons, videoLessons };
  }, [initialCourses]);

  return (
    <div className="space-y-6">
      {/* Editorial Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-amber-500/10 via-stone-100 to-transparent dark:from-amber-500/10 dark:via-stone-900/50 dark:to-transparent border border-amber-500/20 dark:border-amber-500/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Curated Structured Curriculum
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
            Espresso English Mastery Suite
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
            Direct, practical courses by Shayna Oliveira spanning spoken English, idioms, phrasal verbs, business communication, listening mastery, and grammar foundations.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/60 dark:border-stone-800 backdrop-blur-xs">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500">Courses</span>
              <p className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                {stats.totalCourses}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/60 dark:border-stone-800 backdrop-blur-xs">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500">Lessons</span>
              <p className="font-serif text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {stats.totalLessons}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/60 dark:border-stone-800 backdrop-blur-xs">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500">Audio Lessons</span>
              <p className="font-serif text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {stats.audioLessons}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/60 dark:border-stone-800 backdrop-blur-xs">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500">Video Modules</span>
              <p className="font-serif text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                {stats.videoLessons}
              </p>
            </div>
          </div>
        </div>
      </div>

      {initialCourses.length > 0 && (
        <Link
          href={`/courses/${initialCourses.find((course) => (courseProgress[course.id] || 0) > 0)?.id || initialCourses[0].id}`}
          className="group surface-elevated flex flex-col gap-4 rounded-2xl border-l-4 border-l-[hsl(var(--course-sapphire))] p-5 transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--course-sapphire))]">
              {Object.values(courseProgress).some((value) => value > 0) ? 'Continue your course' : 'Start a guided pathway'}
            </span>
            <h2 className="mt-1 font-serif text-xl text-[hsl(var(--foreground))]">
              {initialCourses.find((course) => (courseProgress[course.id] || 0) > 0)?.title || initialCourses[0].title}
            </h2>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              {Object.values(courseProgress).some((value) => value > 0) ? 'Return to the next useful lesson.' : 'Choose one lesson and build from there.'}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--course-sapphire))]">
            Open course <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-stone-200 dark:border-stone-800">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              updateFilters({ category: cat });
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all capitalize',
              selectedCategory === cat
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
            )}
          >
            {cat === 'all' ? 'All Disciplines' : cat}
          </button>
        ))}
      </div>

      {/* Search & Level Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search courses or lesson topics..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              updateFilters({ q: e.target.value });
            }}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <span className="text-xs text-stone-500 hidden sm:inline">Level:</span>
          <select
            value={selectedLevel}
            onChange={(e) => {
              setSelectedLevel(e.target.value);
              updateFilters({ level: e.target.value });
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14161C] text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            {levels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl === 'all' ? 'All Levels' : lvl}
              </option>
            ))}
          </select>
          <div className="text-xs text-stone-500 ml-auto sm:ml-2">
            Showing <span className="font-semibold text-stone-900 dark:text-stone-100">{filtered.length}</span> courses
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((course) => {
          const audios = course.lessons.filter((l) => l.hasAudio).length;
          const videos = course.lessons.filter((l) => l.hasVideo).length;
          const pdfs = course.lessons.filter((l) => l.pdfPath).length;

          return (
            <div
              key={course.id}
              className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-white dark:bg-[#14161C] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group hover:border-[hsl(var(--primary)/0.5)]"
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                    {course.category}
                  </span>
                  <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                    {course.levelLabel}
                  </span>
                </div>

                {/* Course Title */}
                <h3 className="font-serif text-lg font-medium text-[hsl(var(--foreground))] leading-snug group-hover:text-[hsl(var(--primary))] transition-colors">
                  {course.title}
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  By {course.author}
                </p>

                {/* Progress Bar */}
                {courseProgress[course.id] !== undefined && courseProgress[course.id] > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1.5">
                      <span>Progress</span>
                      <span className="text-[hsl(var(--primary))]">{courseProgress[course.id]}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                      <div
                        className="h-full bg-[hsl(var(--primary))] rounded-full transition-all duration-300"
                        style={{ width: `${courseProgress[course.id]}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Media capabilities tags */}
                <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] text-[hsl(var(--muted-foreground))]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[hsl(var(--muted))]">
                    <Layers className="w-3 h-3 opacity-50" />
                    {course.totalLessons} Lessons
                  </span>
                  {audios > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Headphones className="w-3 h-3" />
                      {audios} Audio
                    </span>
                  )}
                  {videos > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <Video className="w-3 h-3" />
                      {videos} Video
                    </span>
                  )}
                  {(pdfs > 0 || course.masterPdfPath) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                      <FileText className="w-3 h-3" />
                      PDF
                    </span>
                  )}
                </div>

                {/* Sample lessons preview */}
                <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block mb-1.5">
                    Curriculum Preview
                  </span>
                  <ul className="space-y-1">
                    {course.lessons.slice(0, 3).map((lesson) => (
                      <li
                        key={lesson.lessonNumber}
                        className="text-xs text-[hsl(var(--muted-foreground))] truncate flex items-center gap-1.5"
                      >
                        <span className="text-[10px] font-mono opacity-50">
                          {String(lesson.lessonNumber).padStart(2, '0')}.
                        </span>
                        <span>{lesson.title}</span>
                      </li>
                    ))}
                    {course.totalLessons > 3 && (
                      <li className="text-[11px] text-[hsl(var(--muted-foreground))] italic opacity-70">
                        + {course.totalLessons - 3} more lessons
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Link */}
              <div className="mt-6 pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between">
                <Link
                  href={`/courses/${course.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:scale-[1.02] transition-all"
                >
                  <span>Explore Course</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
