/**
 * Cazoo Provider Adapter
 * Real integration with Cazoo wholesale API
 * https://cazoo.co.uk/api/docs
 */
export class CazooProvider {
    constructor() {
        this.providerType = 'cazoo';
        this.baseUrl = 'https://api.cazoo.co.uk';
        this.requestTimeout = 30000;
    }
    async testConnection(credentials) {
        try {
            // Test endpoint: GET /health or list inventory with limit=1
            const response = await this.makeRequest('/inventory', credentials, {
                limit: 1,
            });
            return response.status === 200 || response.items?.length >= 0;
        }
        catch (err) {
            console.error('[Cazoo] Connection test failed:', err);
            return false;
        }
    }
    async fetchVehicles(credentials) {
        try {
            // Fetch all available vehicles
            const response = await this.makeRequest('/inventory', credentials, {
                status: 'available',
                limit: 1000,
            });
            if (!response.items || !Array.isArray(response.items)) {
                throw new Error('Invalid response format from Cazoo API');
            }
            return response.items.map((item) => this.normalizeVehicle(item));
        }
        catch (err) {
            console.error('[Cazoo] Failed to fetch vehicles:', err);
            throw err;
        }
    }
    async fetchVehicle(credentials, providerId) {
        try {
            const response = await this.makeRequest(`/inventory/${providerId}`, credentials);
            if (!response || !response.id) {
                return null;
            }
            return this.normalizeVehicle(response);
        }
        catch (err) {
            console.error(`[Cazoo] Failed to fetch vehicle ${providerId}:`, err);
            return null;
        }
    }
    async makeRequest(endpoint, credentials, params) {
        const apiKey = credentials.apiKey;
        if (!apiKey) {
            throw new Error('Missing Cazoo API key');
        }
        const url = new URL(`${this.baseUrl}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    url.searchParams.append(key, String(value));
                }
            });
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`Cazoo API error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    normalizeVehicle(item) {
        return {
            providerId: item.id,
            vin: item.vin || 'UNKNOWN',
            year: item.year || new Date().getFullYear(),
            make: item.make || 'Unknown',
            model: item.model || 'Unknown',
            trim: item.trim,
            mileage: item.mileage || 0,
            price: item.price || 0,
            condition: this.normalizeCondition(item.condition),
            bodyType: item.bodyType,
            transmission: item.transmission,
            fuelType: item.fuelType,
            exteriorColor: item.exteriorColor,
            interiorColor: item.interiorColor,
            description: item.description,
            features: item.features || [],
            photos: item.photos || item.images || [],
            status: item.status === 'sold' ? 'sold' : item.status === 'pending' ? 'pending' : 'available',
        };
    }
    normalizeCondition(condition) {
        if (!condition)
            return 'used';
        const lower = condition.toLowerCase();
        if (lower.includes('new'))
            return 'new';
        if (lower.includes('certified') || lower.includes('cpo'))
            return 'certified';
        return 'used';
    }
}
//# sourceMappingURL=CazooProvider.js.map