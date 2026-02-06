import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LoginScreen } from './src/screens/LoginScreen'
import { NameSelectScreen } from './src/screens/NameSelectScreen'
import { InventoryListScreen } from './src/screens/InventoryListScreen'
import { VehicleDetailScreen } from './src/screens/VehicleDetailScreen'
import { ListingExportScreen } from './src/screens/ListingExportScreen'
import { setApiKey } from './src/api/client'
import { getApiKey, getSelectedName } from './src/storage'

type AppPhase = 'loading' | 'login' | 'name-select' | 'dashboard'

const Stack = createNativeStackNavigator()

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('loading')
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  // On mount, check if we already have a saved API key + name
  useEffect(() => {
    ;(async () => {
      const savedKey = await getApiKey()
      if (savedKey) {
        setApiKey(savedKey)
        setApiKeyState(savedKey)

        const savedName = await getSelectedName()
        if (savedName) {
          setUserName(savedName)
          setPhase('dashboard')
        } else {
          setPhase('name-select')
        }
      } else {
        setPhase('login')
      }
    })()
  }, [])

  if (phase === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (phase === 'login') {
    return (
      <>
        <LoginScreen
          onLoginSuccess={(key) => {
            setApiKeyState(key)
            setPhase('name-select')
          }}
        />
        <StatusBar style="auto" />
      </>
    )
  }

  if (phase === 'name-select' && apiKey) {
    return (
      <>
        <NameSelectScreen
          apiKey={apiKey}
          onNameSelected={(name) => {
            setUserName(name)
            setPhase('dashboard')
          }}
        />
        <StatusBar style="auto" />
      </>
    )
  }

  // Dashboard phase
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
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
