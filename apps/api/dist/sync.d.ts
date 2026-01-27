import { ProviderAdapter, SyncResult } from './adapters/types.js';
/**
 * Get the appropriate adapter for a provider type
 */
export declare function getAdapter(providerType: string): ProviderAdapter;
/**
 * Sync vehicles from a provider connection
 * This is idempotent - running multiple times won't create duplicates
 */
export declare function syncProviderConnection(connectionId: string, dealerId: string, adapter: ProviderAdapter, correlationId?: string): Promise<SyncResult & {
    logId: string;
}>;
//# sourceMappingURL=sync.d.ts.map