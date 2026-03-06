import { SafeAreaView, StatusBar } from 'react-native'
import { I18nextProvider } from 'react-i18next'
import { initSharedI18n } from '@app/shared-i18n'
import { LearnerMobileApp } from './features/learners/LearnerMobileApp'

const i18nInstance = initSharedI18n()

export default function App() {
  return (
    <I18nextProvider i18n={i18nInstance}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <LearnerMobileApp />
      </SafeAreaView>
    </I18nextProvider>
  )
}
