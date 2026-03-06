import '../styles.css'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { appConfig } from '@app/shared-config'
import { initSharedI18n } from '@app/shared-i18n'
import { createQueryClient } from '@app/shared-graphql'
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
})

function RootComponent() {
  const runtime = globalThis as typeof globalThis & {
    __APP_THEME__?: string
    process?: { env?: Record<string, string | undefined> }
  }
  const graphqlEndpoint =
    runtime.process?.env?.VITE_GRAPHQL_ENDPOINT ?? appConfig.graphqlEndpoint
  const theme =
    runtime.__APP_THEME__ ?? runtime.process?.env?.APP_THEME ?? 'dark'
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
              __html: `window.__GRAPHQL_ENDPOINT__ = ${JSON.stringify(graphqlEndpoint)};`,
            }}
          />
        ) : null}
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18nInstance}>
            <AppShell>
              <Outlet />
            </AppShell>
          </I18nextProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
