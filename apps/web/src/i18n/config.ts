import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import frCommon from './locales/fr/common.json';
import arCommon from './locales/ar/common.json';

const resources = {
  en: { common: enCommon },
  fr: { common: frCommon },
  ar: { common: arCommon },
};

export const RTL_LANGUAGES = ['ar', 'he'];
export const isRTL = (lang: string) => RTL_LANGUAGES.includes(lang);

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  supportedLngs: ['en', 'fr', 'ar'],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
