import { talkBrand } from './talkTheme';

/** Акцент UI — читает talkBrand в рантайме (после смены пресета в настройках). */
export function uiAccentBright(): string {
  return talkBrand.accentBright;
}

export function uiAccent(): string {
  return talkBrand.accent;
}

export function uiAccentPressed(): string {
  return talkBrand.accentPressed;
}

export function uiAccentStrong(): string {
  return talkBrand.accentPressed;
}
