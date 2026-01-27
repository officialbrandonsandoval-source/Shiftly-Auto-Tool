/**
 * Vehicle model and storage
 * Represents inventory items synced from providers
 */
export interface Vehicle {
    id: string;
    dealerId: string;
    providerConnectionId: string;
    providerId: string;
    providerType: string;
    vin: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    mileage: number;
    price: number;
    condition: 'new' | 'used' | 'certified';
    bodyType?: string;
    transmission?: string;
    fuelType?: string;
    exteriorColor?: string;
    interiorColor?: string;
    description?: string;
    features?: string[];
    photos?: string[];
    status: 'available' | 'sold' | 'pending';
    createdAt: Date;
    updatedAt: Date;
    lastSyncedAt: Date;
}
/**
 * Upsert a vehicle (create or update)
 * Uses dealerId + providerId as unique key to prevent duplicates
 */
export declare function upsertVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Vehicle;
/**
 * Get a vehicle by ID
 */
export declare function getVehicle(id: string): Vehicle | undefined;
/**
 * List vehicles with optional filters
 */
export interface VehicleFilters {
    dealerId?: string;
    providerConnectionId?: string;
    status?: 'available' | 'sold' | 'pending';
    query?: string;
    limit?: number;
    offset?: number;
}
export declare function listVehicles(filters?: VehicleFilters): Vehicle[];
/**
 * Count vehicles matching filters
 */
export declare function countVehicles(filters?: VehicleFilters): number;
/**
 * Delete a vehicle
 */
export declare function deleteVehicle(id: string): boolean;
//# sourceMappingURL=vehicles.d.ts.map