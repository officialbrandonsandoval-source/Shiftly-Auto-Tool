import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { useNavigation } from '@react-navigation/native'

/**
 * ConnectMarketplaceScreen
 * Allows dealers to connect their Facebook account to the app
 * for automated posting to Facebook Marketplace
 */

const ConnectMarketplaceScreen: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [fbUserId, setFbUserId] = useState<string | null>(null)
  const navigation = useNavigation()
  const { width } = useWindowDimensions()

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // Note: In production, this would use deep linking or native OAuth flow
      // For now, we'll show the OAuth URL
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'
      const oauthUrl = `${API_BASE_URL}/auth/marketplace/facebook`

      // Open Facebook OAuth flow in browser
      const result = await WebBrowser.openAuthSessionAsync(oauthUrl)

      if (result.type === 'success') {
        // Handle successful connection
        setIsConnected(true)
        // In production, extract connectionId from deep link or query params
        setConnectionId('fb-connection-' + Date.now())
        setFbUserId('user-' + Date.now())
        Alert.alert('Success', 'Facebook Marketplace connected! You can now post vehicles.')
      } else if (result.type === 'cancel') {
        Alert.alert('Cancelled', 'Facebook connection cancelled.')
      } else if (result.type === 'locked') {
        Alert.alert('Error', 'Browser not available. Please try again.')
      }
    } catch (error) {
      console.error('Failed to connect to Facebook:', error)
      Alert.alert('Error', 'Failed to connect to Facebook. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    Alert.alert('Disconnect Facebook?', 'You will no longer be able to post to Facebook Marketplace.', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Disconnect',
        onPress: () => {
          setIsConnected(false)
          setConnectionId(null)
          setFbUserId(null)
          Alert.alert('Disconnected', 'Facebook Marketplace disconnected.')
        },
        style: 'destructive',
      },
    ])
  }

  const handleStartPosting = () => {
    if (!isConnected || !connectionId) {
      Alert.alert('Error', 'Please connect to Facebook first.')
      return
    }
    // Navigate to inventory list to start posting
    navigation.navigate('InventoryList' as never)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Facebook Marketplace</Text>
        <Text style={styles.subtitle}>Post your vehicles directly to Facebook Marketplace</Text>
      </View>

      {/* Info Card */}
      <View style={[styles.infoCard, { width: Math.min(width - 32, 500) }]}>
        <Text style={styles.infoTitle}>Why connect?</Text>
        <Text style={styles.infoBullet}>• Post vehicles one-click directly to Facebook</Text>
        <Text style={styles.infoBullet}>• Automatic listing generation with AI</Text>
        <Text style={styles.infoBullet}>• Track views, clicks, and leads in real-time</Text>
        <Text style={styles.infoBullet}>• Reach millions of potential buyers</Text>
      </View>

      {/* Connection Status */}
      {isConnected && fbUserId ? (
        <View style={[styles.connectedCard, { width: Math.min(width - 32, 500) }]}>
          <Text style={styles.connectedStatus}>✓ Connected</Text>
          <Text style={styles.connectedUser}>Facebook User ID: {fbUserId.substring(0, 10)}...</Text>
          <Text style={styles.connectedNote}>You can now post vehicles to Facebook Marketplace</Text>
        </View>
      ) : (
        <View style={[styles.disconnectedCard, { width: Math.min(width - 32, 500) }]}>
          <Text style={styles.disconnectedStatus}>Not Connected</Text>
          <Text style={styles.disconnectedNote}>Connect your Facebook account to get started</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={[styles.buttonContainer, { width: Math.min(width - 32, 500) }]}>
        {!isConnected ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleConnect}
            disabled={isConnecting}
            activeOpacity={0.7}
          >
            {isConnecting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Connect Facebook Account</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleStartPosting} activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>Start Posting Vehicles</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleDisconnect} activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Features Grid */}
      <View style={[styles.featuresGrid, { width: Math.min(width - 32, 500) }]}>
        <Text style={styles.featuresTitle}>Key Features</Text>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>⚡</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureItemTitle}>One-Click Posting</Text>
            <Text style={styles.featureItemDesc}>Post any vehicle in seconds</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🤖</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureItemTitle}>AI-Generated Listings</Text>
            <Text style={styles.featureItemDesc}>Smart copy optimized for Facebook</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📊</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureItemTitle}>Live Analytics</Text>
            <Text style={styles.featureItemDesc}>Track views, clicks, and leads</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📱</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureItemTitle}>Mobile-First</Text>
            <Text style={styles.featureItemDesc}>Works on iOS, Android, and web</Text>
          </View>
        </View>
      </View>

      {/* FAQ Section */}
      <View style={[styles.faqSection, { width: Math.min(width - 32, 500) }]}>
        <Text style={styles.faqTitle}>FAQ</Text>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Is my data secure?</Text>
          <Text style={styles.faqAnswer}>
            Your Facebook credentials are encrypted and stored securely. We never store your password.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Can I disconnect anytime?</Text>
          <Text style={styles.faqAnswer}>
            Yes, you can disconnect your Facebook account at any time. Your posts will remain on Facebook.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>What data do you access?</Text>
          <Text style={styles.faqAnswer}>
            We only access marketplace management permissions to post and track your listings.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#1877f2',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1877f2',
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 14,
    color: '#333333',
    marginVertical: 4,
    lineHeight: 20,
  },
  connectedCard: {
    backgroundColor: '#d4edda',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  connectedStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 8,
  },
  connectedUser: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 8,
    fontFamily: 'Menlo',
  },
  connectedNote: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 18,
  },
  disconnectedCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  disconnectedStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  disconnectedNote: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 18,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#1877f2',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresGrid: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureItemDesc: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  faqSection: {
    marginBottom: 32,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 18,
  },
})

export default ConnectMarketplaceScreen
