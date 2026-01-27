/**
 * MockProvider - Returns sample vehicles for testing
 * Unblocks UI development without real provider dependencies
 */
import { ProviderAdapter, ProviderVehicle, ProviderCredentials } from './types.js';
export declare class MockProvider implements ProviderAdapter {
    providerType: string;
    testConnection(credentials: ProviderCredentials): Promise<boolean>;
    fetchVehicles(credentials: ProviderCredentials): Promise<ProviderVehicle[]>;
    fetchVehicle(credentials: ProviderCredentials, providerId: string): Promise<ProviderVehicle | null>;
}
//# sourceMappingURL=MockProvider.d.ts.map