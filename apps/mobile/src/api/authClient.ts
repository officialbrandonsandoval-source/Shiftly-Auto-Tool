import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = 'http://192.168.3.96:3001'
const AUTH_TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user_data'

export interface AuthUser {
  id: string
  email: string
  name: string
  dealershipId: string
  role: string
  facebookPageName?: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

/**
 * Sign up a new dealership
 */
export async function signupDealership(
  dealershipName: string,
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/v2/signup/dealership`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dealershipName,
      email,
      password,
      name,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Signup failed')
  }

  const data = await response.json()
  const auth = data.auth

  // Store tokens
  await saveAuthTokens(auth.accessToken, auth.refreshToken)
  await saveUser(auth.user)

  return auth
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/v2/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Login failed')
  }

  const data = await response.json()
  const auth = data.auth

  // Store tokens
  await saveAuthTokens(auth.accessToken, auth.refreshToken)
  await saveUser(auth.user)

  return auth
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await fetch(`${API_BASE_URL}/auth/v2/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    // Clear tokens if refresh fails
    await logout()
    throw new Error('Token refresh failed')
  }

  const data = await response.json()
  const auth = data.auth

  await saveAuthTokens(auth.accessToken, auth.refreshToken)
  await saveUser(auth.user)

  return auth.accessToken
}

/**
 * Logout - clear all auth data
 */
export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY)
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY)
  await AsyncStorage.removeItem(USER_KEY)
}

/**
 * Get current access token
 */
export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY)
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const user = await AsyncStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(): Promise<boolean> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY)
  return !!token
}

/**
 * Private: Save auth tokens
 */
async function saveAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken),
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
  ])
}

/**
 * Private: Save user data
 */
async function saveUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
}
