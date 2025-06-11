import { useState, useEffect, useCallback, useRef } from 'react';
import { useServerTime } from './useServerTime';
import { apiService } from '../services/api';
import { ContestTimeInfo } from '../utils/timeUtils';

export interface ContestTimerState {
  timeToStart: number | null;
  timeRemaining: number | null;
  timeToEnd: number | null;
  status: 'not_started' | 'in_progress' | 'ended' | 'loading';
  canSubmit: boolean;
  isAccessible: boolean;
  lastUpdate: Date | null;
}

export interface UseContestTimerOptions {
  contestId: string;
  onTimeExpired?: () => void;
  onStatusChange?: (status: string) => void;
  updateInterval?: number; // milliseconds
  serverSyncInterval?: number; // milliseconds
}

export interface UseContestTimerResult extends ContestTimerState {
  syncWithServer: () => Promise<void>;
  isServerSynced: boolean;
  serverOffset: number;
  getFormattedTimeRemaining: () => string;
  getFormattedTimeToStart: () => string;
  getProgress: () => number; // 0-100 percentage
}

export const useContestTimer = ({
  contestId,
  onTimeExpired,
  onStatusChange,
  updateInterval = 1000,
  serverSyncInterval = 300000, // Sync every 5 minutes instead of every minute
}: UseContestTimerOptions): UseContestTimerResult => {
  const { serverNow, isConnected: isServerSynced, offset: serverOffset, syncWithServer: syncServerTime } = useServerTime();
  
  const [timerState, setTimerState] = useState<ContestTimerState>({
    timeToStart: null,
    timeRemaining: null,
    timeToEnd: null,
    status: 'loading',
    canSubmit: false,
    isAccessible: false,
    lastUpdate: null,
  });

  const contestDataRef = useRef<ContestTimeInfo | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string>('loading');

  const formatTime = useCallback((seconds: number): string => {
    if (seconds <= 0) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getFormattedTimeRemaining = useCallback((): string => {
    return formatTime(timerState.timeRemaining || 0);
  }, [timerState.timeRemaining, formatTime]);

  const getFormattedTimeToStart = useCallback((): string => {
    return formatTime(timerState.timeToStart || 0);
  }, [timerState.timeToStart, formatTime]);

  const getProgress = useCallback((): number => {
    if (!contestDataRef.current || timerState.status !== 'in_progress') {
      return 0;
    }

    const totalDuration = contestDataRef.current.contest.duration_seconds;
    const remaining = timerState.timeRemaining || 0;
    const elapsed = totalDuration - remaining;
    
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  }, [timerState.timeRemaining, timerState.status]);

  const syncWithServer = useCallback(async (): Promise<void> => {
    if (!contestId) return;

    try {
      // Sync server time first
      await syncServerTime();
      
      // Get contest-specific timing information
      const contestTimeInfo = await apiService.getContestTimeInfo(contestId) as ContestTimeInfo;
      contestDataRef.current = contestTimeInfo;

      const now = serverNow();
      const timing = contestTimeInfo.timing;

      // Update timer state with server data
      setTimerState(prev => ({
        ...prev,
        timeToStart: timing.time_to_start_seconds,
        timeRemaining: timing.time_remaining_seconds,
        timeToEnd: timing.time_to_end_seconds,
        status: mapContestStatus(contestTimeInfo.contest.status),
        canSubmit: timing.can_submit,
        isAccessible: timing.is_accessible,
        lastUpdate: new Date(),
      }));

      // Trigger status change callback if status changed
      const newStatus = contestTimeInfo.contest.status;
      if (newStatus !== lastStatusRef.current && onStatusChange) {
        onStatusChange(newStatus);
        lastStatusRef.current = newStatus;
      }

    } catch (error) {
      console.error('Failed to sync contest timer with server:', error);
      
      // Fall back to local time calculation if server sync fails
      if (contestDataRef.current) {
        updateLocalTime();
      }
    }
  }, [contestId, syncServerTime, serverNow, onStatusChange]);

  const mapContestStatus = (backendStatus: string): 'not_started' | 'in_progress' | 'ended' | 'loading' => {
    switch (backendStatus.toLowerCase()) {
      case 'not_started':
        return 'not_started';
      case 'in_progress':
        return 'in_progress';
      case 'ended':
        return 'ended';
      default:
        return 'loading';
    }
  };

  const updateLocalTime = useCallback(() => {
    if (!contestDataRef.current) return;

    const now = serverNow();
    const startTime = new Date(contestDataRef.current.contest.start_time).getTime();
    const endTime = new Date(contestDataRef.current.contest.end_time).getTime();

    let newStatus: 'not_started' | 'in_progress' | 'ended';
    let timeToStart: number | null = null;
    let timeRemaining: number | null = null;
    let timeToEnd: number | null = null;
    let canSubmit = false;
    let isAccessible = false;

    if (now < startTime) {
      newStatus = 'not_started';
      timeToStart = Math.max(0, Math.floor((startTime - now) / 1000));
      timeToEnd = Math.max(0, Math.floor((endTime - now) / 1000));
      isAccessible = false;
      canSubmit = false;
    } else if (now <= endTime) {
      newStatus = 'in_progress';
      timeToStart = 0;
      timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
      timeToEnd = timeRemaining;
      isAccessible = true;
      canSubmit = true;
    } else {
      newStatus = 'ended';
      timeToStart = 0;
      timeRemaining = 0;
      timeToEnd = 0;
      isAccessible = true;
      canSubmit = false;
    }

    setTimerState(prev => {
      const newState = {
        ...prev,
        timeToStart,
        timeRemaining,
        timeToEnd,
        status: newStatus,
        canSubmit,
        isAccessible,
        lastUpdate: new Date(),
      };

      // Check for time expiration
      if (prev.status === 'in_progress' && newStatus === 'ended' && onTimeExpired) {
        onTimeExpired();
      }

      return newState;
    });

    // Trigger status change callback
    if (newStatus !== lastStatusRef.current && onStatusChange) {
      onStatusChange(newStatus);
      lastStatusRef.current = newStatus;
    }
  }, [serverNow, onTimeExpired, onStatusChange]);

  // Initial sync and setup intervals
  useEffect(() => {
    if (!contestId) return;

    // Initial sync with server
    syncWithServer();

    // Set up regular local updates
    intervalRef.current = setInterval(updateLocalTime, updateInterval);

    // Set up periodic server sync
    syncIntervalRef.current = setInterval(syncWithServer, serverSyncInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [contestId, updateInterval, serverSyncInterval, syncWithServer, updateLocalTime]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  return {
    ...timerState,
    syncWithServer,
    isServerSynced,
    serverOffset,
    getFormattedTimeRemaining,
    getFormattedTimeToStart,
    getProgress,
  };
}; 