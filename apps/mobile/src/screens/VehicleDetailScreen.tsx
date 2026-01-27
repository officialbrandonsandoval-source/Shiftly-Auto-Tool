/**
 * VehicleDetailScreen - displays full details of a single vehicle
 */

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native'
import { vehiclesAPI } from '../api/client'
import { Vehicle } from '../types'

export function VehicleDetailScreen({ route, navigation }: any) {
  const { vehicleId } = route.params
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadVehicle()
  }, [vehicleId])

  const loadVehicle = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await vehiclesAPI.getById(vehicleId)
      setVehicle(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicle')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage) + ' miles'
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading vehicle...</Text>
      </View>
    )
  }

  if (error || !vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error || 'Vehicle not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Image Gallery */}
      <View style={styles.imageContainer}>
        {vehicle.photos && vehicle.photos.length > 0 ? (
          <Image source={{ uri: vehicle.photos[0] }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Photo Available</Text>
          </View>
        )}
      </View>

      {/* Main Info */}
      <View style={styles.mainInfo}>
        <Text style={styles.title}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </Text>
        {vehicle.trim && <Text style={styles.trim}>{vehicle.trim}</Text>}
        
        <Text style={styles.price}>{formatPrice(vehicle.price)}</Text>

        <View style={styles.tagsRow}>
          <View style={[styles.tag, styles[`${vehicle.condition}Tag`]]}>
            <Text style={styles.tagText}>{vehicle.condition.toUpperCase()}</Text>
          </View>
          {vehicle.status !== 'available' && (
            <View style={styles.statusTag}>
              <Text style={styles.statusTagText}>{vehicle.status.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Key Specs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Specifications</Text>
        <View style={styles.specsGrid}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Mileage</Text>
            <Text style={styles.specValue}>{formatMileage(vehicle.mileage)}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>VIN</Text>
            <Text style={styles.specValue}>{vehicle.vin}</Text>
          </View>
          {vehicle.bodyType && (
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Body Type</Text>
              <Text style={styles.specValue}>{vehicle.bodyType}</Text>
            </View>
          )}
          {vehicle.transmission && (
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Transmission</Text>
              <Text style={styles.specValue}>{vehicle.transmission}</Text>
            </View>
          )}
          {vehicle.fuelType && (
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Fuel Type</Text>
              <Text style={styles.specValue}>{vehicle.fuelType}</Text>
            </View>
          )}
          {vehicle.exteriorColor && (
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Exterior</Text>
              <Text style={styles.specValue}>{vehicle.exteriorColor}</Text>
            </View>
          )}
          {vehicle.interiorColor && (
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Interior</Text>
              <Text style={styles.specValue}>{vehicle.interiorColor}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      {vehicle.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{vehicle.description}</Text>
        </View>
      )}

      {/* Features */}
      {vehicle.features && vehicle.features.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          {vehicle.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Export Button */}
      <View style={styles.exportSection}>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() =>
            navigation.navigate('ListingExport', {
              vehicleId: vehicle.id,
              vehicleTitle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            })
          }
        >
          <Text style={styles.exportButtonText}>📋 Create Listing Package</Text>
        </TouchableOpacity>
        <Text style={styles.exportHint}>Generate export-ready content for posting</Text>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  placeholderText: {
    color: '#999',
    fontSize: 18,
  },
  mainInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  trim: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newTag: {
    backgroundColor: '#dcfce7',
  },
  usedTag: {
    backgroundColor: '#fef3c7',
  },
  certifiedTag: {
    backgroundColor: '#dbeafe',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fecaca',
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991b1b',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  specsGrid: {
    gap: 16,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  specLabel: {
    fontSize: 14,
    color: '#666',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 16,
    color: '#2563eb',
    marginRight: 8,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  exportSection: {
    backgroundColor: '#e0f2fe',
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exportHint: {
    fontSize: 13,
    color: '#0c4a6e',
  },
  spacer: {
    height: 40,
  },
})
