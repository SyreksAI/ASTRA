/** Общая геометрия нижней панели чата (поле ввода + запись голоса). */
export const COMPOSER_BAR_PADDING_TOP = 8;
export const COMPOSER_BAR_PADDING_H = 10;
export const COMPOSER_BAR_ROW_HEIGHT = 44;
export const COMPOSER_BTN_SIZE = 44;

/** Сдвиг панели записи вниз (Modal / safe area vs measureInWindow). */
export const VOICE_RECORD_OVERLAY_TOP_NUDGE = 24;

/** Высота оверлея записи = панель композера (поле ввода + safe area), не выше. */
export function voiceRecordOverlayPanelHeight(
  paddingBottom: number,
  measuredHeight?: number
): number {
  const standard = composerBarContentHeight(paddingBottom);
  if (!measuredHeight || measuredHeight <= 0) return standard;
  return Math.min(measuredHeight, standard);
}

export type ComposerMicAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ComposerPanelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Экранные координаты кнопки микрофона — как в `ChatComposer` (правая колонка, верх ряда). */
export function composerMicScreenRect(
  panel: ComposerPanelRect,
  paddingBottom: number
): ComposerMicAnchor {
  const rowHeight = panel.height - COMPOSER_BAR_PADDING_TOP - paddingBottom;
  const yOffset =
    rowHeight > COMPOSER_BTN_SIZE
      ? COMPOSER_BAR_PADDING_TOP + (rowHeight - COMPOSER_BTN_SIZE)
      : COMPOSER_BAR_PADDING_TOP;
  return {
    x: panel.x + panel.width - COMPOSER_BAR_PADDING_H - COMPOSER_BTN_SIZE,
    y: panel.y + yOffset,
    width: COMPOSER_BTN_SIZE,
    height: COMPOSER_BTN_SIZE,
  };
}

export function composerBarContentHeight(paddingBottom: number): number {
  return COMPOSER_BAR_PADDING_TOP + COMPOSER_BAR_ROW_HEIGHT + paddingBottom;
}

/** Микрофон в строке оверлея записи (ряд 44px под paddingTop, по центру). */
export function voiceRecordMicScreenRect(panel: ComposerPanelRect): ComposerMicAnchor {
  return {
    x: panel.x + panel.width - COMPOSER_BAR_PADDING_H - COMPOSER_BTN_SIZE,
    y:
      panel.y +
      COMPOSER_BAR_PADDING_TOP +
      (COMPOSER_BAR_ROW_HEIGHT - COMPOSER_BTN_SIZE) / 2,
    width: COMPOSER_BTN_SIZE,
    height: COMPOSER_BTN_SIZE,
  };
}
