/**
 * MockProvider - Returns sample vehicles for testing
 * Unblocks UI development without real provider dependencies
 */
export class MockProvider {
    constructor() {
        this.providerType = 'mock';
    }
    async testConnection(credentials) {
        // Mock always succeeds
        return true;
    }
    async fetchVehicles(credentials) {
        // Return sample inventory
        return [
            {
                providerId: 'mock-1',
                vin: '1HGBH41JXMN109186',
                year: 2024,
                make: 'Toyota',
                model: 'Camry',
                trim: 'SE',
                mileage: 15000,
                price: 28500,
                condition: 'used',
                bodyType: 'Sedan',
                transmission: 'Automatic',
                fuelType: 'Gasoline',
                exteriorColor: 'Silver',
                interiorColor: 'Black',
                description: 'Well-maintained 2024 Toyota Camry SE with low mileage. Single owner, clean title.',
                features: ['Backup Camera', 'Bluetooth', 'Lane Departure Warning', 'Adaptive Cruise Control'],
                photos: [
                    'https://example.com/photos/camry-1.jpg',
                    'https://example.com/photos/camry-2.jpg',
                ],
                status: 'available',
            },
            {
                providerId: 'mock-2',
                vin: '5YFBURHE5HP123456',
                year: 2023,
                make: 'Honda',
                model: 'Accord',
                trim: 'Sport',
                mileage: 22000,
                price: 26900,
                condition: 'used',
                bodyType: 'Sedan',
                transmission: 'Automatic',
                fuelType: 'Gasoline',
                exteriorColor: 'Blue',
                interiorColor: 'Gray',
                description: 'Sporty Honda Accord with premium features. Excellent condition, highway miles.',
                features: ['Sunroof', 'Heated Seats', 'Apple CarPlay', 'Android Auto', 'Sport Mode'],
                photos: [
                    'https://example.com/photos/accord-1.jpg',
                    'https://example.com/photos/accord-2.jpg',
                    'https://example.com/photos/accord-3.jpg',
                ],
                status: 'available',
            },
            {
                providerId: 'mock-3',
                vin: '1FTEW1E50KFA12345',
                year: 2025,
                make: 'Ford',
                model: 'F-150',
                trim: 'Lariat',
                mileage: 5000,
                price: 52000,
                condition: 'used',
                bodyType: 'Truck',
                transmission: 'Automatic',
                fuelType: 'Gasoline',
                exteriorColor: 'Black',
                interiorColor: 'Leather Tan',
                description: 'Nearly new F-150 Lariat with premium leather interior. Loaded with features.',
                features: [
                    '4WD',
                    'Towing Package',
                    'Panoramic Sunroof',
                    'Bang & Olufsen Audio',
                    '360 Camera',
                ],
                photos: [
                    'https://example.com/photos/f150-1.jpg',
                    'https://example.com/photos/f150-2.jpg',
                ],
                status: 'available',
            },
            {
                providerId: 'mock-4',
                vin: '5YJSA1E26JF123456',
                year: 2022,
                make: 'Tesla',
                model: 'Model S',
                trim: 'Long Range',
                mileage: 35000,
                price: 64900,
                condition: 'used',
                bodyType: 'Sedan',
                transmission: 'Automatic',
                fuelType: 'Electric',
                exteriorColor: 'White',
                interiorColor: 'Black',
                description: 'Premium electric sedan with autopilot. Extended range, recent service.',
                features: [
                    'Autopilot',
                    'Full Self-Driving Capability',
                    'Premium Audio',
                    'Glass Roof',
                    'Supercharger Access',
                ],
                photos: [
                    'https://example.com/photos/tesla-1.jpg',
                    'https://example.com/photos/tesla-2.jpg',
                    'https://example.com/photos/tesla-3.jpg',
                    'https://example.com/photos/tesla-4.jpg',
                ],
                status: 'available',
            },
            {
                providerId: 'mock-5',
                vin: 'WBAJB7C50JB123456',
                year: 2023,
                make: 'BMW',
                model: '3 Series',
                trim: '330i',
                mileage: 18000,
                price: 42500,
                condition: 'certified',
                bodyType: 'Sedan',
                transmission: 'Automatic',
                fuelType: 'Gasoline',
                exteriorColor: 'Gray',
                interiorColor: 'Red Leather',
                description: 'Certified pre-owned BMW with warranty. Sport package, premium sound system.',
                features: [
                    'Sport Package',
                    'Harman Kardon Audio',
                    'Navigation',
                    'Parking Sensors',
                    'BMW Warranty',
                ],
                photos: [
                    'https://example.com/photos/bmw-1.jpg',
                    'https://example.com/photos/bmw-2.jpg',
                ],
                status: 'available',
            },
        ];
    }
    async fetchVehicle(credentials, providerId) {
        const vehicles = await this.fetchVehicles(credentials);
        return vehicles.find((v) => v.providerId === providerId) || null;
    }
}
//# sourceMappingURL=MockProvider.js.map