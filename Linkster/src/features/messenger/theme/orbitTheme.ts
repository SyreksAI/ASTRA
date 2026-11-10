import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { talkBrand, linksterCanvas } from '../../../theme/talkTheme';

/** Linkster Orbit — визуальный язык, не «как Telegram/WhatsApp» */
export const orbit = {
  meshDarkTop: '#0A1018',
  meshDarkMid: '#060A0E',
  meshDarkGlow: 'rgba(0, 191, 168, 0.12)',
  meshLightTop: '#F4FAF9',
  meshLightMid: '#E8F4F2',
  meshLightGlow: 'rgba(0, 168, 150, 0.08)',
  glassDark: 'rgba(8, 24, 36, 0.72)',
  glassLight: 'rgba(255, 255, 255, 0.78)',
  glassBorderDark: 'rgba(0, 191, 168, 0.28)',
  glassBorderLight: 'rgba(0, 168, 150, 0.18)',
  orbitRing: talkBrand.accentBright,
  orbitRingDim: 'rgba(0, 191, 168, 0.35)',
  chipActive: talkBrand.accent,
  chipIdleDark: 'rgba(255,255,255,0.08)',
  chipIdleLight: 'rgba(15, 23, 42, 0.06)',
  tileGlow: talkBrand.accentSoft,
} as const;

export type OrbitFilter = 'all' | 'unread' | 'groups';

export function orbitHeroTitle(isDark: boolean): TextStyle {
  return {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    color: isDark ? 'rgba(232, 244, 242, 0.55)' : 'rgba(15, 23, 42, 0.45)',
  };
}

export function orbitGreeting(isDark: boolean): TextStyle {
  return {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: isDark ? '#E8F4F2' : linksterCanvas.dark,
  };
}

export function glassPanel(isDark: boolean): ViewStyle {
  return {
    backgroundColor: isDark ? orbit.glassDark : orbit.glassLight,
    borderWidth: 1,
    borderColor: isDark ? orbit.glassBorderDark : orbit.glassBorderLight,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: talkBrand.accent,
          shadowOpacity: isDark ? 0.15 : 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
        }
      : { elevation: 6 }),
  };
}

export function orbitPrimaryPill(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: talkBrand.accent,
    shadowColor: talkBrand.accentBright,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  };
}
