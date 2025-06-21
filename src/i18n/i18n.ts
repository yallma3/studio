import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import arTranslation from './locales/ar/translation.json';

// the translations
const resources = {
  en: {
    translation: enTranslation
  },
  ar: {
    translation: arTranslation
  }
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    saveMissing: false,
    missingKeyHandler: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    // language direction
    supportedLngs: ['en', 'ar'],
    // Arabic language is right-to-left
    load: 'languageOnly',
  });

export default i18n; 