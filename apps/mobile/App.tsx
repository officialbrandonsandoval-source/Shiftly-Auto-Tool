import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LoginScreen } from './src/screens/LoginScreen'
import { SignupScreen } from './src/screens/SignupScreen'
import { InventoryListScreen } from './src/screens/InventoryListScreen'
import { VehicleDetailScreen } from './src/screens/VehicleDetailScreen'
import { ListingExportScreen } from './src/screens/ListingExportScreen'
import ConnectMarketplaceScreen from './src/screens/ConnectMarketplaceScreen'
import AnalyticsScreen from './src/screens/AnalyticsScreen'
import { isLoggedIn } from './src/api/authClient'

const Stack = createNativeStackNavigator()

export default function App() {
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const loggedIn = await isLoggedIn()
        setIsAuthenticated(loggedIn)
      } catch (err) {
        console.error('Auth check failed:', err)
        setIsAuthenticated(false)
      } finally {
        setIsAuthenticating(false)
      }
    }

    checkAuth()
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
      {!isAuthenticated ? (
        // Auth Stack
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animationEnabled: true,
          }}>
          {authScreen === 'login' ? (
            <Stack.Screen
              name="Login"
              options={{ animationEnabled: false }}>
              {() => (
                <LoginScreen
                  onLoginSuccess={() => setIsAuthenticated(true)}
                  onSignupPress={() => setAuthScreen('signup')}
                />
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen
              name="Signup"
              options={{ animationEnabled: false }}>
              {() => (
                <SignupScreen
                  onSignupSuccess={() => setIsAuthenticated(true)}
                  onLoginPress={() => setAuthScreen('login')}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      ) : (
        // App Stack
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
        <Stack.Screen
          name="ConnectMarketplace"
          component={ConnectMarketplaceScreen}
          options={{ title: 'Connect Marketplace', headerShown: true }}
        />
        <Stack.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{ title: 'Analytics Dashboard', headerShown: true }}
        />
      </Stack.Navigator>
      )}
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
