export type AppLanguage = 'ru' | 'en';

export const APP_LANGUAGES: { id: AppLanguage; label: string; native: string }[] = [
  { id: 'ru', label: 'Russian', native: 'Русский' },
  { id: 'en', label: 'English', native: 'English' },
];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'ru' || value === 'en';
}

import { settingsAppearanceKeys, translate, type TranslationKey } from './translations';

export type SettingsAppearanceKey = keyof typeof settingsAppearanceKeys;

export function tSettings(key: SettingsAppearanceKey, lang: AppLanguage): string {
  const fullKey = settingsAppearanceKeys[key] as TranslationKey;
  return translate(fullKey, lang);
}
