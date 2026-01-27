export interface ApiKey {
    id: string;
    name: string;
    keyHash: string;
    createdAt: Date;
    revokedAt: Date | null;
}
export declare function generateApiKey(): {
    id: string;
    key: string;
};
export declare function createApiKey(name: string): {
    id: string;
    key: string;
    keyHash: string;
};
export declare function validateApiKey(key: string): string | null;
export declare function listApiKeys(): ApiKey[];
export declare function revokeApiKey(id: string): boolean;
export declare function getApiKey(id: string): ApiKey | undefined;
//# sourceMappingURL=apiKeys.d.ts.map