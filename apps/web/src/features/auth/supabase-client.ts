import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseRuntimeConfig } from '../../shared/api/runtime'

let cachedClient: SupabaseClient | null | undefined

export function getWebSupabaseClient() {
  if (cachedClient !== undefined) {
    return cachedClient
  }

  const config = getSupabaseRuntimeConfig()
  if (!config) {
    cachedClient = null
    return cachedClient
  }

  cachedClient = createClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  )

  return cachedClient
}
