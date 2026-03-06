export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  listKeys?(prefix?: string): Promise<string[]>
}

export function createMemoryStorage(): KeyValueStorage {
  const store = new Map<string, string>()
  return {
    async getItem(key) {
      return store.get(key) ?? null
    },
    async setItem(key, value) {
      store.set(key, value)
    },
    async removeItem(key) {
      store.delete(key)
    },
    async listKeys(prefix = '') {
      return Array.from(store.keys()).filter((key) => key.startsWith(prefix))
    },
  }
}

export function createWebStorage(): KeyValueStorage {
  const memory = createMemoryStorage()
  const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

  return {
    async getItem(key) {
      if (!isBrowser) {
        return memory.getItem(key)
      }
      return window.localStorage.getItem(key)
    },
    async setItem(key, value) {
      if (!isBrowser) {
        return memory.setItem(key, value)
      }
      window.localStorage.setItem(key, value)
    },
    async removeItem(key) {
      if (!isBrowser) {
        return memory.removeItem(key)
      }
      window.localStorage.removeItem(key)
    },
    async listKeys(prefix = '') {
      if (!isBrowser) {
        return memory.listKeys?.(prefix) ?? []
      }
      const keys: string[] = []
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index)
        if (key && key.startsWith(prefix)) {
          keys.push(key)
        }
      }
      return keys
    },
  }
}
