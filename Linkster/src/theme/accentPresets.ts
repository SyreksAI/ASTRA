export type AccentPresetId = 'linkster' | 'ocean' | 'violet' | 'sunset' | 'forest';

export type TalkBrandColors = {
  accent: string;
  accentBright: string;
  accentPressed: string;
  accentSoft: string;
  accentBorder: string;
  accentFill: string;
  onAccent: string;
};

export type AccentPreset = {
  id: AccentPresetId;
  labelRu: string;
  labelEn: string;
  swatch: string;
  brand: TalkBrandColors;
};

const presets: AccentPreset[] = [
  {
    id: 'linkster',
    labelRu: 'Linkster',
    labelEn: 'Linkster',
    swatch: '#00A896',
    brand: {
      accent: '#00A896',
      accentBright: '#00BFA8',
      accentPressed: '#008F7E',
      accentSoft: 'rgba(0, 168, 150, 0.14)',
      accentBorder: 'rgba(0, 168, 150, 0.34)',
      accentFill: 'rgba(0, 168, 150, 0.08)',
      onAccent: '#001A17',
    },
  },
  {
    id: 'ocean',
    labelRu: 'Океан',
    labelEn: 'Ocean',
    swatch: '#0284C7',
    brand: {
      accent: '#0284C7',
      accentBright: '#38BDF8',
      accentPressed: '#0369A1',
      accentSoft: 'rgba(2, 132, 199, 0.16)',
      accentBorder: 'rgba(56, 189, 248, 0.35)',
      accentFill: 'rgba(2, 132, 199, 0.1)',
      onAccent: '#001018',
    },
  },
  {
    id: 'violet',
    labelRu: 'Ирис',
    labelEn: 'Iris',
    swatch: '#7C3AED',
    brand: {
      accent: '#7C3AED',
      accentBright: '#A78BFA',
      accentPressed: '#6D28D9',
      accentSoft: 'rgba(124, 58, 237, 0.16)',
      accentBorder: 'rgba(167, 139, 250, 0.38)',
      accentFill: 'rgba(124, 58, 237, 0.1)',
      onAccent: '#120822',
    },
  },
  {
    id: 'sunset',
    labelRu: 'Закат',
    labelEn: 'Sunset',
    swatch: '#EA580C',
    brand: {
      accent: '#EA580C',
      accentBright: '#FB923C',
      accentPressed: '#C2410C',
      accentSoft: 'rgba(234, 88, 12, 0.16)',
      accentBorder: 'rgba(251, 146, 60, 0.38)',
      accentFill: 'rgba(234, 88, 12, 0.1)',
      onAccent: '#1A0800',
    },
  },
  {
    id: 'forest',
    labelRu: 'Лес',
    labelEn: 'Forest',
    swatch: '#059669',
    brand: {
      accent: '#059669',
      accentBright: '#34D399',
      accentPressed: '#047857',
      accentSoft: 'rgba(5, 150, 105, 0.16)',
      accentBorder: 'rgba(52, 211, 153, 0.35)',
      accentFill: 'rgba(5, 150, 105, 0.1)',
      onAccent: '#001A0F',
    },
  },
];

export const ACCENT_PRESETS = presets;

export function isAccentPresetId(value: unknown): value is AccentPresetId {
  return typeof value === 'string' && presets.some((p) => p.id === value);
}

export function getAccentPreset(id: AccentPresetId): AccentPreset {
  return presets.find((p) => p.id === id) ?? presets[0];
}
