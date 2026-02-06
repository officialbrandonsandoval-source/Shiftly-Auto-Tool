import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { authAPI } from '../api/client'
import { saveApiKey } from '../storage'

interface LoginScreenProps {
  onLoginSuccess: (apiKey: string) => void
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    const trimmed = apiKey.trim()
    if (!trimmed) {
      setError('Please enter your SAG API Key')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await authAPI.verifyKey(trimmed)
      await saveApiKey(trimmed)
      onLoginSuccess(trimmed)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('Invalid') || message.includes('revoked')) {
        setError('Invalid API key. Please check and try again.')
      } else {
        setError(`Could not connect to server: ${message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>PONS Auto</Text>
          <Text style={styles.tagline}>Dealer Inventory Platform</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>SAG API Key</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Enter your SAG API Key..."
            placeholderTextColor="#999"
            value={apiKey}
            onChangeText={(text) => {
              setApiKey(text)
              if (error) setError(null)
            }}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            editable={!loading}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2563eb',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
})
