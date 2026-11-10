import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { getTalkColors } from '../../../theme/talkTheme';

export const linksterLayout = {
  screenH: 16,
  rowV: 12,
  radius: 14,
  radiusLg: 18,
} as const;

export function linksterTitle(isDark: boolean): TextStyle {
  return {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: getTalkColors(isDark).text,
  };
}

export function linksterSubtitle(isDark: boolean): TextStyle {
  return {
    fontSize: 13,
    fontWeight: '500',
    color: getTalkColors(isDark).textSecondary,
  };
}

export function linksterSectionLabel(isDark: boolean): TextStyle {
  return {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: getTalkColors(isDark).textMuted,
  };
}

/** Матовая карточка без glass/blur */
export function linksterMatteCard(isDark: boolean): ViewStyle {
  const c = getTalkColors(isDark);
  return {
    backgroundColor: isDark ? c.surface2 : '#F7F7F7',
    borderRadius: linksterLayout.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  };
}
