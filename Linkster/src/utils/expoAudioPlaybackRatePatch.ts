import { Platform } from 'react-native';

let patched = false;

/**
 * expo-audio на Android: `playbackRate` только getter, без setter.
 * Любое присвоение (в т.ч. из библиотеки) падает — проксируем в setPlaybackRate.
 */
export function patchExpoAudioPlaybackRateOnAndroid(): void {
  if (patched || Platform.OS !== 'android') return;
  patched = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AudioModule = require('expo-audio/build/AudioModule').default as {
      AudioPlayer?: { prototype: AudioPlayerProto };
    };
    const proto = AudioModule?.AudioPlayer?.prototype;
    if (!proto?.setPlaybackRate) return;

    const nativeSet = proto.setPlaybackRate;
    const store = new WeakMap<object, number>();

    Object.defineProperty(proto, 'playbackRate', {
      get(this: object) {
        return store.get(this) ?? 1;
      },
      set(this: object, value: number) {
        const rate = Number(value);
        if (!Number.isFinite(rate)) return;
        store.set(this, rate);
        nativeSet.call(this, rate);
      },
      configurable: true,
    });
  } catch {
    patched = false;
  }
}

type AudioPlayerProto = {
  setPlaybackRate: (rate: number) => void;
};
