/**
 * Vehicle model and storage
 * Represents inventory items synced from providers
 */
// In-memory store (in production, use database)
const vehicles = new Map();
/**
 * Upsert a vehicle (create or update)
 * Uses dealerId + providerId as unique key to prevent duplicates
 */
export function upsertVehicle(vehicle) {
    // Find existing vehicle by dealerId + providerId
    const existingVehicle = Array.from(vehicles.values()).find((v) => v.dealerId === vehicle.dealerId && v.providerId === vehicle.providerId);
    const now = new Date();
    if (existingVehicle) {
        // Update existing vehicle
        const updated = {
            ...existingVehicle,
            ...vehicle,
            id: existingVehicle.id,
            createdAt: existingVehicle.createdAt,
            updatedAt: now,
        };
        vehicles.set(updated.id, updated);
        return updated;
    }
    else {
        // Create new vehicle
        const newVehicle = {
            ...vehicle,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        };
        vehicles.set(newVehicle.id, newVehicle);
        return newVehicle;
    }
}
/**
 * Get a vehicle by ID
 */
export function getVehicle(id) {
    return vehicles.get(id);
}
export function listVehicles(filters = {}) {
    let results = Array.from(vehicles.values());
    // Filter by dealerId
    if (filters.dealerId) {
        results = results.filter((v) => v.dealerId === filters.dealerId);
    }
    // Filter by providerConnectionId
    if (filters.providerConnectionId) {
        results = results.filter((v) => v.providerConnectionId === filters.providerConnectionId);
    }
    // Filter by status
    if (filters.status) {
        results = results.filter((v) => v.status === filters.status);
    }
    // Search query
    if (filters.query) {
        const query = filters.query.toLowerCase();
        results = results.filter((v) => v.make.toLowerCase().includes(query) ||
            v.model.toLowerCase().includes(query) ||
            v.vin.toLowerCase().includes(query));
    }
    // Sort by updatedAt desc (newest first)
    results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    // Pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    return results.slice(offset, offset + limit);
}
/**
 * Count vehicles matching filters
 */
export function countVehicles(filters = {}) {
    return listVehicles({ ...filters, limit: 999999 }).length;
}
/**
 * Delete a vehicle
 */
export function deleteVehicle(id) {
    return vehicles.delete(id);
}
//# sourceMappingURL=vehicles.js.map