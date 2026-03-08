import '../styles.css'
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { appConfig } from '@app/shared-config'
import { initSharedI18n } from '@app/shared-i18n'
import { createQueryClient } from '@app/shared-graphql'
import { WebAuthProvider } from '../features/auth/AuthProvider'
import { AppShell } from '../shared/layout/AppShell'

const i18nInstance = initSharedI18n()
const queryClient = createQueryClient()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: GlobalNotFound,
})

function GlobalNotFound() {
  const { t } = useTranslation()

  return (
    <main className="container stack-lg" data-test="router-not-found">
      <h1>{t('router.notFound.title')}</h1>
      <p className="muted">{t('router.notFound.body')}</p>
      <Link to="/learn" className="btn-primary">
        {t('router.notFound.cta')}
      </Link>
    </main>
  )
}

function RootComponent() {
  const runtime = globalThis as typeof globalThis & {
    __APP_THEME__?: string
    __GRAPHQL_ENDPOINT__?: string
    __SUPABASE_URL__?: string
    __SUPABASE_ANON_KEY__?: string
    process?: { env?: Record<string, string | undefined> }
  }
  const graphqlEndpoint =
    runtime.__GRAPHQL_ENDPOINT__ ??
    runtime.process?.env?.VITE_GRAPHQL_ENDPOINT ??
    runtime.process?.env?.GRAPHQL_ENDPOINT ??
    appConfig.graphqlEndpoint
  const theme =
    runtime.__APP_THEME__ ?? runtime.process?.env?.APP_THEME ?? 'dark'
  const supabaseUrl =
    runtime.__SUPABASE_URL__ ??
    runtime.process?.env?.VITE_SUPABASE_URL ??
    runtime.process?.env?.SUPABASE_URL ??
    ''
  const supabaseAnonKey =
    runtime.__SUPABASE_ANON_KEY__ ??
    runtime.process?.env?.VITE_SUPABASE_ANON_KEY ??
    runtime.process?.env?.SUPABASE_ANON_KEY ??
    ''
  if (typeof globalThis !== 'undefined') {
    ;(
      globalThis as typeof globalThis & { __APP_THEME__?: string }
    ).__APP_THEME__ = theme
  }
  return (
    <html lang="en" data-theme={theme}>
      <head>
        <HeadContent />
        <meta name="color-scheme" content="dark light" />
        {graphqlEndpoint ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__APP_THEME__ = ${JSON.stringify(theme)}; window.__GRAPHQL_ENDPOINT__ = ${JSON.stringify(graphqlEndpoint)}; window.__SUPABASE_URL__ = ${JSON.stringify(supabaseUrl)}; window.__SUPABASE_ANON_KEY__ = ${JSON.stringify(supabaseAnonKey)};`,
            }}
          />
        ) : null}
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18nInstance}>
            <WebAuthProvider>
              <AppShell>
                <Outlet />
              </AppShell>
            </WebAuthProvider>
          </I18nextProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
