import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves an educational material file path to a URL.
 * In development / local mode: served via Next.js public/ symlink: /materials/...
 * In production: if NEXT_PUBLIC_AUDIO_BASE_URL is set, prepends Cloudflare R2 / CDN url.
 */
export function resolveMediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  // Clean path
  const normalized = path.replace(/^\/+/, '');
  const baseUrl = process.env.NEXT_PUBLIC_AUDIO_BASE_URL;

  if (baseUrl) {
    // E.g. https://cdn.mycloudflare.com/materials/...
    return `${baseUrl.replace(/\/+$/, '')}/${encodeURI(normalized)}`;
  }

  // Local fallback: files are under public/materials/...
  return `/${encodeURI(normalized)}`;
}

/**
 * Formats seconds into M:SS or H:MM:SS
 */
export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Formats bytes into human readable MB / KB
 */
export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
