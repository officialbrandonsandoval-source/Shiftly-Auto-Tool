export interface EncryptedData {
    ciphertext: string;
    iv: string;
    tag: string;
}
/**
 * Encrypts data using AES-256-GCM
 * Returns {ciphertext, iv, tag} as hex strings
 */
export declare function encrypt(plaintext: string, masterSecret: string): EncryptedData;
/**
 * Decrypts AES-256-GCM encrypted data
 * Requires {ciphertext, iv, tag} as hex strings
 */
export declare function decrypt(encryptedData: EncryptedData, masterSecret: string): string;
//# sourceMappingURL=encryption.d.ts.map