/**
 * VehicleCard component - displays a vehicle in list view
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Vehicle } from '../types'

interface VehicleCardProps {
  vehicle: Vehicle
  onPress: () => void
}

export function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage) + ' mi'
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        {vehicle.photos && vehicle.photos.length > 0 ? (
          <Image source={{ uri: vehicle.photos[0] }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Photo</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </Text>
        
        {vehicle.trim && (
          <Text style={styles.trim}>{vehicle.trim}</Text>
        )}
        
        <View style={styles.detailsRow}>
          <Text style={styles.price}>{formatPrice(vehicle.price)}</Text>
          <Text style={styles.mileage}>{formatMileage(vehicle.mileage)}</Text>
        </View>
        
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
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
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
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  trim: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
  },
  mileage: {
    fontSize: 14,
    color: '#666',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#fecaca',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991b1b',
  },
})
