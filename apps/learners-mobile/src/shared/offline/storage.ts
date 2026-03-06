import AsyncStorage from '@react-native-async-storage/async-storage'
import type { KeyValueStorage } from '@app/shared-utils'

export const asyncStorageAdapter: KeyValueStorage = {
  async getItem(key) {
    return AsyncStorage.getItem(key)
  },
  async setItem(key, value) {
    await AsyncStorage.setItem(key, value)
  },
  async removeItem(key) {
    await AsyncStorage.removeItem(key)
  },
  async listKeys(prefix = '') {
    const keys = await AsyncStorage.getAllKeys()
    return keys.filter((key) => key.startsWith(prefix))
  },
}
