import type { ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { tokenVars } from '@app/shared-tokens'
import { useAuth } from '../../features/auth/AuthProvider'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const auth = useAuth()
  const isPublish = location.pathname.startsWith('/publish')
  const isLearn = location.pathname.startsWith('/learn')
  const isCatalog = location.pathname.startsWith('/courses')
  const isMyCourses = location.pathname.startsWith('/my-courses')
  const isAuthRoute = location.pathname.startsWith('/auth')

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
          <div style={{ display: 'flex', gap: tokenVars.spacing.md }}>
            <nav style={{ display: 'flex', gap: tokenVars.spacing.md }}>
              <Link
                to="/courses"
                className={isCatalog ? 'nav-link active' : 'nav-link'}
              >
                {t('nav.courses')}
              </Link>
              <Link
                to="/my-courses"
                className={isMyCourses ? 'nav-link active' : 'nav-link'}
              >
                {t('nav.myCourses')}
              </Link>
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

            {auth.status === 'authenticated' ? (
              <div style={{ display: 'flex', gap: tokenVars.spacing.sm }}>
                <span className="muted" data-test="auth-user-email">
                  {t('auth.signedInAs', {
                    email: auth.user?.email ?? t('auth.userFallback'),
                  })}
                </span>
                <button
                  type="button"
                  className="ghost-button"
                  data-test="auth-logout"
                  onClick={() => void auth.signOut()}
                >
                  {t('auth.logout')}
                </button>
              </div>
            ) : null}

            {auth.status !== 'authenticated' && !isAuthRoute ? (
              <Link to="/auth" className="nav-link" data-test="auth-login-link">
                {t('auth.login')}
              </Link>
            ) : null}
          </div>
        </div>
      </header>
      <main id="content" className="app-main">
        <div className="container">{children}</div>
      </main>
    </div>
  )
}
