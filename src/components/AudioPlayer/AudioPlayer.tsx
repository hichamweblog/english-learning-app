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

  const { toggleCompleted, completedItems, saveItemPosition } = useProgressStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  // Sync volume & rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.loop = isLooping;
    }
  }, [volume, playbackRate, isLooping]);

  // Load new track source
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const url = resolveMediaUrl(currentTrack.audioPath);
      // Avoid reloading if it's the same URL
      if (!audioRef.current.src.endsWith(url)) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
      
      if (isPlaying) {
        audioRef.current.play().catch((e) => {
          console.error('Audio auto-play failed:', e);
          pause();
        });
      } else {
        audioRef.current.pause();
      }
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
      if (Math.floor(audioRef.current.currentTime) % 5 === 0 && currentTrack) {
        saveItemPosition(currentTrack.id, audioRef.current.currentTime);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (currentTrack && !isLooping) {
      if (!completedItems[currentTrack.id]) {
        toggleCompleted(currentTrack.id);
      }
      pause();
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
        onEnded={handleEnded}
        preload="auto"
      />
      {currentTrack && (

      <div
        className={cn(
          'fixed z-50 transition-all duration-300 ease-out left-1/2 -translate-x-1/2 frosted-glass rounded-2xl overflow-hidden',
          'w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)]',
          isExpanded
            ? 'bottom-6 md:bottom-8 max-w-3xl p-5 sm:p-6'
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

        <div className={cn("flex", isExpanded ? "flex-col gap-5" : "flex-row items-center justify-between h-full w-full gap-3")}>
          
          {/* Track Info */}
          <div className={cn("flex items-center min-w-0", isExpanded ? "justify-between" : "flex-1")}>
            <div className="flex items-center gap-3 min-w-0">
              <button 
                onClick={togglePlay}
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
                
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                  <button
                    onClick={() => seek(currentTime - 10)}
                    className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    aria-label="Rewind 10 seconds"
                  >
                    <SkipBack className="w-5 h-5 fill-current" />
                  </button>
                  
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-[hsl(var(--foreground))] text-[hsl(var(--background))] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                  </button>
                  
                  <button
                    onClick={() => seek(currentTime + 10)}
                    className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
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
              <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border))]">
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
