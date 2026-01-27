/**
 * ListingExportScreen - export/share vehicle listing
 * Handles different export formats for iOS/Android/Web
 */

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Clipboard,
  Alert,
  Platform,
} from 'react-native'
import { listingAPI, ListingPackage } from '../api/client'

export function ListingExportScreen({ route, navigation }: any) {
  const { vehicleId, vehicleTitle } = route.params
  const [listing, setListing] = useState<ListingPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadListing()
  }, [vehicleId])

  const loadListing = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listingAPI.generate(vehicleId)
      setListing(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate listing')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!listing) return

    try {
      const shareContent = listing.plaintext
      const shareOptions: any = {
        message: shareContent,
        title: listing.title,
      }

      if (Platform.OS === 'web') {
        // Web: Copy to clipboard
        await Clipboard.setString(shareContent)
        Alert.alert('Success', 'Listing copied to clipboard!')
      } else {
        // iOS/Android: Native share sheet
        await Share.share({
          message: shareContent,
          title: listing.title,
          url: 'https://pons-auto.example.com', // Would be actual app URL
        })
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to share')
    }
  }

  const handleCopyText = async () => {
    if (!listing) return

    try {
      await Clipboard.setString(listing.plaintext)
      Alert.alert('Success', 'Listing text copied to clipboard!')
    } catch (err) {
      Alert.alert('Error', 'Failed to copy to clipboard')
    }
  }

  const handleDownloadJSON = async () => {
    if (!listing) return

    try {
      // On web, this would trigger a download
      // On mobile, we'd save to documents
      const fileName = `${listing.title.replace(/\s+/g, '-')}-listing.json`

      if (Platform.OS === 'web') {
        const element = document.createElement('a')
        const file = new Blob([listing.json], { type: 'application/json' })
        element.href = URL.createObjectURL(file)
        element.download = fileName
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        Alert.alert('Success', 'JSON downloaded!')
      } else {
        // Mobile: Copy JSON to clipboard instead
        await Clipboard.setString(listing.json)
        Alert.alert('Success', 'JSON copied to clipboard!')
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to download JSON')
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Generating listing...</Text>
      </View>
    )
  }

  if (error || !listing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error || 'Failed to generate listing'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadListing}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.subtitle}>Export & Share</Text>
      </View>

      {/* Preview */}
      <View style={styles.previewSection}>
        <Text style={styles.sectionTitle}>Preview</Text>
        <View style={styles.previewBox}>
          <Text style={styles.previewText} numberOfLines={8}>
            {listing.plaintext}
          </Text>
        </View>
      </View>

      {/* Export Options */}
      <View style={styles.optionsSection}>
        <Text style={styles.sectionTitle}>Export Options</Text>

        <TouchableOpacity style={styles.button} onPress={handleShare}>
          <Text style={styles.buttonText}>
            {Platform.OS === 'web' ? '📋 Copy to Clipboard' : '↗️ Share'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleCopyText}>
          <Text style={styles.buttonText}>📄 Copy Plain Text</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleDownloadJSON}>
          <Text style={styles.buttonText}>
            {Platform.OS === 'web' ? '⬇️ Download JSON' : '📋 Copy JSON'}
          </Text>
        </TouchableOpacity>

        {Platform.OS !== 'web' && (
          <View style={styles.info}>
            <Text style={styles.infoText}>
              💡 Tip: Use Share to send to Messages, Email, or Social Media. Copy to save for later.
            </Text>
          </View>
        )}
      </View>

      {/* Full Content */}
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>Full Content</Text>
        <View style={styles.contentBox}>
          <Text style={styles.contentText}>{listing.plaintext}</Text>
        </View>
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
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  previewSection: {
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
  previewBox: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  previewText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#333',
    fontFamily: 'Courier New',
  },
  optionsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#0c4a6e',
    lineHeight: 18,
  },
  contentSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  contentBox: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  contentText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333',
    fontFamily: 'Courier New',
  },
  spacer: {
    height: 40,
  },
})
