'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Headphones,
  Search,
  BarChart2,
  Mic,
  Bookmark,
  Sun,
  Moon,
  Sparkles,
  Library,
  Play,
  Pause,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioStore } from '@/lib/store';

export function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { currentTrack, isPlaying, togglePlay } = useAudioStore();

  useEffect(() => {
    setMounted(true);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkStored = localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && prefersDark);
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Global keyboard shortcut: '/' to go to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        window.location.href = '/search';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Compass },
    { href: '/podcasts', label: 'Podcasts', icon: Headphones },
    { href: '/readers', label: 'Readers', icon: BookOpen },
    { href: '/accent', label: 'Accent', icon: Mic },
    { href: '/library', label: 'Reference', icon: Library },
    { href: '/progress', label: 'Progress', icon: BarChart2 },
  ];

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-[#FAF8F5]/90 dark:bg-[#101216]/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo / Editorial Brand */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-50 dark:bg-amber-500/15 dark:text-amber-400 border border-stone-800/20 dark:border-amber-500/30 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg tracking-tight font-medium text-stone-900 dark:text-stone-100 flex items-center gap-1.5 leading-none">
                ContentFirst
                <span className="text-[10px] font-sans font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  English
                </span>
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans tracking-normal hidden sm:block mt-0.5">
                Authentic Audio & Reading Atelier
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5',
                    active
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions: Now Playing Indicator + Quick Search + Theme Toggle */}
          <div className="flex items-center gap-2">
            {/* Now Playing Mini Widget if audio track is active */}
            {currentTrack && (
              <div className="hidden lg:flex items-center gap-2.5 px-3 py-1 rounded-full border border-stone-300/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 shadow-xs max-w-[200px]">
                {/* Mini animated equalizer bars */}
                <div className="flex items-end gap-0.5 h-3 w-3 shrink-0">
                  <span className={cn('w-0.5 bg-amber-600 dark:bg-amber-400 rounded-full', isPlaying ? 'animate-wave-1' : 'h-1')} />
                  <span className={cn('w-0.5 bg-amber-600 dark:bg-amber-400 rounded-full', isPlaying ? 'animate-wave-2' : 'h-2')} />
                  <span className={cn('w-0.5 bg-amber-600 dark:bg-amber-400 rounded-full', isPlaying ? 'animate-wave-3' : 'h-1.5')} />
                </div>
                <span className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                  {currentTrack.title}
                </span>
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                  className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
                >
                  {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>
              </div>
            )}

            {/* Quick Search trigger */}
            <Link
              href="/search"
              aria-label="Open search (shortcut: /)"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 hover:border-stone-400 dark:hover:border-stone-600 text-stone-500 dark:text-stone-400 text-xs transition-colors shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-stone-400">Search library...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-500 rounded border border-stone-200 dark:border-stone-700">
                /
              </kbd>
            </Link>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-colors"
            >
              {mounted && isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#101216]/95 border-t border-stone-200 dark:border-stone-800 backdrop-blur-md pb-safe">
        <div className="grid grid-cols-5 h-14">
          {[
            { href: '/', label: 'Home', icon: Compass },
            { href: '/podcasts', label: 'Podcasts', icon: Headphones },
            { href: '/readers', label: 'Readers', icon: BookOpen },
            { href: '/accent', label: 'Accent', icon: Mic },
            { href: '/progress', label: 'Progress', icon: BarChart2 },
          ].map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors',
                  active
                    ? 'text-stone-950 dark:text-amber-400 font-bold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
