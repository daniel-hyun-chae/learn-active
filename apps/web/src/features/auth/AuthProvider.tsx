import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { setGraphQLAccessTokenProvider } from '../../shared/api/graphql'
import { getWebSupabaseClient } from './supabase-client'

export type AuthUser = {
  id: string
  email: string | null
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  status: AuthStatus
  isConfigured: boolean
  user: AuthUser | null
  errorMessage: string | null
  signInWithGoogle: (returnTo?: string) => Promise<boolean>
  sendMagicLink: (email: string, returnTo?: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapSessionToUser(session: Session | null): AuthUser | null {
  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email ?? null,
  }
}

function buildWebAuthRedirect(returnTo?: string) {
  if (typeof window === 'undefined') {
    return undefined
  }

  const url = new URL('/auth', window.location.origin)
  if (returnTo) {
    url.searchParams.set('returnTo', returnTo)
  }
  return url.toString()
}

type AuthProviderProps = {
  children: ReactNode
}

export function WebAuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const client = getWebSupabaseClient()
  const isConfigured = Boolean(client)
  const sessionRef = useRef<Session | null>(null)

  useEffect(() => {
    if (!client) {
      setStatus('unauthenticated')
      setUser(null)
      setGraphQLAccessTokenProvider(null)
      return
    }

    setGraphQLAccessTokenProvider(
      () => sessionRef.current?.access_token ?? null,
    )

    let mounted = true

    void client.auth
      .getSession()
      .then(
        ({
          data,
          error,
        }: {
          data: { session: Session | null }
          error: { message: string } | null
        }) => {
          if (!mounted) {
            return
          }

          if (error) {
            setErrorMessage(error.message)
          }

          sessionRef.current = data.session ?? null
          setUser(mapSessionToUser(data.session ?? null))
          setStatus(data.session ? 'authenticated' : 'unauthenticated')
        },
      )

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        sessionRef.current = session ?? null
        setUser(mapSessionToUser(session ?? null))
        setStatus(session ? 'authenticated' : 'unauthenticated')
      },
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      setGraphQLAccessTokenProvider(null)
    }
  }, [client])

  const signInWithGoogle = useCallback(
    async (returnTo?: string) => {
      if (!client) {
        setErrorMessage('auth.error.notConfigured')
        return false
      }

      setErrorMessage(null)
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: buildWebAuthRedirect(returnTo),
        },
      })

      if (error) {
        setErrorMessage(error.message)
        return false
      }

      return true
    },
    [client],
  )

  const sendMagicLink = useCallback(
    async (email: string, returnTo?: string) => {
      if (!client) {
        setErrorMessage('auth.error.notConfigured')
        return false
      }

      setErrorMessage(null)
      const { error } = await client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: buildWebAuthRedirect(returnTo),
        },
      })

      if (error) {
        setErrorMessage(error.message)
        return false
      }

      return true
    },
    [client],
  )

  const signOut = useCallback(async () => {
    if (!client) {
      return
    }

    setErrorMessage(null)
    const { error } = await client.auth.signOut()
    if (error) {
      setErrorMessage(error.message)
    }
  }, [client])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isConfigured,
      user,
      errorMessage,
      signInWithGoogle,
      sendMagicLink,
      signOut,
    }),
    [
      errorMessage,
      isConfigured,
      sendMagicLink,
      signInWithGoogle,
      signOut,
      status,
      user,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within WebAuthProvider')
  }
  return context
}
