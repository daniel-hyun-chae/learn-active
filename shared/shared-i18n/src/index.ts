import i18next, { type i18n } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from './resources'

export const DEFAULT_LANGUAGE = 'en'

let sharedInstance: i18n | null = null

export function initSharedI18n(language: string = DEFAULT_LANGUAGE) {
  if (sharedInstance) {
    return sharedInstance
  }

  sharedInstance = i18next.createInstance()
  sharedInstance.use(initReactI18next).init({
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    resources,
    interpolation: {
      escapeValue: false,
    },
  })

  return sharedInstance
}
