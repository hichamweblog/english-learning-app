'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  FileText,
  CheckCircle2,
  Maximize2,
  Minimize2,
  X,
  Repeat,
  Headphones,
} from 'lucide-react';
import { useAudioStore, useProgressStore } from '@/lib/store';
import { resolveMediaUrl, formatTime, cn } from '@/lib/utils';

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showRemainingTime, setShowRemainingTime] = useState(false);

  const {
    currentTrack,
    isPlaying,
    playbackRate,
    volume,
    currentTime,
    duration,
    isExpanded,
    togglePlay,
    setPlaybackRate,
    setVolume,
    setCurrentTime,
    setDuration,
    toggleExpanded,
    seek,
    closePlayer,
  } = useAudioStore();

  const { completedItems, toggleCompleted, saveItemPosition, addRecentItem } =
    useProgressStore();

  // Keyboard shortcuts for language learners: Space to play/pause, Left/Right arrows to skip, M to mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentTrack) return;
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipSeconds(-10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipSeconds(10);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === '[') {
        cycleSpeedDown();
      } else if (e.key === ']') {
        cycleSpeedUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, isPlaying, duration, currentTime, isMuted, volume]);

  // Sync track changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const audioUrl = resolveMediaUrl(currentTrack.audioPath);
    if (audioRef.current.src !== window.location.origin + audioUrl && audioRef.current.src !== audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn('Playback error:', err);
      });
    }

    addRecentItem({
      id: currentTrack.id,
      type: currentTrack.id.startsWith('reader') ? 'reader' : 'podcast',
      title: currentTrack.title,
      seriesTitle: currentTrack.seriesTitle,
      url: currentTrack.itemUrl,
    });
  }, [currentTrack, isPlaying, addRecentItem]);

  // Sync play/pause state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Loop toggle
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  if (!currentTrack) return null;

  const isCompleted = completedItems[currentTrack.id] || false;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const remainingSeconds = Math.max(0, duration - currentTime);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      if (Math.floor(time) % 5 === 0) {
        saveItemPosition(currentTrack.id, time);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (!isLooping) {
      toggleCompleted(currentTrack.id);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const targetTime = (val / 100) * duration;
    seek(targetTime);
  };

  const skipSeconds = (secs: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(audioRef.current.currentTime + secs, duration));
      seek(newTime);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume || 1);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const speeds = [0.75, 1, 1.25, 1.5, 2];

  const cycleSpeedUp = () => {
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  };

  const cycleSpeedDown = () => {
    const prevIdx = (speeds.indexOf(playbackRate) - 1 + speeds.length) % speeds.length;
    setPlaybackRate(speeds[prevIdx]);
  };

  return (
    <>
      <audio
        id="global-audio-element"
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Floating Precision Audio Deck */}
      <div
        className={cn(
          'fixed z-50 transition-all duration-300 left-1/2 -translate-x-1/2',
          'w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-w-4xl',
          'bg-[#FAF8F5]/96 dark:bg-[#14161C]/96 backdrop-blur-2xl',
          'border border-stone-300/80 dark:border-stone-800/90 shadow-[0_12px_40px_rgba(0,0,0,0.16)]',
          'rounded-2xl',
          isExpanded
            ? 'bottom-20 md:bottom-8 p-6'
            : 'bottom-16 md:bottom-6 p-3 sm:px-5'
        )}
      >
        {/* Scrub bar line */}
        <div className="relative group w-full mb-1">
          <input
            type="range"
            min="0"
            max="100"
            step="0.05"
            value={progressPercent || 0}
            onChange={handleSeekChange}
            aria-label="Seek position in track"
            className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* Row 1: Time, Metadata, Controls */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 pt-1">
          {/* Track Info & Animated Wave */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href={currentTrack.itemUrl}
              className="w-10 h-10 rounded-xl bg-stone-900 text-stone-100 dark:bg-stone-800 dark:text-stone-200 flex items-center justify-center shrink-0 border border-stone-800/30 group hover:scale-105 transition-transform"
              title="Navigate to lesson page"
            >
              {isPlaying ? (
                <div className="flex items-end gap-0.5 h-4 w-4">
                  <span className="w-0.5 bg-amber-400 rounded-full animate-wave-1" />
                  <span className="w-0.5 bg-amber-400 rounded-full animate-wave-2" />
                  <span className="w-0.5 bg-amber-400 rounded-full animate-wave-3" />
                  <span className="w-0.5 bg-amber-400 rounded-full animate-wave-4" />
                </div>
              ) : (
                <Headphones className="w-4 h-4 text-stone-400" />
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 truncate">
                  {currentTrack.seriesTitle}
                </span>
                {currentTrack.levelLabel && (
                  <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-semibold rounded bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {currentTrack.levelLabel}
                  </span>
                )}
              </div>
              <Link
                href={currentTrack.itemUrl}
                className="block text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate hover:underline"
              >
                {currentTrack.title}
              </Link>
            </div>
          </div>

          {/* Central Controls: Rewind 15s, Play/Pause, Forward 15s */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Rewind 15s */}
            <button
              type="button"
              onClick={() => skipSeconds(-15)}
              aria-label="Rewind 15 seconds (Left Arrow)"
              title="Rewind 15 seconds"
              className="relative p-2 text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 rounded-full transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-1 font-mono">
                15
              </span>
            </button>

            {/* Main Play / Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause audio (Space)' : 'Play audio (Space)'}
              className="p-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Forward 15s */}
            <button
              type="button"
              onClick={() => skipSeconds(15)}
              aria-label="Forward 15 seconds (Right Arrow)"
              title="Forward 15 seconds"
              className="relative p-2 text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 rounded-full transition-all"
            >
              <RotateCw className="w-4 h-4" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-1 font-mono">
                15
              </span>
            </button>
          </div>

          {/* Right Tools: Time Counter, Speed Pill, Looping, Volume, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Time Stamp (Click to toggle elapsed vs remaining) */}
            <button
              type="button"
              onClick={() => setShowRemainingTime(!showRemainingTime)}
              title="Toggle between elapsed and remaining time"
              className="hidden md:inline-flex text-[11px] font-mono text-stone-500 dark:text-stone-400 tabular-nums px-2 py-1 rounded hover:bg-stone-200/50 dark:hover:bg-stone-800/50"
            >
              {showRemainingTime ? `-${formatTime(remainingSeconds)}` : `${formatTime(currentTime)} / ${formatTime(duration)}`}
            </button>

            {/* Speed Selector Button */}
            <button
              type="button"
              onClick={cycleSpeedUp}
              title="Click to cycle speed ([ and ] shortcuts)"
              className="px-2 py-1 text-[11px] font-bold font-mono rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
            >
              {playbackRate}x
            </button>

            {/* Repeat/Shadowing Loop Button */}
            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              title={isLooping ? 'Turn off sentence repeat' : 'Turn on sentence repeat for shadowing practice'}
              aria-label="Toggle repeat loop"
              className={cn(
                'hidden sm:inline-flex p-1.5 rounded-lg transition-colors',
                isLooping
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60'
              )}
            >
              <Repeat className="w-4 h-4" />
            </button>

            {/* Mark Completed Button */}
            <button
              type="button"
              onClick={() => toggleCompleted(currentTrack.id)}
              aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
              title={isCompleted ? 'Completed lesson' : 'Mark as completed'}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isCompleted
                  ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60'
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>

            {/* PDF Guide Link if available */}
            {currentTrack.pdfPath && (
              <a
                href={resolveMediaUrl(currentTrack.pdfPath)}
                target="_blank"
                rel="noopener noreferrer"
                title="Open Study Guide / Transcript PDF"
                aria-label="Open Study Guide PDF"
                className="hidden sm:inline-flex p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
              </a>
            )}

            {/* Volume toggle */}
            <div className="relative hidden sm:inline-flex items-center">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 rounded-lg transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-stone-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Dismiss Player */}
            <button
              type="button"
              onClick={closePlayer}
              aria-label="Close audio player"
              title="Close player"
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
