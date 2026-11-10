/** Псевдо-волна, стабильная для id сообщения (как в TG/WA). */
export function voiceWaveformBars(seed: string | number, count = 38): number[] {
  let h = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const t = ((h >>> 0) % 1000) / 1000;
    bars.push(3 + t * 15);
  }
  return bars;
}

const durationCache = new Map<string, number>();

export function cacheVoiceDuration(messageId: string | number, seconds: number): void {
  if (seconds > 0 && Number.isFinite(seconds)) {
    durationCache.set(String(messageId), seconds);
  }
}

export function getCachedVoiceDuration(messageId: string | number): number | undefined {
  return durationCache.get(String(messageId));
}

/** Ширина «пузыря» голосового от длительности (сек). */
export function voiceBubbleWidth(durationSec: number): number {
  const min = 196;
  const max = 292;
  if (!durationSec || durationSec <= 0) return min;
  const extra = Math.min(96, Math.max(0, durationSec - 1) * 3.2);
  return Math.round(Math.min(max, min + extra));
}
