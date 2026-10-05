'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  FileText,
  CheckCircle2,
  Repeat,
  ChevronUp,
  ChevronDown,
  MonitorPlay,
  FastForward,
} from 'lucide-react';
import { useAudioStore, useProgressStore } from '@/lib/store';
import { resolveMediaUrl, formatTime, cn } from '@/lib/utils';
import { trackLearningEvent } from '@/lib/analytics';

export function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    playbackRate,
    volume,
    currentTime,
    duration,
    isExpanded,
    playTrack,
    pause,
    resume,
    togglePlay,
    setPlaybackRate,
    setVolume,
    setCurrentTime,
    setDuration,
    toggleExpanded,
    seek,
    closePlayer,
  } = useAudioStore();

  const { toggleCompleted, completedItems, saveItemPosition, addExposureSeconds } = useProgressStore();
  const savedPositions = useProgressStore((state) => state.savedPositions);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSavedSecondRef = useRef<number | null>(null);
  const restoredTrackRef = useRef<string | null>(null);
  const lastExposureSecondRef = useRef<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [showVolume, setShowVolume] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (!sleepMinutes || !isPlaying) return;
    const timer = window.setTimeout(() => {
      pause();
      setSleepMinutes(0);
    }, sleepMinutes * 60 * 1000);
    return () => window.clearTimeout(timer);
  }, [sleepMinutes, isPlaying, pause]);

  // Sync volume & rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.loop = isLooping;
    }
  }, [volume, playbackRate, isLooping]);

  // Load a new source only when the selected track changes. Keeping this
  // separate from play/pause avoids resetting the media element on every
  // control click.
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      setMediaError(false);
      setJustCompleted(false);
      const url = resolveMediaUrl(currentTrack.audioPath);
      if (audioRef.current.dataset.trackUrl !== url) {
        audioRef.current.dataset.trackUrl = url;
        audioRef.current.src = url;
        audioRef.current.load();
      }
    }
    lastSavedSecondRef.current = null;
    lastExposureSecondRef.current = null;
    restoredTrackRef.current = null;
  }, [currentTrack]);

  // Reflect the store's transport state without changing the source.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      void audio.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Audio playback failed:', error);
        pause();
      });
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying, pause]);

  // Media Session API for OS integration
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: 'ContentFirst',
        album: currentTrack.seriesTitle,
      });

      navigator.mediaSession.setActionHandler('play', resume);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (audioRef.current) seek(audioRef.current.currentTime - 10);
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (audioRef.current) seek(audioRef.current.currentTime + 10);
      });
    }
  }, [currentTrack, resume, pause, seek]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inside inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (audioRef.current) seek(audioRef.current.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (audioRef.current) seek(audioRef.current.currentTime + 10);
          break;
        case 'KeyM':
          e.preventDefault();
          setVolume(volume === 0 ? 1 : 0);
          break;
        case 'BracketRight': // ] increase speed
          e.preventDefault();
          setPlaybackRate(Math.min(2, playbackRate + 0.25));
          break;
        case 'BracketLeft': // [ decrease speed
          e.preventDefault();
          setPlaybackRate(Math.max(0.5, playbackRate - 0.25));
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seek, volume, setVolume, playbackRate, setPlaybackRate]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      
      // Save position every ~5 seconds to prevent hammering store
      const currentSecond = Math.floor(audioRef.current.currentTime);
      if (
        currentSecond > 0 &&
        currentSecond !== lastExposureSecondRef.current &&
        currentSecond % 5 === 0 &&
        currentTrack
      ) {
        lastExposureSecondRef.current = currentSecond;
        addExposureSeconds(5);
      }
      if (
        currentSecond > 0 &&
        currentSecond % 5 === 0 &&
        currentSecond !== lastSavedSecondRef.current &&
        currentTrack
      ) {
        lastSavedSecondRef.current = currentSecond;
        saveItemPosition(currentTrack.id, audioRef.current.currentTime);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      const savedPosition = currentTrack ? savedPositions[currentTrack.id] : undefined;
      if (
        currentTrack &&
        restoredTrackRef.current !== currentTrack.id &&
        savedPosition !== undefined &&
        Number.isFinite(savedPosition) &&
        savedPosition > 0 &&
        savedPosition < audioRef.current.duration
      ) {
        audioRef.current.currentTime = savedPosition;
        setCurrentTime(savedPosition);
        restoredTrackRef.current = currentTrack.id;
      }
    }
  };

  const handleEnded = () => {
    if (currentTrack && !isLooping) {
      if (!completedItems[currentTrack.id]) {
        toggleCompleted(currentTrack.id);
      }
      setJustCompleted(true);
      trackLearningEvent('session_completed', { itemId: currentTrack.id, source: currentTrack.itemUrl });
      pause();
    }
  };

  const handleMediaError = () => {
    setMediaError(true);
    setJustCompleted(false);
    if (currentTrack) trackLearningEvent('media_error', { itemId: currentTrack.id, source: currentTrack.itemUrl });
    pause();
  };

  const retryAudio = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    setMediaError(false);
    audio.load();
    resume();
  };

  const handleCanPlay = () => {
    if (isPlaying && audioRef.current?.paused) {
      void audioRef.current.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Audio playback failed:', error);
        pause();
      });
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    const newTime = (percent / 100) * duration;
    seek(newTime);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isCompleted = currentTrack ? (completedItems[currentTrack.id] || false) : false;
  
  // Theme coloring based on content type
  const isReader = currentTrack?.itemUrl.includes('/readers');
  const accentColor = isReader ? 'text-[hsl(var(--reader-green))]' : 'text-[hsl(var(--podcast-sienna))]';
  const accentBg = isReader ? 'bg-[hsl(var(--reader-green))]' : 'bg-[hsl(var(--podcast-sienna))]';

  return (
    <>
      <audio
        id="global-audio-element"
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={handleMediaError}
        preload="auto"
      />
      {currentTrack && (

      <div
        className={cn(
          'fixed z-50 transition-all duration-300 ease-out left-1/2 -translate-x-1/2 frosted-glass rounded-2xl overflow-hidden',
          'w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)]',
          isExpanded
            ? 'bottom-3 md:bottom-4 max-w-2xl p-3 sm:p-4'
            : 'bottom-4 md:bottom-6 max-w-xl py-2 px-3 sm:px-4 flex flex-col h-14'
        )}
      >
        {/* Scrub bar — thin line at top when collapsed, standard slider when expanded */}
        {isExpanded ? (
          <div className="relative group w-full mb-4 px-1">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progressPercent}
              onChange={handleSeekChange}
              aria-label="Seek position"
              className={cn("w-full h-1.5 rounded-full appearance-none cursor-pointer", accentBg)}
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) ${progressPercent}%, hsl(var(--muted)) ${progressPercent}%)`
              }}
            />
          </div>
        ) : (
          <div className="absolute top-0 left-0 right-0 h-1 bg-[hsl(var(--muted))] cursor-pointer group" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            seek((clickX / rect.width) * duration);
          }}>
            <div 
              className={cn("h-full transition-all group-hover:h-1.5", accentBg)} 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        )}

        <div className={cn("flex", isExpanded ? "flex-col gap-3" : "flex-row items-center justify-between h-full w-full gap-3")}>
          
          {/* Track Info */}
          <div className={cn("flex items-center min-w-0", isExpanded ? "justify-between" : "flex-1")}>
            <div className="flex items-center gap-3 min-w-0">
              <button 
                onClick={togglePlay}
                type="button"
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                className={cn(
                  "flex items-center justify-center shrink-0 transition-all",
                  isExpanded 
                    ? "hidden"
                    : "w-8 h-8 rounded-lg hover:bg-[hsl(var(--foreground)/0.06)]"
                )}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              
              <div className="min-w-0 flex flex-col justify-center">
                <Link
                  href={currentTrack.itemUrl}
                  className="font-serif font-medium text-[hsl(var(--foreground))] hover:underline truncate block leading-tight text-[15px]"
                >
                  {currentTrack.title}
                </Link>
                {mediaError && (
                  <div role="alert" className="flex items-center gap-2 text-[10px] text-rose-700">
                    <span>Audio unavailable.</span>
                    <button type="button" onClick={retryAudio} className="font-bold underline underline-offset-2">
                      Try again
                    </button>
                  </div>
                )}
                {justCompleted && !mediaError && (
                  <span role="status" className="text-[10px] text-[hsl(var(--primary))]">
                    Session complete · choose a review or continue from the lesson page.
                  </span>
                )}
                {isExpanded && (
                  <span className="text-xs font-sans text-[hsl(var(--muted-foreground))] mt-0.5 truncate">
                    {currentTrack.seriesTitle} {currentTrack.levelLabel && `· ${currentTrack.levelLabel}`}
                  </span>
                )}
              </div>
            </div>

            {/* Time / Expand toggle for collapsed view */}
            {!isExpanded && (
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] w-9 text-right hidden sm:block">
                  {formatTime(currentTime)}
                </span>
                <div className="h-4 w-px bg-[hsl(var(--border))]" />
                <button
                  type="button"
                  onClick={toggleExpanded}
                  className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Controls — only visible when expanded */}
          {isExpanded && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">
                  {formatTime(currentTime)}
                </span>
                
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  <button
                    onClick={() => seek(currentTime - 10)}
                    className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    aria-label="Rewind 10 seconds"
                  >
                    <SkipBack className="w-5 h-5 fill-current" />
                  </button>
                  
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-[hsl(var(--foreground))] text-[hsl(var(--background))] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                  </button>
                  
                  <button
                    onClick={() => seek(currentTime + 10)}
                    className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    aria-label="Skip forward 10 seconds"
                  >
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>
                </div>
                
                <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))] text-right">
                  -{formatTime(duration - currentTime)}
                </span>
              </div>

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between pt-1 border-t border-[hsl(var(--border))]">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const rates = [0.75, 1, 1.25, 1.5, 2];
                      const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
                      setPlaybackRate(next);
                    }}
                    className="px-2 py-1 rounded text-[11px] font-mono font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.06)] transition-colors w-10 text-center"
                  >
                    {playbackRate}x
                  </button>
                  
                  <button
                    onClick={() => setIsLooping(!isLooping)}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      isLooping ? accentColor + " bg-[hsl(var(--foreground)/0.06)]" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    )}
                    aria-label="Toggle loop"
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                  <label className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                    <span className="hidden sm:inline">Sleep</span>
                    <select
                      aria-label="Sleep timer"
                      value={sleepMinutes}
                      onChange={(event) => setSleepMinutes(Number(event.target.value))}
                      className="rounded border border-[hsl(var(--border))] bg-transparent px-1.5 py-1 text-[11px] text-[hsl(var(--foreground))]"
                    >
                      <option value={0}>Off</option>
                      <option value={15}>15m</option>
                      <option value={30}>30m</option>
                      <option value={60}>60m</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCompleted(currentTrack.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors",
                      isCompleted 
                        ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]" 
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--foreground)/0.06)] hover:text-[hsl(var(--foreground))]"
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Completed</span>
                  </button>
                  
                  <div className="h-4 w-px bg-[hsl(var(--border))]" />
                  
                  <button
                    onClick={toggleExpanded}
                    className="p-1.5 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={closePlayer}
                    className="p-1.5 rounded text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </>
  );
}
