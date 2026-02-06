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
import { signupDealership } from '../api/authClient'

interface SignupScreenProps {
  onSignupSuccess: () => void
  onLoginPress: () => void
}

export function SignupScreen({ onSignupSuccess, onLoginPress }: SignupScreenProps) {
  const [dealershipName, setDealershipName] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!dealershipName || !email || !name || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters')
      return
    }

    try {
      setLoading(true)
      await signupDealership(dealershipName, email, password, name)
      Alert.alert('Success', 'Dealership created! Logging you in...')
      onSignupSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed'
      Alert.alert('Signup Error', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ padding: 20 }}>
          {/* Header */}
          <View style={{ marginBottom: 30, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
              Get Started
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>
              Create your dealership account
            </Text>
          </View>

          {/* Dealership Name */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 6 }}>
              Dealership Name
            </Text>
            <TextInput
              placeholder="Your Dealership Name"
              value={dealershipName}
              onChangeText={setDealershipName}
              editable={!loading}
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
              }}
            />
          </View>

          {/* Your Name */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 6 }}>
              Your Name
            </Text>
            <TextInput
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              editable={!loading}
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
              }}
            />
          </View>

          {/* Email */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 6 }}>
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
                fontSize: 14,
              }}
            />
          </View>

          {/* Password */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 6 }}>
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
                fontSize: 14,
              }}
            />
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
              At least 8 characters
            </Text>
          </View>

          {/* Confirm Password */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 6 }}>
              Confirm Password
            </Text>
            <TextInput
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
              }}
            />
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            onPress={handleSignup}
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
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Text style={{ color: '#6B7280', fontSize: 14 }}>Already have an account? </Text>
            <TouchableOpacity onPress={onLoginPress}>
              <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '600' }}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
