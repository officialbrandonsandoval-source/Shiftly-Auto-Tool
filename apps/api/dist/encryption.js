import crypto from 'crypto';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
/**
 * Derives a key from a master secret using PBKDF2
 * Used for consistent encryption/decryption with the same master key
 */
function deriveKey(masterSecret) {
    const salt = Buffer.from(masterSecret).slice(0, SALT_LENGTH);
    return crypto.pbkdf2Sync(masterSecret, salt, 100000, 32, 'sha256');
}
/**
 * Encrypts data using AES-256-GCM
 * Returns {ciphertext, iv, tag} as hex strings
 */
export function encrypt(plaintext, masterSecret) {
    const key = deriveKey(masterSecret);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return {
        ciphertext: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
    };
}
/**
 * Decrypts AES-256-GCM encrypted data
 * Requires {ciphertext, iv, tag} as hex strings
 */
export function decrypt(encryptedData, masterSecret) {
    const key = deriveKey(masterSecret);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
//# sourceMappingURL=encryption.js.map