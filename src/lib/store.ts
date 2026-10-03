import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ActiveTrack {
  id: string;
  title: string;
  seriesTitle: string;
  audioPath: string; // e.g. "materials/..."
  pdfPath?: string | null;
  videoPath?: string | null;
  levelLabel?: string;
  itemUrl: string; // page URL to navigate back to
}

export interface RecentItem {
  id: string;
  type: 'podcast' | 'reader' | 'accent';
  title: string;
  seriesTitle: string;
  url: string;
  lastAccessed: number; // timestamp
  progressPercent?: number;
}

interface AudioPlayerState {
  currentTrack: ActiveTrack | null;
  isPlaying: boolean;
  playbackRate: number;
  volume: number;
  currentTime: number;
  duration: number;
  isExpanded: boolean;

  playTrack: (track: ActiveTrack) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleExpanded: () => void;
  seek: (seconds: number) => void;
  closePlayer: () => void;
}

interface StudyProgressState {
  completedItems: Record<string, boolean>; // id -> completed
  savedPositions: Record<string, number>; // id -> seconds
  recentItems: RecentItem[];
  theme: 'light' | 'dark' | 'system';

  toggleCompleted: (id: string) => void;
  setCompleted: (id: string, completed: boolean) => void;
  saveItemPosition: (id: string, seconds: number) => void;
  addRecentItem: (item: Omit<RecentItem, 'lastAccessed'>) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useAudioStore = create<AudioPlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  playbackRate: 1,
  volume: 1,
  currentTime: 0,
  duration: 0,
  isExpanded: false,

  playTrack: (track) => {
    const { currentTrack } = get();
    if (currentTrack?.id === track.id) {
      set({ isPlaying: true });
      return;
    }
    set({
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
    });
  },

  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
  seek: (seconds) => {
    // Handled by AudioEngine event dispatch
    const audio = document.getElementById('global-audio-element') as HTMLAudioElement | null;
    if (audio) {
      audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || 0));
    }
    set({ currentTime: seconds });
  },
  closePlayer: () => {
    const audio = document.getElementById('global-audio-element') as HTMLAudioElement | null;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    set({ currentTrack: null, isPlaying: false, currentTime: 0, duration: 0, isExpanded: false });
  },
}));

export const useProgressStore = create<StudyProgressState>()(
  persist(
    (set, get) => ({
      completedItems: {},
      savedPositions: {},
      recentItems: [],
      theme: 'system',

      toggleCompleted: (id) =>
        set((state) => ({
          completedItems: {
            ...state.completedItems,
            [id]: !state.completedItems[id],
          },
        })),

      setCompleted: (id, completed) =>
        set((state) => ({
          completedItems: {
            ...state.completedItems,
            [id]: completed,
          },
        })),

      saveItemPosition: (id, seconds) =>
        set((state) => ({
          savedPositions: {
            ...state.savedPositions,
            [id]: Math.floor(seconds),
          },
        })),

      addRecentItem: (item) =>
        set((state) => {
          const filtered = state.recentItems.filter((i) => i.id !== item.id);
          const newItem: RecentItem = {
            ...item,
            lastAccessed: Date.now(),
          };
          return {
            recentItems: [newItem, ...filtered].slice(0, 15), // keep last 15
          };
        }),

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'english-learning-progress',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
