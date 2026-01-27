import { EncryptedData } from './encryption.js';
export interface ProviderCredentials {
    [key: string]: string;
}
export interface ProviderConnection {
    id: string;
    dealerId: string;
    providerType: string;
    encrypted: EncryptedData;
    createdAt: Date;
    lastSyncedAt: Date | null;
    lastSyncStatus: 'pending' | 'success' | 'error';
    lastSyncError: string | null;
}
/**
 * Creates a new provider connection with encrypted credentials
 * Credentials are encrypted immediately; never stored or logged in plaintext
 */
export declare function createProviderConnection(dealerId: string, providerType: string, credentials: ProviderCredentials): ProviderConnection;
/**
 * Retrieves decrypted credentials from a provider connection
 * ONLY call this when you need to actually use the credentials
 * Never return decrypted credentials to client
 */
export declare function getDecryptedCredentials(connectionId: string): ProviderCredentials | null;
/**
 * Returns provider connection metadata WITHOUT encrypted fields
 * Safe to return to client
 */
export declare function getProviderConnection(connectionId: string): Omit<ProviderConnection, 'encrypted'> | null;
/**
 * Lists all provider connections for a dealer (safe metadata only)
 */
export declare function listProviderConnections(dealerId: string): Array<Omit<ProviderConnection, 'encrypted'>>;
/**
 * Revokes a provider connection
 * In production, mark as deleted rather than removing
 */
export declare function revokeProviderConnection(connectionId: string): boolean;
/**
 * Updates sync status after a sync attempt
 * Use this to track last sync timestamp and any errors
 */
export declare function updateSyncStatus(connectionId: string, status: 'success' | 'error', error?: string): boolean;
//# sourceMappingURL=providers.d.ts.map