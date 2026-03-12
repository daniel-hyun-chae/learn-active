import { redirect } from '@tanstack/react-router'
import { getWebSupabaseClient } from './supabase-client'

function normalizeReturnTo(value: string | undefined) {
  if (!value) {
    return '/learn'
  }

  if (value.startsWith('/auth')) {
    return '/learn'
  }

  return value
}

export async function getActiveWebSession() {
  const client = getWebSupabaseClient()
  if (!client) {
    return null
  }

  const { data } = await client.auth.getSession()
  return data.session ?? null
}

export async function requireWebSession(returnTo: string) {
  const client = getWebSupabaseClient()
  if (!client) {
    throw redirect({
      to: '/auth',
      search: { returnTo: normalizeReturnTo(returnTo) },
    })
  }

  const { data } = await client.auth.getSession()
  const session = data.session

  if (!session) {
    throw redirect({
      to: '/auth',
      search: { returnTo: normalizeReturnTo(returnTo) },
    })
  }

  return session
}
