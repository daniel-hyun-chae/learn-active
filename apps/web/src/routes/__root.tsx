import '../styles.css'
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { initSharedI18n } from '@app/shared-i18n'
import { createQueryClient } from '@app/shared-graphql'
import { WebAuthProvider } from '../features/auth/AuthProvider'
import { AppShell } from '../shared/layout/AppShell'
import { getWebRuntimeConfig } from '../shared/api/runtime'

const i18nInstance = initSharedI18n()
const queryClient = createQueryClient()

export const Route = createRootRoute({
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
  const { theme } = getWebRuntimeConfig()

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.setProperty('color-scheme', 'dark light')
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18nInstance}>
        <WebAuthProvider>
          <AppShell>
            <Outlet />
          </AppShell>
        </WebAuthProvider>
      </I18nextProvider>
    </QueryClientProvider>
  )
}
