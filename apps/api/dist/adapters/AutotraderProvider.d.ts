/**
 * Autotrader Provider Adapter
 * Real integration with Autotrader API
 * https://developer.autotrader.co.uk/
 */
import { ProviderAdapter, ProviderVehicle, ProviderCredentials } from './types.js';
export declare class AutotraderProvider implements ProviderAdapter {
    providerType: string;
    private baseUrl;
    private requestTimeout;
    testConnection(credentials: ProviderCredentials): Promise<boolean>;
    fetchVehicles(credentials: ProviderCredentials): Promise<ProviderVehicle[]>;
    fetchVehicle(credentials: ProviderCredentials, providerId: string): Promise<ProviderVehicle | null>;
    private makeRequest;
    private normalizeVehicle;
}
//# sourceMappingURL=AutotraderProvider.d.ts.map