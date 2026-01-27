/**
 * Sync logs - tracks all sync attempts for diagnostics
 * Helps dealers diagnose why inventory isn't syncing
 */
export interface SyncLog {
    id: string;
    connectionId: string;
    dealerId: string;
    providerType: string;
    status: 'pending' | 'running' | 'success' | 'error';
    vehiclesImported: number;
    vehiclesUpdated: number;
    totalVehicles: number;
    startedAt: Date;
    completedAt: Date | null;
    error: string | null;
    correlationId: string;
    duration: number | null;
}
/**
 * Create a new sync log entry
 */
export declare function createSyncLog(connectionId: string, dealerId: string, providerType: string, correlationId: string): SyncLog;
/**
 * Update a sync log after completion
 */
export declare function completeSyncLog(logId: string, status: 'success' | 'error', vehiclesImported: number, vehiclesUpdated: number, totalVehicles: number, error?: string): SyncLog | null;
/**
 * Get a specific sync log
 */
export declare function getSyncLog(logId: string): SyncLog | undefined;
/**
 * Get sync logs by connection ID
 */
export declare function getSyncLogsByConnection(connectionId: string, limit?: number): SyncLog[];
/**
 * Get sync logs by dealer ID
 */
export declare function getSyncLogsByDealer(dealerId: string, limit?: number): SyncLog[];
/**
 * Get last sync status for a connection
 */
export declare function getLastSyncStatus(connectionId: string): SyncLog | null;
/**
 * Log with correlation ID for debugging
 */
export declare function logWithCorrelation(correlationId: string, level: string, message: string, data?: any): void;
//# sourceMappingURL=syncLogs.d.ts.map