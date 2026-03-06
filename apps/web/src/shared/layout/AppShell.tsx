import type { ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { tokenVars } from '@app/shared-tokens'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const isPublish = location.pathname.startsWith('/publish')
  const isLearn = location.pathname.startsWith('/learn')

  return (
    <div className="app-shell">
      <a
        href="#content"
        className="muted"
        style={{
          padding: `${tokenVars.spacing.sm} ${tokenVars.spacing.lg}`,
          display: 'inline-flex',
        }}
      >
        {t('learners.nav.skip')}
      </a>
      <header className="app-header">
        <div
          className="container"
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <strong>{t('app.title')}</strong>
          <nav style={{ display: 'flex', gap: tokenVars.spacing.md }}>
            <Link
              to="/learn"
              className={isLearn ? 'nav-link active' : 'nav-link'}
            >
              {t('nav.learn')}
            </Link>
            <Link
              to="/publish"
              className={isPublish ? 'nav-link active' : 'nav-link'}
            >
              {t('nav.publish')}
            </Link>
          </nav>
        </div>
      </header>
      <main id="content" className="app-main">
        <div className="container">{children}</div>
      </main>
    </div>
  )
}
