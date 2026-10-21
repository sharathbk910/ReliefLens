import { useState, useEffect } from 'react';
import { offlineSyncService } from '../lib/offlineSyncService.ts';

export interface OnlineStatusState {
  isOnline: boolean;
  pendingCount: number;
  syncNow: () => Promise<{ synced: number; failed: number }>;
}

/**
 * Custom hook to manage online/offline network connectivity and offline report queue state.
 */
export function useOnlineStatus(): OnlineStatusState {
  const [isOnline, setIsOnline] = useState<boolean>(() => offlineSyncService.isOnline());
  const [pendingCount, setPendingCount] = useState<number>(() => offlineSyncService.getPendingCount());

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((online, count) => {
      setIsOnline(online);
      setPendingCount(count);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const syncNow = async () => {
    return await offlineSyncService.syncQueue();
  };

  return {
    isOnline,
    pendingCount,
    syncNow,
  };
}
