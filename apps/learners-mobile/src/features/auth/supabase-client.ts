import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null | undefined

function getRuntimeEnv() {
  return (
    (
      globalThis as typeof globalThis & {
        process?: { env?: Record<string, string | undefined> }
      }
    ).process?.env ?? {}
  )
}

function getSupabaseConfig() {
  const env = getRuntimeEnv()
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL
  const supabaseAnonKey =
    env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  }
}

export function getMobileSupabaseClient() {
  if (cachedClient !== undefined) {
    return cachedClient
  }

  const config = getSupabaseConfig()
  if (!config) {
    cachedClient = null
    return cachedClient
  }

  cachedClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  })

  return cachedClient
}
