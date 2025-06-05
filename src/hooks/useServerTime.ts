import { useState, useEffect, useCallback } from 'react';

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

export const useServerTime = (
  apiBaseUrl: string = '/api',
  autoSyncInterval: number = 300000 // 5 minutes
): UseServerTimeResult => {
  const [offset, setOffset] = useState<number>(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const syncWithServer = useCallback(async (): Promise<void> => {
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
      
      // Calculate round-trip time and server time offset
      const rtt = t1 - t0;
      const serverTime = data.epoch_ms;
      
      // Compensate for network delay (assume symmetric delay)
      const estimatedServerTime = serverTime + rtt / 2;
      const newOffset = estimatedServerTime - t1;
      
      setOffset(newOffset);
      setLastSync(new Date());
      setIsConnected(true);

      console.log(`[ServerTime] Synced with server - RTT: ${rtt}ms, Offset: ${newOffset.toFixed(2)}ms`);

    } catch (error) {
      console.error('[ServerTime] Failed to sync with server:', error);
      setIsConnected(false);
      
      // Don't reset offset completely, keep last known good offset
      // This allows the app to continue functioning even with temporary network issues
    }
  }, [apiBaseUrl]);

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