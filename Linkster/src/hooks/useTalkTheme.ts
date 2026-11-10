import { useAuth } from '../context/AuthContext';
import { getTalkColors, talkBrand } from '../theme/talkTheme';
import { getMessengerSurfaces } from '../theme/messengerTheme';

export function useTalkTheme() {
  const { theme, language, accentPreset } = useAuth();
  const isDark = theme === 'dark';
  return {
    isDark,
    colors: getTalkColors(isDark),
    brand: talkBrand,
    language,
    accentPreset,
    messenger: getMessengerSurfaces(isDark),
  };
}
