export type LearningEvent =
  | 'session_started'
  | 'session_completed'
  | 'recommendation_opened'
  | 'reinforcement_opened'
  | 'goal_updated'
  | 'media_error';

export interface LearningEventRecord {
  event: LearningEvent;
  itemId?: string;
  source?: string;
  timestamp: number;
}

const STORAGE_KEY = 'contentfirst-learning-events';

export function trackLearningEvent(
  event: LearningEvent,
  details: Omit<LearningEventRecord, 'event' | 'timestamp'> = {}
) {
  if (typeof window === 'undefined') return;
  const record: LearningEventRecord = { event, ...details, timestamp: Date.now() };
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as LearningEventRecord[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, record].slice(-500)));
  } catch (error) {
    console.warn('Unable to record learning event:', error);
  }
}
