'use client';

import React from 'react';
import { Type, AlignJustify, Palette, Maximize, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReadingSettingsPanelProps {
  fontSize: number; // 14-28
  lineHeight: number; // 1.5, 1.75, 2.0
  theme: 'default' | 'sepia' | 'night' | 'ocean';
  marginWidth: 'narrow' | 'comfortable' | 'wide';
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (lh: number) => void;
  onThemeChange: (theme: 'default' | 'sepia' | 'night' | 'ocean') => void;
  onMarginWidthChange: (width: 'narrow' | 'comfortable' | 'wide') => void;
  className?: string;
}

const LINE_HEIGHT_OPTIONS = [1.5, 1.75, 2.0] as const;

const THEME_OPTIONS: Array<{
  value: 'default' | 'sepia' | 'ocean' | 'night';
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}> = [
  {
    value: 'default',
    label: 'Paper',
    bgClass: 'bg-[#FAF7F0] dark:bg-[#FAF7F0]',
    textClass: 'text-[#22252C] dark:text-[#22252C]',
    borderClass: 'border-[#E2DDD2]',
    dotClass: 'bg-[#FAF7F0] border-stone-300',
  },
  {
    value: 'sepia',
    label: 'Old Paper',
    bgClass: 'bg-[#F4E9D5] dark:bg-[#F4E9D5]',
    textClass: 'text-[#433422] dark:text-[#433422]',
    borderClass: 'border-[#E3D6BC]',
    dotClass: 'bg-[#EBDCBB] border-amber-500',
  },
  {
    value: 'ocean',
    label: 'Ocean',
    bgClass: 'bg-[#F0F4F8] dark:bg-[#0A192F]',
    textClass: 'text-[#0A192F] dark:text-[#E6F1FF]',
    borderClass: 'border-[#112240]',
    dotClass: 'bg-[#112240] border-blue-400',
  },
  {
    value: 'night',
    label: 'Night',
    bgClass: 'bg-[#161821] dark:bg-[#161821]',
    textClass: 'text-[#E8E4DC] dark:text-[#E8E4DC]',
    borderClass: 'border-[#2B2F3D]',
    dotClass: 'bg-[#0F1117] border-stone-600',
  },
];

const MARGIN_WIDTH_OPTIONS: Array<{
  value: 'narrow' | 'comfortable' | 'wide';
  label: string;
}> = [
  { value: 'narrow', label: 'Narrow' },
  { value: 'comfortable', label: 'Balanced' },
  { value: 'wide', label: 'Wide' },
];

export function ReadingSettingsPanel({
  fontSize,
  lineHeight,
  theme,
  marginWidth,
  onFontSizeChange,
  onLineHeightChange,
  onThemeChange,
  onMarginWidthChange,
  className,
}: ReadingSettingsPanelProps) {
  return (
    <div
      role="region"
      aria-label="Reading display settings"
      className={cn(
        'surface-elevated p-5 w-[340px] space-y-6 select-none rounded-2xl shadow-xl border border-[hsl(var(--border))]',
        className
      )}
    >
      {/* Panel Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-[hsl(var(--border))] border-opacity-50">
        <Settings2 className="w-4 h-4 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
        <span className="font-sans text-xs font-bold uppercase tracking-widest text-[hsl(var(--foreground))]">
          Display Settings
        </span>
      </div>

      {/* Section: Text Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] shrink-0" aria-hidden="true" />
            <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Text Size
            </span>
          </div>
          <span className="font-mono text-xs font-semibold text-[hsl(var(--primary))] tabular-nums">
            {fontSize}px
          </span>
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="font-serif text-sm font-semibold text-[hsl(var(--muted-foreground))] select-none">
            A
          </span>
          <input
            type="range"
            min={14}
            max={32}
            step={1}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            aria-label="Text size"
            aria-valuemin={14}
            aria-valuemax={32}
            aria-valuenow={fontSize}
            className="w-full h-5 cursor-pointer accent-[hsl(var(--primary))]"
          />
          <span className="font-serif text-xl font-bold text-[hsl(var(--foreground))] select-none">
            A
          </span>
        </div>
      </div>

      {/* Section: Line Spacing */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlignJustify className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] shrink-0" aria-hidden="true" />
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Line Spacing
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Line Spacing">
          {LINE_HEIGHT_OPTIONS.map((lh) => {
            const isActive = lineHeight === lh;
            return (
              <button
                key={lh}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => onLineHeightChange(lh)}
                className={cn(
                  'py-2 px-2 text-sm font-medium rounded-xl transition-all text-center border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
                  isActive
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] font-bold shadow-sm'
                    : 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.04)]'
                )}
              >
                {lh}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section: Theme */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] shrink-0" aria-hidden="true" />
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Color Theme
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map((opt) => {
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => onThemeChange(opt.value)}
                className={cn(
                  'py-2.5 px-3 text-sm font-semibold rounded-xl transition-all text-left border flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2',
                  opt.bgClass,
                  opt.textClass,
                  isActive
                    ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary)/0.2)] shadow-sm'
                    : cn(opt.borderClass, 'hover:brightness-95 dark:hover:brightness-110 opacity-80 hover:opacity-100')
                )}
              >
                <span className={cn('w-3.5 h-3.5 rounded-full border shadow-sm shrink-0', opt.dotClass)} aria-hidden="true" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section: Page Width */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Maximize className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] shrink-0" aria-hidden="true" />
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Page Width
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Page Width">
          {MARGIN_WIDTH_OPTIONS.map((opt) => {
            const isActive = marginWidth === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => onMarginWidthChange(opt.value)}
                className={cn(
                  'py-2 px-1 text-xs font-medium rounded-xl transition-all text-center border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
                  isActive
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] font-bold shadow-sm'
                    : 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.04)]'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
