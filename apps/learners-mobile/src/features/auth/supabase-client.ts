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
  const supabasePublishableKey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    return null
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
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

  cachedClient = createClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    },
  )

  return cachedClient
}
