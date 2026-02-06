import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  API_KEY: '@pons/api-key',
  SAVED_NAMES: '@pons/saved-names',
  SELECTED_NAME: '@pons/selected-name',
}

// --- API Key ---

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.API_KEY, key)
}

export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.API_KEY)
}

export async function clearApiKey(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.API_KEY)
}

// --- Saved Names (per API key) ---

function namesKey(apiKey: string): string {
  // Namespace names by the first 12 chars of the key to keep them per-account
  return `${KEYS.SAVED_NAMES}:${apiKey.slice(0, 12)}`
}

export async function getSavedNames(apiKey: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(namesKey(apiKey))
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function addName(apiKey: string, name: string): Promise<string[]> {
  const names = await getSavedNames(apiKey)
  if (!names.includes(name)) {
    names.push(name)
    await AsyncStorage.setItem(namesKey(apiKey), JSON.stringify(names))
  }
  return names
}

// --- Selected Name ---

export async function saveSelectedName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.SELECTED_NAME, name)
}

export async function getSelectedName(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.SELECTED_NAME)
}
