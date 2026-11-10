import { Dimensions } from 'react-native';

/** Максимальный сдвиг влево (отрицательное значение). */
export const VOICE_SLIDE_MAX = Math.round(-(Dimensions.get('window').width - 72));

/** Подсветка «отмена» (ещё не у края). */
export const VOICE_CANCEL_HINT_X = Math.round(VOICE_SLIDE_MAX * 0.35);

/** Дошли почти до края — мгновенная отмена с корзиной. */
export const VOICE_INSTANT_CANCEL_X = Math.round(VOICE_SLIDE_MAX * 0.92);

export const VOICE_LOCK_SLIDE_Y = -72;

/** Горизонтальный сдвиг для отмены. */
export function clampVoiceSlideX(dx: number): number {
  return Math.max(VOICE_SLIDE_MAX, Math.min(0, dx));
}

/** Вертикальный сдвиг только вверх (к замку), вниз не уезжаем. */
export function clampVoiceSlideY(dy: number): number {
  return Math.max(VOICE_LOCK_SLIDE_Y, Math.min(0, dy));
}

/** Позиция кнопки микрофона: только оси X/Y от якоря, без «прыжка» за pageX/pageY. */
export function voiceMicOrbOffset(
  dx: number,
  dy: number
): { offsetX: number; offsetY: number } {
  const slideX = clampVoiceSlideX(dx);
  const slideY = clampVoiceSlideY(dy);
  const absX = Math.abs(slideX);
  const absY = Math.abs(slideY);

  if (absX <= 6 && absY <= 6) {
    return { offsetX: 0, offsetY: 0 };
  }
  if (absX >= absY) {
    return { offsetX: slideX, offsetY: 0 };
  }
  return { offsetX: 0, offsetY: slideY };
}

export function voiceCancelProgress(slideX: number): number {
  if (slideX >= 0) return 0;
  return Math.min(1, -slideX / -VOICE_SLIDE_MAX);
}

export function shouldInstantCancelVoice(slideX: number): boolean {
  return slideX <= VOICE_INSTANT_CANCEL_X;
}
