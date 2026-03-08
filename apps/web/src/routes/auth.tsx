import { createFileRoute, redirect } from '@tanstack/react-router'
import { FormEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth/AuthProvider'
import { getActiveWebSession } from '../features/auth/route-guard'

type AuthSearch = {
  returnTo?: string
}

function normalizeAuthSearch(search: Record<string, unknown>): AuthSearch {
  if (typeof search.returnTo === 'string' && search.returnTo.length > 0) {
    return { returnTo: search.returnTo }
  }

  return {}
}

function sanitizeReturnTo(value?: string) {
  if (!value || !value.startsWith('/')) {
    return '/learn'
  }

  if (value.startsWith('/auth')) {
    return '/learn'
  }

  return value
}

function translateAuthError(message: string, t: (key: string) => string) {
  if (message.startsWith('auth.error.')) {
    return t(message)
  }

  return message
}

export const Route = createFileRoute('/auth')({
  validateSearch: normalizeAuthSearch,
  beforeLoad: async ({ search }) => {
    const session = await getActiveWebSession()
    if (session) {
      throw redirect({ to: sanitizeReturnTo(search.returnTo) })
    }
  },
  component: AuthRoute,
})

function AuthRoute() {
  const { t } = useTranslation()
  const { returnTo } = Route.useSearch()
  const auth = useAuth()

  const [email, setEmail] = useState('')
  const [magicLinkState, setMagicLinkState] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle')

  const redirectTarget = useMemo(() => sanitizeReturnTo(returnTo), [returnTo])

  async function handleSendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMagicLinkState('sending')
    const sent = await auth.sendMagicLink(email, redirectTarget)

    if (!sent) {
      setMagicLinkState('error')
      return
    }

    setMagicLinkState('sent')
  }

  return (
    <section className="publisher-home" data-test="auth-entry-page">
      <div className="publisher-header">
        <div>
          <h2>{t('auth.title')}</h2>
          <p className="muted">{t('auth.subtitle')}</p>
          {auth.status === 'loading' ? (
            <p className="muted" data-test="auth-loading">
              {t('auth.loading')}
            </p>
          ) : null}
        </div>
      </div>

      {!auth.isConfigured ? (
        <p className="muted" data-test="auth-config-missing">
          {t('auth.notConfigured')}
        </p>
      ) : null}

      <div className="publisher-actions">
        <button
          type="button"
          className="course-link"
          data-test="auth-google"
          onClick={() => void auth.signInWithGoogle(redirectTarget)}
          disabled={!auth.isConfigured || auth.status === 'loading'}
        >
          {t('auth.google')}
        </button>
      </div>

      <form
        className="publisher-panel"
        onSubmit={(event) => void handleSendMagicLink(event)}
      >
        <label className="publisher-field" htmlFor="magic-link-email">
          <span>{t('auth.magicLink.emailLabel')}</span>
          <input
            id="magic-link-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('auth.magicLink.emailPlaceholder')}
            data-test="auth-magic-link-email"
          />
        </label>

        <button
          type="submit"
          className="course-link"
          data-test="auth-magic-link-send"
          disabled={!auth.isConfigured || magicLinkState === 'sending'}
        >
          {magicLinkState === 'sending'
            ? t('auth.magicLink.sending')
            : t('auth.magicLink.send')}
        </button>

        {magicLinkState === 'sent' ? (
          <p className="muted" data-test="auth-magic-link-sent">
            {t('auth.magicLink.sent')}
          </p>
        ) : null}

        {auth.errorMessage ? (
          <p className="status-error" data-test="auth-error">
            {translateAuthError(auth.errorMessage, t)}
          </p>
        ) : null}
      </form>
    </section>
  )
}
