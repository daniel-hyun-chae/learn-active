import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { tokens } from '@app/shared-tokens'
import { useMobileAuth } from './MobileAuthProvider'

export function AuthEntryScreen() {
  const { t } = useTranslation()
  const auth = useMobileAuth()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  )

  async function onMagicLinkPress() {
    setState('sending')
    const sent = await auth.sendMagicLink(email)
    setState(sent ? 'sent' : 'error')
  }

  function renderError(message: string) {
    if (message.startsWith('auth.error.')) {
      return t(message)
    }

    return message
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

      {auth.status === 'loading' ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={tokens.color.primary} />
          <Text style={styles.muted}>{t('auth.loading')}</Text>
        </View>
      ) : null}

      {!auth.isConfigured ? (
        <Text style={styles.error} testID="mobile-auth-config-missing">
          {t('auth.notConfigured')}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={() => void auth.signInWithGoogle()}
        disabled={!auth.isConfigured || auth.status === 'loading'}
        testID="mobile-auth-google"
      >
        <Text style={styles.buttonText}>{t('auth.google')}</Text>
      </Pressable>

      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder={t('auth.magicLink.emailPlaceholder')}
        placeholderTextColor={tokens.color.muted}
        style={styles.input}
        testID="mobile-auth-email"
      />

      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={() => void onMagicLinkPress()}
        disabled={
          !auth.isConfigured || state === 'sending' || email.length === 0
        }
        testID="mobile-auth-magic-link"
      >
        <Text style={styles.buttonText}>
          {state === 'sending'
            ? t('auth.magicLink.sending')
            : t('auth.magicLink.send')}
        </Text>
      </Pressable>

      {state === 'sent' ? (
        <Text style={styles.muted} testID="mobile-auth-magic-link-sent">
          {t('auth.magicLink.sent')}
        </Text>
      ) : null}

      {auth.errorMessage ? (
        <Text style={styles.error} testID="mobile-auth-error">
          {renderError(auth.errorMessage)}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.lg,
    backgroundColor: tokens.color.background,
    gap: tokens.spacing.md,
  },
  title: {
    color: tokens.color.text,
    fontSize: tokens.font.size.xl,
    fontWeight: String(tokens.font.weight.bold) as '700',
  },
  subtitle: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  button: {
    borderRadius: Number(tokens.radius.sm),
    backgroundColor: tokens.color.primary,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: tokens.color.text,
    fontSize: tokens.font.size.md,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: Number(tokens.radius.sm),
    color: tokens.color.text,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
  },
  muted: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  error: {
    color: tokens.color.accent,
    fontSize: tokens.font.size.sm,
  },
})
