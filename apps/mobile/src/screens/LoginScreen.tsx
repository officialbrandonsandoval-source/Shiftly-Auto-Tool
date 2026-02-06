import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native'
import { login } from '../api/authClient'

interface LoginScreenProps {
  onLoginSuccess: () => void
  onSignupPress: () => void
}

export function LoginScreen({ onLoginSuccess, onSignupPress }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }

    try {
      setLoading(true)
      await login(email, password)
      onLoginSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      Alert.alert('Login Error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ padding: 20 }}>
          {/* Header */}
          <View style={{ marginBottom: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
              Shiftly
            </Text>
            <Text style={{ fontSize: 16, color: '#6B7280' }}>
              Sales Automation Platform
            </Text>
          </View>

          {/* Email Input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
              Email
            </Text>
            <TextInput
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
            />
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
              Password
            </Text>
            <TextInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
              }}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#D1D5DB' : '#3B82F6',
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
              marginBottom: 16,
            }}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Signup Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Text style={{ color: '#6B7280', fontSize: 14 }}>Don't have an account? </Text>
            <TouchableOpacity onPress={onSignupPress}>
              <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '600' }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
