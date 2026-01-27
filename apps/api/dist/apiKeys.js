import crypto from 'crypto';
// In-memory store (in production, use database)
const apiKeys = new Map();
function hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
}
export function generateApiKey() {
    const id = crypto.randomUUID();
    const key = crypto.randomBytes(32).toString('hex');
    return { id, key };
}
export function createApiKey(name) {
    const { id, key } = generateApiKey();
    const keyHash = hashKey(key);
    apiKeys.set(id, {
        id,
        name,
        keyHash,
        createdAt: new Date(),
        revokedAt: null,
    });
    return { id, key, keyHash };
}
export function validateApiKey(key) {
    const keyHash = hashKey(key);
    for (const [id, record] of apiKeys.entries()) {
        if (record.keyHash === keyHash && !record.revokedAt) {
            return id;
        }
    }
    return null;
}
export function listApiKeys() {
    return Array.from(apiKeys.values());
}
export function revokeApiKey(id) {
    const key = apiKeys.get(id);
    if (key) {
        key.revokedAt = new Date();
        return true;
    }
    return false;
}
export function getApiKey(id) {
    return apiKeys.get(id);
}
//# sourceMappingURL=apiKeys.js.map