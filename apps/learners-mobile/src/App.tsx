import { SafeAreaView, StatusBar } from 'react-native'
import { I18nextProvider } from 'react-i18next'
import { initSharedI18n } from '@app/shared-i18n'
import { LearnerMobileApp } from './features/learners/LearnerMobileApp'
import { AuthEntryScreen } from './features/auth/AuthEntryScreen'
import {
  MobileAuthProvider,
  useMobileAuth,
} from './features/auth/MobileAuthProvider'

const i18nInstance = initSharedI18n()

export default function App() {
  return (
    <I18nextProvider i18n={i18nInstance}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <MobileAuthProvider>
          <MobileAuthGate />
        </MobileAuthProvider>
      </SafeAreaView>
    </I18nextProvider>
  )
}

function MobileAuthGate() {
  const auth = useMobileAuth()

  if (auth.status !== 'authenticated') {
    return <AuthEntryScreen />
  }

  return <LearnerMobileApp />
}
