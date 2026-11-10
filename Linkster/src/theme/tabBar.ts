import { StyleSheet, type ViewStyle } from 'react-native';
import { getTalkColors, talkBrand } from './talkTheme';

export function tabBarColors(isDark: boolean) {
  const c = getTalkColors(isDark);
  return {
    active: talkBrand.accent,
    inactive: c.textMuted,
    bg: c.bgElevated,
    border: c.border,
  };
}

export function tabBarStyle(isDark: boolean): ViewStyle {
  const c = tabBarColors(isDark);
  return {
    backgroundColor: isDark ? '#061018' : '#FFFFFF',
    borderTopColor: talkBrand.accentBorder,
    borderTopWidth: 2,
    height: 62,
    paddingTop: 6,
    paddingBottom: 8,
    elevation: 0,
  };
}
