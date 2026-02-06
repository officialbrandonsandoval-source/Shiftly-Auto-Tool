import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { getSavedNames, addName, saveSelectedName } from '../storage'

interface NameSelectScreenProps {
  apiKey: string
  onNameSelected: (name: string) => void
}

export function NameSelectScreen({ apiKey, onNameSelected }: NameSelectScreenProps) {
  const [names, setNames] = useState<string[]>([])
  const [newName, setNewName] = useState('')
  const [showAddField, setShowAddField] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    getSavedNames(apiKey).then(setNames)
  }, [apiKey])

  const handleAddName = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return

    const updated = await addName(apiKey, trimmed)
    setNames(updated)
    setSelected(trimmed)
    setNewName('')
    setShowAddField(false)
  }

  const handleContinue = async () => {
    if (!selected) return
    await saveSelectedName(selected)
    onNameSelected(selected)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Who's logging in?</Text>
        <Text style={styles.subtitle}>Select your name or add yourself</Text>

        {names.length > 0 && (
          <View style={styles.listContainer}>
            <FlatList
              data={names}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.nameRow, selected === item && styles.nameRowSelected]}
                  onPress={() => setSelected(item)}
                >
                  <View style={[styles.radio, selected === item && styles.radioSelected]}>
                    {selected === item && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.nameText, selected === item && styles.nameTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {!showAddField ? (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddField(true)}>
            <Text style={styles.addButtonText}>+ Add Your Name</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addFieldContainer}>
            <TextInput
              style={styles.addInput}
              placeholder="Enter your name..."
              placeholderTextColor="#999"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={handleAddName}
              returnKeyType="done"
            />
            <View style={styles.addFieldActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddField(false)
                  setNewName('')
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, !newName.trim() && styles.saveButtonDisabled]}
                onPress={handleAddName}
                disabled={!newName.trim()}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.continueButton, !selected && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  listContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 280,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nameRowSelected: {
    backgroundColor: '#eff6ff',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#2563eb',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
  nameText: {
    fontSize: 17,
    color: '#333',
  },
  nameTextSelected: {
    fontWeight: '600',
    color: '#2563eb',
  },
  addButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  addFieldContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  addFieldActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
})
