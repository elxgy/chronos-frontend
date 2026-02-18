import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ConnectionQuality } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function extractPlaylistId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]{13,50})/,
    /(?:youtube\.com\/watch\?.*list=)([a-zA-Z0-9_-]{13,50})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function parseYouTubeInput(
  url: string
): { videoId?: string; playlistId?: string } {
  const trimmed = url.trim();
  const playlistId = extractPlaylistId(trimmed);
  const videoId = extractVideoId(trimmed);
  if (playlistId) return { playlistId };
  if (videoId) return { videoId };
  return {};
}

export function getQualityColor(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent':
      return 'text-green-400';
    case 'good':
      return 'text-primary-400';
    case 'fair':
      return 'text-yellow-400';
    case 'poor':
      return 'text-red-400';
    default:
      return 'text-dark-400';
  }
}

export function getQualityBgColor(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent':
      return 'bg-green-500/20 border-green-500/30';
    case 'good':
      return 'bg-primary-500/20 border-primary-500/30';
    case 'fair':
      return 'bg-yellow-500/20 border-yellow-500/30';
    case 'poor':
      return 'bg-red-500/20 border-red-500/30';
    default:
      return 'bg-dark-700/50 border-dark-600';
  }
}

export function getQualityLabel(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'fair':
      return 'Fair';
    case 'poor':
      return 'Poor';
    default:
      return 'Unknown';
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
