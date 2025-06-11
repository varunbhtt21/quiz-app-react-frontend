import { useState, useEffect, useCallback, useRef } from 'react';

interface ServerTimeData {
  epoch_ms: number;
  iso: string;
  timezone: string;
}

interface UseServerTimeResult {
  serverNow: () => number;
  offset: number;
  lastSync: Date | null;
  isConnected: boolean;
  syncWithServer: () => Promise<void>;
}

// Global request deduplication cache
const pendingServerTimeRequests = new Map<string, Promise<any>>();
const serverTimeCache = new Map<string, { data: ServerTimeData; timestamp: number }>();
const CACHE_DURATION = 10000; // 10 seconds cache

export const useServerTime = (
  apiBaseUrl: string = '/api',
  autoSyncInterval: number = 300000 // 5 minutes
): UseServerTimeResult => {
  const [offset, setOffset] = useState<number>(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [failureCount, setFailureCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const lastSyncAttempt = useRef<number>(0);

  const syncWithServer = useCallback(async (): Promise<void> => {
    const now = Date.now();
    
    // Prevent spam: enforce minimum 5 second interval between sync attempts
    if (now - lastSyncAttempt.current < 5000) {
      console.log('[ServerTime] Sync attempt too soon, skipping');
      return;
    }
    
    // Circuit breaker: stop trying after 5 consecutive failures
    if (failureCount >= 5) {
      console.warn('[ServerTime] Circuit breaker active - too many failures, using local time');
      return;
    }

    // Check cache first
    const cacheKey = `${apiBaseUrl}/contests/time`;
    const cached = serverTimeCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('[ServerTime] Using cached server time');
      const data = cached.data;
      const estimatedServerTime = data.epoch_ms + (now - cached.timestamp);
      const newOffset = estimatedServerTime - now;
      setOffset(newOffset);
      setLastSync(new Date(cached.timestamp));
      setIsConnected(true);
      return;
    }

    // Deduplicate concurrent requests
    if (pendingServerTimeRequests.has(cacheKey)) {
      console.log('[ServerTime] Request already in progress, waiting...');
      try {
        await pendingServerTimeRequests.get(cacheKey);
        return;
      } catch (error) {
        // If the pending request failed, continue to make a new one
      }
    }

    if (isLoading) return; // Prevent multiple simultaneous requests

    lastSyncAttempt.current = now;
    setIsLoading(true);

    const requestPromise = (async () => {
      try {
        const t0 = Date.now();
        
        const response = await fetch(`${apiBaseUrl}/contests/time`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const t1 = Date.now();

        if (!response.ok) {
          throw new Error(`Server time fetch failed: ${response.status}`);
        }

        const data: ServerTimeData = await response.json();
        
        // Cache the response
        serverTimeCache.set(cacheKey, { data, timestamp: t1 });
        
        // Calculate round-trip time and server time offset
        const rtt = t1 - t0;
        const serverTime = data.epoch_ms;
        
        // Compensate for network delay (assume symmetric delay)
        const estimatedServerTime = serverTime + rtt / 2;
        const newOffset = estimatedServerTime - t1;
        
        setOffset(newOffset);
        setLastSync(new Date(t1));
        setIsConnected(true);
        setFailureCount(0); // Reset failure count on success

        console.log(`[ServerTime] Synced with server - RTT: ${rtt}ms, Offset: ${newOffset.toFixed(2)}ms`);

      } catch (error) {
        console.error('[ServerTime] Failed to sync with server:', error);
        setIsConnected(false);
        setFailureCount(prev => prev + 1);
        
        // Don't reset offset completely, keep last known good offset
        // This allows the app to continue functioning even with temporary network issues
        throw error;
      }
    })();

    // Store the promise for deduplication
    pendingServerTimeRequests.set(cacheKey, requestPromise);

    try {
      await requestPromise;
    } finally {
      setIsLoading(false);
      pendingServerTimeRequests.delete(cacheKey);
    }
  }, [apiBaseUrl, isLoading, failureCount]);

  const serverNow = useCallback((): number => {
    return Date.now() + offset;
  }, [offset]);

  // Initial sync and periodic re-sync
  useEffect(() => {
    // Initial sync
    syncWithServer();

    // Set up periodic sync if interval is provided
    if (autoSyncInterval > 0) {
      const intervalId = setInterval(syncWithServer, autoSyncInterval);
      return () => clearInterval(intervalId);
    }
  }, [syncWithServer, autoSyncInterval]);

  return {
    serverNow,
    offset,
    lastSync,
    isConnected,
    syncWithServer,
  };
}; 