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
  Sun,
  Moon,
  Library,
  Compass,
  GraduationCap,
  PanelLeftClose,
  PanelLeft,
  Play,
  Pause,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioStore } from '@/lib/store';

const NAV_SECTIONS = [
  {
    label: 'Start here',
    items: [
      { href: '/', label: 'Today', icon: Compass, color: 'text-[hsl(var(--accent-warm))]' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { href: '/podcasts', label: 'Listen', icon: Headphones, color: 'text-[hsl(var(--podcast-sienna))]' },
      { href: '/readers', label: 'Read', icon: BookOpen, color: 'text-[hsl(var(--reader-green))]' },
      { href: '/courses', label: 'Courses', icon: GraduationCap, color: 'text-[hsl(var(--course-sapphire))]' },
      { href: '/accent', label: 'Accent', icon: Mic, color: 'text-[hsl(var(--accent-warm))]' },
    ],
  },
  {
    label: 'Library',
    items: [
      { href: '/library', label: 'Explore', icon: Library, color: 'text-[hsl(var(--muted-foreground))]' },
      { href: '/search', label: 'Search', icon: Search, color: 'text-[hsl(var(--muted-foreground))]' },
    ],
  },
  {
    label: 'You',
    items: [
      { href: '/progress', label: 'Progress', icon: BarChart2, color: 'text-[hsl(var(--accent-warm))]' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const isReadingRoom = pathname.startsWith('/readers/');
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentTrack, isPlaying, togglePlay } = useAudioStore();

  useEffect(() => {
    setMounted(true);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('theme');
    const isDarkStored = stored === 'dark' || (!stored && prefersDark);
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Load collapsed preference
    const collapsedStored = localStorage.getItem('sidebar-collapsed');
    if (collapsedStored === 'true') setCollapsed(true);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

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

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
    window.dispatchEvent(new Event('sidebar-toggle'));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('px-4 pt-5 pb-4', collapsed && 'px-3')}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-base tracking-tight font-medium text-[hsl(var(--foreground))] leading-none">
                ContentFirst
              </span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-sans mt-0.5 truncate">
                English Reading Room
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-2 space-y-5 overflow-y-auto py-2" aria-label="Main Navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <span className="px-3 text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] mb-1.5 block">
                {section.label}
              </span>
            )}
            <ul className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, color }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl transition-all group',
                        collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                        active
                          ? 'bg-[hsl(var(--foreground)/0.06)] text-[hsl(var(--foreground))] font-semibold'
                          : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.04)]'
                      )}
                      title={collapsed ? label : undefined}
                    >
                      <Icon
                        className={cn(
                          'w-[18px] h-[18px] shrink-0 transition-colors',
                          active ? color : 'group-hover:' + color.replace('text-', 'text-')
                        )}
                      />
                      {!collapsed && (
                        <span className="text-[13px] font-sans truncate">{label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom Section: Now Playing + Theme + Collapse */}
      <div className={cn('px-2 pb-4 space-y-2 border-t border-[hsl(var(--sidebar-border))] pt-3', collapsed && 'px-1.5')}>
        {/* Now Playing Widget */}
        {currentTrack && (
          <div
            className={cn(
              'rounded-xl p-2.5 bg-[hsl(var(--foreground)/0.04)] border border-[hsl(var(--border))]',
              collapsed ? 'flex items-center justify-center' : 'space-y-2'
            )}
          >
            {collapsed ? (
              <button
                type="button"
                onClick={togglePlay}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--foreground)/0.06)]"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={currentTrack.title}
              >
                <div className="flex items-end gap-0.5 h-4 w-4">
                  <span className={cn('w-0.5 bg-[hsl(var(--accent-warm))] rounded-full', isPlaying ? 'animate-wave-1' : 'h-1')} />
                  <span className={cn('w-0.5 bg-[hsl(var(--accent-warm))] rounded-full', isPlaying ? 'animate-wave-2' : 'h-2')} />
                  <span className={cn('w-0.5 bg-[hsl(var(--accent-warm))] rounded-full', isPlaying ? 'animate-wave-3' : 'h-1.5')} />
                </div>
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-0.5 h-3 w-3 shrink-0">
                    <span className={cn('w-0.5 bg-[hsl(var(--accent-warm))] rounded-full', isPlaying ? 'animate-wave-1' : 'h-1')} />
                    <span className={cn('w-0.5 bg-[hsl(var(--accent-warm))] rounded-full', isPlaying ? 'animate-wave-2' : 'h-2')} />
                    <span className={cn('w-0.5 bg-[hsl(var(--accent-warm))] rounded-full', isPlaying ? 'animate-wave-3' : 'h-1.5')} />
                  </div>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))] truncate flex-1">
                    {currentTrack.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-xs font-semibold hover:opacity-90 transition-opacity"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                  <span>{isPlaying ? 'Pause' : 'Resume'}</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className={cn(
            'flex items-center gap-3 rounded-xl transition-colors w-full',
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
            'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.04)]'
          )}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
          {mounted && isDark ? (
            <Sun className="w-[18px] h-[18px] text-amber-400" />
          ) : (
            <Moon className="w-[18px] h-[18px]" />
          )}
          {!collapsed && (
            <span className="text-[13px] font-sans">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>

        {/* Collapse Toggle (desktop only) */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            'hidden md:flex items-center gap-3 rounded-xl transition-colors w-full',
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
            'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.04)]'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? (
            <PanelLeft className="w-[18px] h-[18px]" />
          ) : (
            <PanelLeftClose className="w-[18px] h-[18px]" />
          )}
          {!collapsed && (
            <span className="text-[13px] font-sans">Collapse</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40',
          'bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))]',
          'sidebar-transition',
          isReadingRoom && 'md:hidden',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className={cn(
        'md:hidden sticky top-0 z-40 h-12 flex items-center justify-between px-3 bg-[hsl(var(--sidebar-bg)/0.95)] border-b border-[hsl(var(--sidebar-border))] backdrop-blur-md',
        isReadingRoom && 'hidden'
      )}>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.04)]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[hsl(var(--foreground))] text-[hsl(var(--background))] flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="font-serif text-sm font-medium text-[hsl(var(--foreground))]">ContentFirst</span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Now playing indicator (mobile) */}
          {currentTrack && isPlaying && (
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg"
              aria-label="Pause audio"
            >
              <div className="flex items-end gap-0.5 h-3.5 w-3.5">
                <span className="w-0.5 bg-[hsl(var(--accent-warm))] rounded-full animate-wave-1" />
                <span className="w-0.5 bg-[hsl(var(--accent-warm))] rounded-full animate-wave-2" />
                <span className="w-0.5 bg-[hsl(var(--accent-warm))] rounded-full animate-wave-3" />
              </div>
            </button>
          )}
          <Link
            href="/search"
            className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            aria-label="Search"
          >
            <Search className="w-4.5 h-4.5" />
          </Link>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          {/* Panel */}
          <div className="absolute left-0 top-0 bottom-0 w-[min(18rem,calc(100%-1rem))] overflow-y-auto bg-[hsl(var(--sidebar-bg))] shadow-2xl">
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.04)]"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
