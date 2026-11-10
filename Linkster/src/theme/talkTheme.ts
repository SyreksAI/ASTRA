import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { getAccentPreset, type AccentPresetId, type TalkBrandColors } from './accentPresets';

/** Матовые фоны приложения (логотипы — PNG с прозрачностью) */
export const linksterCanvas = {
  light: '#FFFFFF',
  dark: '#000000',
} as const;

export const talkHeaderWhite = linksterCanvas.light;

export type TalkHeaderColors = {
  background: string;
  foreground: string;
  muted: string;
  searchBg: string;
  border: string;
};

export function getTalkHeaderColors(isDark: boolean): TalkHeaderColors {
  if (isDark) {
    return {
      background: linksterCanvas.dark,
      foreground: '#F5F5F5',
      muted: '#A3A3A3',
      searchBg: '#141414',
      border: '#262626',
    };
  }
  return {
    background: linksterCanvas.light,
    foreground: '#0F172A',
    muted: '#64748B',
    searchBg: '#F3F3F3',
    border: 'rgba(15, 23, 42, 0.08)',
  };
}

let runtimeAccent: TalkBrandColors = getAccentPreset('linkster').brand;

export function applyAccentPreset(id: AccentPresetId) {
  runtimeAccent = { ...getAccentPreset(id).brand };
}

/** Акцентные цвета (динамические) + фиксированные статусы */
export const talkBrand = {
  get accent() {
    return runtimeAccent.accent;
  },
  get accentBright() {
    return runtimeAccent.accentBright;
  },
  get accentPressed() {
    return runtimeAccent.accentPressed;
  },
  get accentSoft() {
    return runtimeAccent.accentSoft;
  },
  get accentBorder() {
    return runtimeAccent.accentBorder;
  },
  get accentFill() {
    return runtimeAccent.accentFill;
  },
  get onAccent() {
    return runtimeAccent.onAccent;
  },
  recordGreen: '#2DA855',
  recordGreenPressed: '#268F48',
  danger: '#e01570',
  online: '#00b35a',
};

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace('#', '');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function talkAccentAlpha(alpha: number): string {
  const rgb = hexToRgb(runtimeAccent.accent);
  if (!rgb) return `rgba(0, 168, 150, ${alpha})`;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export type TalkColors = {
  bg: string;
  bgElevated: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  shadow: string;
};

export function getTalkColors(isDark: boolean): TalkColors {
  if (isDark) {
    return {
      bg: linksterCanvas.dark,
      bgElevated: linksterCanvas.dark,
      surface: linksterCanvas.dark,
      surface2: '#111111',
      border: '#262626',
      text: '#F5F5F5',
      textSecondary: '#A3A3A3',
      textMuted: '#737373',
      inputBg: '#141414',
      shadow: '#000000',
    };
  }
  return {
    bg: linksterCanvas.light,
    bgElevated: linksterCanvas.light,
    surface: linksterCanvas.light,
    surface2: '#EBEEED',
    border: 'rgba(15, 23, 42, 0.08)',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    inputBg: '#F3F3F3',
    shadow: '#0F172A',
  };
}

export function talkShadow(isDark: boolean, elevation = 4): ViewStyle {
  if (Platform.OS === 'android') {
    return { elevation };
  }
  return {
    shadowColor: getTalkColors(isDark).shadow,
    shadowOffset: { width: 0, height: elevation },
    shadowOpacity: isDark ? 0.35 : 0.08,
    shadowRadius: elevation * 2,
  };
}

export function talkScreenTitle(isDark: boolean): TextStyle {
  return {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: getTalkColors(isDark).text,
  };
}

/** Основная CTA-кнопка (auth и общие экраны) */
export const linksterPrimaryButton = {
  backgroundColor: talkBrand.accent,
  textColor: talkBrand.onAccent,
} as const;
