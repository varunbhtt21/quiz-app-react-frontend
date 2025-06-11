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

// Global cache for contest time info to avoid duplicate requests
const contestTimeCache = new Map<string, { data: ContestTimeInfo; timestamp: number }>();
const pendingContestRequests = new Map<string, Promise<ContestTimeInfo>>();
const CONTEST_CACHE_DURATION = 30000; // 30 seconds cache for contest info

export const useContestTimer = ({
  contestId,
  onTimeExpired,
  onStatusChange,
  updateInterval = 1000,
  serverSyncInterval = 30000, // Sync every 30 seconds instead of 5 minutes
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
  const failureCountRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  const lastSyncAttemptRef = useRef<number>(0);

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
    if (!contestDataRef.current) return 0;
    
    const contest = contestDataRef.current.contest;
    const start = new Date(contest.start_time).getTime();
    const end = new Date(contest.end_time).getTime();
    const now = serverNow();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [serverNow]);

  const syncWithServer = useCallback(async (): Promise<void> => {
    if (!contestId) return;

    const now = Date.now();
    
    // Prevent spam: enforce minimum 10 second interval between sync attempts
    if (now - lastSyncAttemptRef.current < 10000) {
      console.log(`[ContestTimer] Sync attempt too soon for contest ${contestId}, skipping`);
      return;
    }

    // Circuit breaker: stop trying after 5 consecutive failures
    if (failureCountRef.current >= 5) {
      console.warn(`[ContestTimer] Circuit breaker active for contest ${contestId} - too many failures, using local time`);
      return;
    }

    if (isLoadingRef.current) return;

    // Check cache first
    const cacheKey = contestId;
    const cached = contestTimeCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CONTEST_CACHE_DURATION) {
      console.log(`[ContestTimer] Using cached contest time info for ${contestId}`);
      contestDataRef.current = cached.data;
      
      // Update timer state with cached data
      const timing = cached.data.timing;
      setTimerState(prev => ({
        ...prev,
        timeToStart: timing.time_to_start_seconds,
        timeRemaining: timing.time_remaining_seconds,
        timeToEnd: timing.time_to_end_seconds,
        status: mapContestStatus(cached.data.contest.status),
        canSubmit: timing.can_submit,
        isAccessible: timing.is_accessible,
        lastUpdate: new Date(cached.timestamp),
      }));
      
      return;
    }

    // Deduplicate concurrent requests
    if (pendingContestRequests.has(cacheKey)) {
      console.log(`[ContestTimer] Request already in progress for contest ${contestId}, waiting...`);
      try {
        const contestTimeInfo = await pendingContestRequests.get(cacheKey);
        if (contestTimeInfo) {
          contestDataRef.current = contestTimeInfo;
          const timing = contestTimeInfo.timing;
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
        }
        return;
      } catch (error) {
        // If the pending request failed, continue to make a new one
      }
    }

    lastSyncAttemptRef.current = now;
    isLoadingRef.current = true;

    const requestPromise = (async (): Promise<ContestTimeInfo> => {
      try {
        // Sync server time first if not connected
        if (!isServerSynced) {
          await syncServerTime();
        }
        
        // Get contest-specific timing information
        const contestTimeInfo = await apiService.getContestTimeInfo(contestId) as ContestTimeInfo;
        
        // Cache the response
        contestTimeCache.set(cacheKey, { data: contestTimeInfo, timestamp: Date.now() });
        
        return contestTimeInfo;
      } catch (error) {
        console.error(`Failed to fetch contest time info for ${contestId}:`, error);
        throw error;
      }
    })();

    // Store the promise for deduplication
    pendingContestRequests.set(cacheKey, requestPromise);

    try {
      const contestTimeInfo = await requestPromise;
      contestDataRef.current = contestTimeInfo;

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

      // Reset failure count on success
      failureCountRef.current = 0;

    } catch (error) {
      console.error(`Failed to sync contest timer with server for ${contestId}:`, error);
      failureCountRef.current++;
      
      // Fall back to local time calculation if server sync fails
      if (contestDataRef.current) {
        updateLocalTime();
      }
    } finally {
      isLoadingRef.current = false;
      pendingContestRequests.delete(cacheKey);
    }
  }, [contestId, syncServerTime, isServerSynced, onStatusChange]);

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