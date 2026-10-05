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
  type: 'podcast' | 'reader' | 'accent' | 'reference';
  title: string;
  seriesTitle: string;
  url: string;
  lastAccessed: number; // timestamp
  progressPercent?: number;
}

export type ComfortRating = 'too-hard' | 'challenging' | 'comfortable' | 'easy';

export interface SavedNote {
  id: string;
  term?: string;
  definition?: string;
  note: string;
  sourceTitle: string;
  sourceUrl: string;
  createdAt: number;
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
  dailyGoalMinutes: number;
  learningGoal: 'conversation' | 'speaking' | 'reading' | 'pronunciation' | 'vocabulary' | null;
  exposureSecondsByDate: Record<string, number>;
  comfortRatings: Record<string, ComfortRating>;
  savedNotes: SavedNote[];

  toggleCompleted: (id: string) => void;
  setCompleted: (id: string, completed: boolean) => void;
  saveItemPosition: (id: string, seconds: number) => void;
  addRecentItem: (item: Omit<RecentItem, 'lastAccessed'>) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDailyGoalMinutes: (minutes: number) => void;
  setLearningGoal: (goal: StudyProgressState['learningGoal']) => void;
  addExposureSeconds: (seconds: number, date?: string) => void;
  setComfortRating: (id: string, rating: ComfortRating) => void;
  addSavedNote: (note: Omit<SavedNote, 'id' | 'createdAt'>) => void;
  removeSavedNote: (id: string) => void;
}

export interface ReadingSettingsState {
  fontSize: number;
  lineHeight: number;
  theme: 'default' | 'sepia' | 'ocean' | 'night';
  marginWidth: 'narrow' | 'comfortable' | 'wide';
  setFontSize: (size: number) => void;
  setLineHeight: (lh: number) => void;
  setTheme: (theme: 'default' | 'sepia' | 'ocean' | 'night') => void;
  setMarginWidth: (width: 'narrow' | 'comfortable' | 'wide') => void;
}

export const useReadingSettingsStore = create<ReadingSettingsState>()(
  persist(
    (set) => ({
      fontSize: 24,
      lineHeight: 1.75,
      theme: 'default',
      marginWidth: 'comfortable',
      setFontSize: (fontSize) => set({ fontSize }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setTheme: (theme) => set({ theme }),
      setMarginWidth: (marginWidth) => set({ marginWidth }),
    }),
    {
      name: 'reading-settings-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

export const useAudioStore = create<AudioPlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  playbackRate: 1,
  volume: 1,
  currentTime: 0,
  duration: 0,
  isExpanded: true,

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
      isExpanded: true,
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
      dailyGoalMinutes: 10,
      learningGoal: null,
      exposureSecondsByDate: {},
      comfortRatings: {},
      savedNotes: [],

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
      setDailyGoalMinutes: (minutes) =>
        set({ dailyGoalMinutes: Math.max(5, Math.min(120, Math.round(minutes))) }),
      setLearningGoal: (learningGoal) => set({ learningGoal }),
      addExposureSeconds: (seconds, date = new Date().toISOString().slice(0, 10)) =>
        set((state) => ({
          exposureSecondsByDate: {
            ...state.exposureSecondsByDate,
            [date]: (state.exposureSecondsByDate[date] || 0) + Math.max(0, Math.floor(seconds)),
          },
        })),
      setComfortRating: (id, rating) =>
        set((state) => ({
          comfortRatings: { ...state.comfortRatings, [id]: rating },
        })),
      addSavedNote: (note) =>
        set((state) => ({
          savedNotes: [
            {
              ...note,
              id: `${note.sourceUrl}-${note.term || note.note.slice(0, 24)}-${Date.now()}`,
              createdAt: Date.now(),
            },
            ...state.savedNotes,
          ].slice(0, 100),
        })),
      removeSavedNote: (id) =>
        set((state) => ({
          savedNotes: state.savedNotes.filter((note) => note.id !== id),
        })),
    }),
    {
      name: 'english-learning-progress',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
