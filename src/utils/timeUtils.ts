/**
 * Frontend Time Utilities for Timezone-Aware Contest System
 * Provides consistent datetime handling and formatting across the application
 */

export interface ServerTimeResponse {
  epoch_ms: number;
  iso: string;
  timezone: string;
  timestamp: number;
  formatted: string;
}

export interface ContestTimeInfo {
  server_time: {
    epoch_ms: number;
    iso: string;
    timezone: string;
  };
  contest: {
    id: string;
    name: string;
    status: string;
    start_time: string;
    end_time: string;
    duration_seconds: number;
  };
  timing: {
    time_to_start_seconds: number | null;
    time_to_end_seconds: number | null;
    time_remaining_seconds: number | null;
    is_accessible: boolean;
    can_submit: boolean;
  };
}

/**
 * Parse ISO datetime string to Date object
 */
export const parseISODateTime = (isoString: string): Date => {
  return new Date(isoString);
};

/**
 * Format datetime for display in user's timezone
 */
export const formatDateTime = (
  dateTime: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const date = typeof dateTime === 'string' ? parseISODateTime(dateTime) : dateTime;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  
  return date.toLocaleDateString(undefined, { ...defaultOptions, ...options });
};

/**
 * Format duration in seconds to human-readable string
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Format timer display (HH:MM:SS)
 */
export const formatTimer = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculate relative time (e.g., "in 5 minutes", "2 hours ago")
 */
export const getRelativeTime = (dateTime: Date | string): string => {
  const date = typeof dateTime === 'string' ? parseISODateTime(dateTime) : dateTime;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  if (diffSeconds < 60) {
    return rtf.format(diffMs > 0 ? diffSeconds : -diffSeconds, 'second');
  } else if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return rtf.format(diffMs > 0 ? minutes : -minutes, 'minute');
  } else if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return rtf.format(diffMs > 0 ? hours : -hours, 'hour');
  } else {
    const days = Math.floor(diffSeconds / 86400);
    return rtf.format(diffMs > 0 ? days : -days, 'day');
  }
};

/**
 * Check if a datetime is in the past
 */
export const isPast = (dateTime: Date | string): boolean => {
  const date = typeof dateTime === 'string' ? parseISODateTime(dateTime) : dateTime;
  return date.getTime() < Date.now();
};

/**
 * Check if a datetime is in the future
 */
export const isFuture = (dateTime: Date | string): boolean => {
  const date = typeof dateTime === 'string' ? parseISODateTime(dateTime) : dateTime;
  return date.getTime() > Date.now();
};

/**
 * Calculate time difference in seconds
 */
export const getTimeDifferenceSeconds = (
  startTime: Date | string,
  endTime: Date | string
): number => {
  const start = typeof startTime === 'string' ? parseISODateTime(startTime) : startTime;
  const end = typeof endTime === 'string' ? parseISODateTime(endTime) : endTime;
  
  return Math.floor((end.getTime() - start.getTime()) / 1000);
};

/**
 * Get contest status based on current time
 */
export const getContestStatus = (
  startTime: Date | string,
  endTime: Date | string
): 'not_started' | 'in_progress' | 'ended' => {
  const now = Date.now();
  const start = typeof startTime === 'string' ? parseISODateTime(startTime).getTime() : startTime.getTime();
  const end = typeof endTime === 'string' ? parseISODateTime(endTime).getTime() : endTime.getTime();
  
  if (now < start) {
    return 'not_started';
  } else if (now <= end) {
    return 'in_progress';
  } else {
    return 'ended';
  }
};

/**
 * Get time until contest starts (in seconds)
 */
export const getTimeToStart = (startTime: Date | string): number => {
  const start = typeof startTime === 'string' ? parseISODateTime(startTime) : startTime;
  return Math.max(0, Math.floor((start.getTime() - Date.now()) / 1000));
};

/**
 * Get time remaining in contest (in seconds)
 */
export const getTimeRemaining = (endTime: Date | string): number => {
  const end = typeof endTime === 'string' ? parseISODateTime(endTime) : endTime;
  return Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
};

/**
 * Validate if a time range is valid
 */
export const isValidTimeRange = (
  startTime: Date | string,
  endTime: Date | string
): boolean => {
  const start = typeof startTime === 'string' ? parseISODateTime(startTime) : startTime;
  const end = typeof endTime === 'string' ? parseISODateTime(endTime) : endTime;
  
  return start.getTime() < end.getTime();
};

/**
 * Format contest time range for display
 */
export const formatContestTimeRange = (
  startTime: Date | string,
  endTime: Date | string
): string => {
  const start = typeof startTime === 'string' ? parseISODateTime(startTime) : startTime;
  const end = typeof endTime === 'string' ? parseISODateTime(endTime) : endTime;
  
  const startFormatted = formatDateTime(start, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const endFormatted = formatDateTime(end, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  // If same day, show abbreviated format
  if (start.toDateString() === end.toDateString()) {
    return `${startFormatted} - ${endFormatted}`;
  } else {
    return `${startFormatted} - ${formatDateTime(end)}`;
  }
};

/**
 * Get user's timezone
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Convert UTC timestamp to user's local time
 */
export const utcToLocal = (utcTimestamp: number): Date => {
  return new Date(utcTimestamp);
};

/**
 * Get timezone offset in minutes
 */
export const getTimezoneOffset = (): number => {
  return new Date().getTimezoneOffset();
};

/**
 * Sleep utility for testing and delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Debounce utility for limiting function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), waitMs);
  };
}; 