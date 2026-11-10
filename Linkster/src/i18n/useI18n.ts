import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { talkBrand } from '../theme/talkTheme';
import { translate, type TranslationKey } from './translations';
import type { AppLanguage } from './appLanguage';

export function useI18n() {
  const { language, accentPreset, theme } = useAuth();
  const isDark = theme === 'dark';

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      let text = translate(key, language);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [language]
  );

  return {
    t,
    language: language as AppLanguage,
    accentPreset,
    theme,
    isDark,
    accent: talkBrand.accentBright,
    accentMuted: talkBrand.accent,
  };
}
