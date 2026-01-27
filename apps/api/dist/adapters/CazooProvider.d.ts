/**
 * Cazoo Provider Adapter
 * Real integration with Cazoo wholesale API
 * https://cazoo.co.uk/api/docs
 */
import { ProviderAdapter, ProviderVehicle, ProviderCredentials } from './types.js';
export declare class CazooProvider implements ProviderAdapter {
    providerType: string;
    private baseUrl;
    private requestTimeout;
    testConnection(credentials: ProviderCredentials): Promise<boolean>;
    fetchVehicles(credentials: ProviderCredentials): Promise<ProviderVehicle[]>;
    fetchVehicle(credentials: ProviderCredentials, providerId: string): Promise<ProviderVehicle | null>;
    private makeRequest;
    private normalizeVehicle;
    private normalizeCondition;
}
//# sourceMappingURL=CazooProvider.d.ts.map