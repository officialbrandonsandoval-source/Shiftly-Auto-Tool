import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { InventoryListScreen } from './src/screens/InventoryListScreen'
import { VehicleDetailScreen } from './src/screens/VehicleDetailScreen'
import { ListingExportScreen } from './src/screens/ListingExportScreen'
import { authAPI } from './src/api/client'

const Stack = createNativeStackNavigator()

export default function App() {
  const [isAuthenticating, setIsAuthenticating] = useState(true)

  useEffect(() => {
    // Auto-login for development
    const autoLogin = async () => {
      try {
        await authAPI.login('dealer@example.com')
      } catch (err) {
        console.error('Auto-login failed:', err)
      } finally {
        setIsAuthenticating(false)
      }
    }

    autoLogin()
  }, [])

  if (isAuthenticating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
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
})
