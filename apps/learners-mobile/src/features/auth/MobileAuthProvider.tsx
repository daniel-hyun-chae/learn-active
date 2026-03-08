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
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { setGraphQLAccessTokenProvider } from '../../shared/api/graphql'
import { getMobileSupabaseClient } from './supabase-client'

WebBrowser.maybeCompleteAuthSession()

export type MobileAuthUser = {
  id: string
  email: string | null
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type MobileAuthContextValue = {
  status: AuthStatus
  isConfigured: boolean
  user: MobileAuthUser | null
  errorMessage: string | null
  signInWithGoogle: () => Promise<boolean>
  sendMagicLink: (email: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const MobileAuthContext = createContext<MobileAuthContextValue | null>(null)

function mapSessionToUser(session: Session | null): MobileAuthUser | null {
  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email ?? null,
  }
}

function extractAccessTokens(url: string) {
  const parsed = Linking.parse(url)
  const params = parsed.queryParams ?? {}

  const accessToken =
    typeof params.access_token === 'string' ? params.access_token : null
  const refreshToken =
    typeof params.refresh_token === 'string' ? params.refresh_token : null
  const code = typeof params.code === 'string' ? params.code : null
  const tokenHash =
    typeof params.token_hash === 'string' ? params.token_hash : null
  const type = typeof params.type === 'string' ? params.type : null

  return {
    accessToken,
    refreshToken,
    code,
    tokenHash,
    type,
  }
}

async function applyRedirectSession(url: string) {
  const client = getMobileSupabaseClient()
  if (!client) {
    return
  }

  const { accessToken, refreshToken, code, tokenHash, type } =
    extractAccessTokens(url)

  if (accessToken && refreshToken) {
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    return
  }

  if (code) {
    await client.auth.exchangeCodeForSession(code)
    return
  }

  if (tokenHash && type === 'magiclink') {
    await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    })
  }
}

type MobileAuthProviderProps = {
  children: ReactNode
}

export function MobileAuthProvider({ children }: MobileAuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<MobileAuthUser | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const client = getMobileSupabaseClient()
  const isConfigured = Boolean(client)
  const sessionRef = useRef<Session | null>(null)

  useEffect(() => {
    if (!client) {
      setStatus('unauthenticated')
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

    const redirectSubscription = Linking.addEventListener(
      'url',
      (event: { url: string }) => {
        void applyRedirectSession(event.url).catch((error) => {
          setErrorMessage(
            error instanceof Error ? error.message : String(error),
          )
        })
      },
    )

    void Linking.getInitialURL().then((initialUrl: string | null) => {
      if (!initialUrl) {
        return
      }

      void applyRedirectSession(initialUrl).catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : String(error))
      })
    })

    return () => {
      mounted = false
      redirectSubscription.remove()
      subscription.unsubscribe()
      setGraphQLAccessTokenProvider(null)
    }
  }, [client])

  const signInWithGoogle = useCallback(async () => {
    if (!client) {
      setErrorMessage('auth.error.notConfigured')
      return false
    }

    setErrorMessage(null)
    const redirectTo = Linking.createURL('auth/callback')
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    })

    if (error || !data?.url) {
      setErrorMessage(error?.message ?? 'auth.error.googleUrlMissing')
      return false
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
    if (result.type === 'success' && result.url) {
      await applyRedirectSession(result.url)
      return true
    }

    if (result.type === 'cancel') {
      return false
    }

    setErrorMessage('auth.error.googleNotCompleted')
    return false
  }, [client])

  const sendMagicLink = useCallback(
    async (email: string) => {
      if (!client) {
        setErrorMessage('auth.error.notConfigured')
        return false
      }

      setErrorMessage(null)
      const { error } = await client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: Linking.createURL('auth/callback'),
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

  const value = useMemo<MobileAuthContextValue>(
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

  return (
    <MobileAuthContext.Provider value={value}>
      {children}
    </MobileAuthContext.Provider>
  )
}

export function useMobileAuth() {
  const context = useContext(MobileAuthContext)
  if (!context) {
    throw new Error('useMobileAuth must be used within MobileAuthProvider')
  }
  return context
}
