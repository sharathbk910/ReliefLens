import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { offlineSyncService } from '../../lib/offlineSyncService.ts';
import { useToast } from '../ui/Toast.tsx';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(offlineSyncService.isOnline());
  const [pendingCount, setPendingCount] = useState(offlineSyncService.getPendingCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((online, count) => {
      setIsOnline(online);
      setPendingCount(count);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.warning('Still Offline', 'Connect to internet or cell network to sync pending reports.');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await offlineSyncService.syncQueue();
      if (result.synced > 0) {
        toast.success(
          'Offline Queue Synced',
          `Successfully uploaded ${result.synced} report${result.synced > 1 ? 's' : ''}.`
        );
      } else if (result.failed > 0) {
        toast.error('Sync Incomplete', `${result.failed} report(s) failed to sync. Will retry automatically.`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Only render banner if offline OR if there are pending reports awaiting sync
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`px-4 py-2 text-xs flex items-center justify-between border-b transition-colors select-none ${
        !isOnline
          ? 'bg-amber-950/40 border-amber-600/30 text-amber-200'
          : 'bg-emerald-950/30 border-emerald-600/30 text-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          {!isOnline ? (
            <span>
              <strong className="font-semibold">Offline Mode Active:</strong> You are currently disconnected. Reports will queue safely in device storage and automatically sync when connectivity returns.
            </span>
          ) : (
            <span>
              <strong className="font-semibold">Online Reconnected:</strong> {pendingCount} offline report{pendingCount > 1 ? 's' : ''} queued and ready for sync.
            </span>
          )}
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30">
              {pendingCount} Pending
            </span>
            {isOnline && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
