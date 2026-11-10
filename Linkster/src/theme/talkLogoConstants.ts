/** Canvas size of logo-light.png / logo-dark.png (normalized pair) */
export const TALK_LOGO_ASPECT = 880 / 180;

export function talkLogoHeightForWidth(width: number): number {
  return width / TALK_LOGO_ASPECT;
}

export const TALK_WORDMARK_HEADER_WIDTH = 142;

/** Главный экран мессенджера — крупный wordmark у левого края */
export const TALK_WORDMARK_HUB_WIDTH = 196;
