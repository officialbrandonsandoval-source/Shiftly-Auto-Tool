import crypto from 'crypto';
import { encrypt, decrypt } from './encryption.js';
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'dev-encryption-secret-change-in-production';
// In-memory store (in production, use database)
const providerConnections = new Map();
/**
 * Creates a new provider connection with encrypted credentials
 * Credentials are encrypted immediately; never stored or logged in plaintext
 */
export function createProviderConnection(dealerId, providerType, credentials) {
    const id = crypto.randomUUID();
    // Serialize credentials to JSON, then encrypt
    const credentialsJson = JSON.stringify(credentials);
    const encrypted = encrypt(credentialsJson, ENCRYPTION_SECRET);
    const connection = {
        id,
        dealerId,
        providerType,
        encrypted,
        createdAt: new Date(),
        lastSyncedAt: null,
        lastSyncStatus: 'pending',
        lastSyncError: null,
    };
    providerConnections.set(id, connection);
    return connection;
}
/**
 * Retrieves decrypted credentials from a provider connection
 * ONLY call this when you need to actually use the credentials
 * Never return decrypted credentials to client
 */
export function getDecryptedCredentials(connectionId) {
    const connection = providerConnections.get(connectionId);
    if (!connection) {
        return null;
    }
    try {
        const decryptedJson = decrypt(connection.encrypted, ENCRYPTION_SECRET);
        return JSON.parse(decryptedJson);
    }
    catch (err) {
        console.error(`[SECURITY] Failed to decrypt credentials for connection ${connectionId}:`, err);
        return null;
    }
}
/**
 * Returns provider connection metadata WITHOUT encrypted fields
 * Safe to return to client
 */
export function getProviderConnection(connectionId) {
    const connection = providerConnections.get(connectionId);
    if (!connection) {
        return null;
    }
    // Return without encrypted field
    const { encrypted, ...safe } = connection;
    return safe;
}
/**
 * Lists all provider connections for a dealer (safe metadata only)
 */
export function listProviderConnections(dealerId) {
    return Array.from(providerConnections.values())
        .filter((c) => c.dealerId === dealerId)
        .map(({ encrypted, ...safe }) => safe);
}
/**
 * Revokes a provider connection
 * In production, mark as deleted rather than removing
 */
export function revokeProviderConnection(connectionId) {
    return providerConnections.delete(connectionId);
}
/**
 * Updates sync status after a sync attempt
 * Use this to track last sync timestamp and any errors
 */
export function updateSyncStatus(connectionId, status, error) {
    const connection = providerConnections.get(connectionId);
    if (!connection) {
        return false;
    }
    connection.lastSyncedAt = new Date();
    connection.lastSyncStatus = status;
    connection.lastSyncError = error || null;
    return true;
}
//# sourceMappingURL=providers.js.map