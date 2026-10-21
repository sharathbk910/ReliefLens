import type { ReportIngestionInput } from '../shared/schemas.ts';
import { dataService } from './dataService.ts';

const OFFLINE_QUEUE_KEY = 'relieflens_offline_reports_queue_v1';

export interface QueuedReport {
  id: string;
  data: ReportIngestionInput;
  queuedAt: string;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

type SyncListener = (isOnline: boolean, pendingCount: number) => void;

class OfflineSyncService {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  public isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Initial notify
    listener(this.isOnline(), this.getPendingCount());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const online = this.isOnline();
    const count = this.getPendingCount();
    this.listeners.forEach((fn) => fn(online, count));
  }

  private handleOnline = () => {
    this.notify();
    this.syncQueue();
  };

  private handleOffline = () => {
    this.notify();
  };

  public getQueue(): QueuedReport[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getPendingCount(): number {
    return this.getQueue().filter((q) => q.status === 'pending' || q.status === 'failed').length;
  }

  public enqueueReport(data: ReportIngestionInput): QueuedReport {
    const queue = this.getQueue();
    const queuedReport: QueuedReport = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      data,
      queuedAt: new Date().toISOString(),
      status: 'pending',
    };

    queue.push(queuedReport);
    this.saveQueue(queue);
    this.notify();
    return queuedReport;
  }

  private saveQueue(queue: QueuedReport[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to save offline queue to localStorage', e);
    }
  }

  public async syncQueue(syncHandler?: (report: ReportIngestionInput) => Promise<unknown>): Promise<{
    synced: number;
    failed: number;
  }> {
    if (this.isSyncing || !this.isOnline()) {
      return { synced: 0, failed: 0 };
    }

    const queue = this.getQueue();
    const pending = queue.filter((item) => item.status === 'pending' || item.status === 'failed');
    if (pending.length === 0) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        item.status = 'syncing';
        this.saveQueue(queue);
        this.notify();

        if (syncHandler) {
          await syncHandler(item.data);
        } else {
          await dataService.ingestReport(item.data);
        }

        // Successfully synced: remove from queue
        const updated = this.getQueue().filter((q) => q.id !== item.id);
        this.saveQueue(updated);
        synced++;
      } catch (err: unknown) {
        item.status = 'failed';
        item.error = err instanceof Error ? err.message : 'Sync failed';
        this.saveQueue(queue);
        failed++;
      }
    }

    this.isSyncing = false;
    this.notify();
    return { synced, failed };
  }
}

export const offlineSyncService = new OfflineSyncService();
