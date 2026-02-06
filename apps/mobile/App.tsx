import React, { useEffect, useState, useCallback } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { InventoryListScreen } from './src/screens/InventoryListScreen'
import { VehicleDetailScreen } from './src/screens/VehicleDetailScreen'
import { ListingExportScreen } from './src/screens/ListingExportScreen'
import { authAPI } from './src/api/client'

const Stack = createNativeStackNavigator()

export default function App() {
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const autoLogin = useCallback(async () => {
    setIsAuthenticating(true)
    setAuthError(null)
    try {
      await authAPI.login('dealer@example.com')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Auto-login failed:', message)
      setAuthError(`Could not connect to API server: ${message}`)
    } finally {
      setIsAuthenticating(false)
    }
  }, [])

  useEffect(() => {
    autoLogin()
  }, [autoLogin])

  if (isAuthenticating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Signing in...</Text>
      </View>
    )
  }

  if (authError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Login Failed</Text>
        <Text style={styles.errorText}>{authError}</Text>
        <Text style={styles.hintText}>
          Make sure the API server is running:{'\n'}pnpm -C apps/api dev
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={autoLogin}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="InventoryList"
          component={InventoryListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VehicleDetail"
          component={VehicleDetailScreen}
          options={{ title: 'Vehicle Details' }}
        />
        <Stack.Screen
          name="ListingExport"
          component={ListingExportScreen}
          options={{ title: 'Export Listing' }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
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
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  hintText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
