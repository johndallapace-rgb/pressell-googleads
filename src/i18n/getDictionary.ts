import 'server-only';
import { Locale } from './i18n-config';

// We enumerate all dictionaries here for better type safety and to ensure they are bundled
const dictionaries = {
  en: () => import('./locales/en.json').then((module) => module.default),
  es: () => import('./locales/es.json').then((module) => module.default),
  fr: () => import('./locales/fr.json').then((module) => module.default),
  de: () => import('./locales/de.json').then((module) => module.default),
  it: () => import('./locales/it.json').then((module) => module.default),
  pt: () => import('./locales/pt.json').then((module) => module.default),
};

export type Dictionary = Awaited<ReturnType<typeof dictionaries.en>>;

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]();
};
