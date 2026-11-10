import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { cacheVoiceDuration } from '../utils/voiceWaveform';
import { patchExpoAudioPlaybackRateOnAndroid } from '../utils/expoAudioPlaybackRatePatch';

patchExpoAudioPlaybackRateOnAndroid();

type AudioSource = { uri: string; headers?: Record<string, string> };

export type VoiceNowPlaying = {
  senderLabel: string;
  timeLabel: string;
};

export type VoicePlayMeta = VoiceNowPlaying;

export type VoiceTrack = {
  messageId: string | number;
  conversationId: number;
  source: AudioSource;
  meta: VoicePlayMeta;
  fileUrl?: string | null;
  localPreviewUri?: string | null;
  createdAt?: string | null;
};

export type MiniPlayerHost = 'chatList' | 'openChat' | 'global';

export type VoiceChatBridge = {
  openConversation: (conversationId: number) => Promise<void>;
  ensureMessageLoaded: (messageId: string | number) => Promise<boolean>;
  scrollToMessage: (messageId: string | number) => Promise<void>;
  buildFollowingTracks: (messageId: string | number) => VoiceTrack[];
};

type VoicePlaybackContextValue = {
  activeId: string | number | null;
  conversationId: number | null;
  nowPlaying: VoiceNowPlaying | null;
  miniPlayerHost: MiniPlayerHost;
  miniPlayerTop: number | null;
  playing: boolean;
  buffering: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  seeking: boolean;
  queueAutoAdvance: boolean;
  highlightedMessageId: string | number | null;
  highlightGeneration: number;
  play: (id: string | number, source: AudioSource, meta?: VoicePlayMeta) => void;
  playTrack: (track: VoiceTrack, opts?: { followingQueue?: VoiceTrack[] }) => void;
  pause: () => void;
  stop: () => void;
  toggle: (id: string | number, source: AudioSource, meta?: VoicePlayMeta) => void;
  toggleTrack: (track: VoiceTrack, opts?: { followingQueue?: VoiceTrack[] }) => void;
  toggleCurrent: () => void;
  seekTo: (seconds: number, opts?: { resume?: boolean }) => Promise<void>;
  beginScrub: () => void;
  scrubToFraction: (fraction: number) => void;
  endScrub: (fraction: number) => Promise<void>;
  resume: () => void;
  cycleSpeed: () => void;
  isActive: (id: string | number) => boolean;
  setMiniPlayerHost: (host: MiniPlayerHost) => void;
  setMiniPlayerTop: (top: number | null) => void;
  registerChatBridge: (bridge: VoiceChatBridge | null) => void;
  openActiveVoiceMessage: () => Promise<void>;
  triggerHighlight: (messageId: string | number) => void;
};

const VoicePlaybackContext = createContext<VoicePlaybackContextValue | null>(null);

const SPEEDS = [1, 1.5, 2] as const;

function safeSetPlaybackRate(
  player: { setPlaybackRate: (rate: number) => void; playbackRate?: number },
  rate: number
): void {
  try {
    if (Platform.OS === 'android' && 'playbackRate' in player) {
      (player as { playbackRate: number }).playbackRate = rate;
      return;
    }
    player.setPlaybackRate(rate);
  } catch {
    try {
      player.setPlaybackRate(rate);
    } catch {
      /* ignore */
    }
  }
}

export function VoicePlaybackProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 100, downloadFirst: true });
  const status = useAudioPlayerStatus(player);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [nowPlaying, setNowPlaying] = useState<VoiceNowPlaying | null>(null);
  const [miniPlayerHost, setMiniPlayerHost] = useState<MiniPlayerHost>('chatList');
  const [miniPlayerTop, setMiniPlayerTop] = useState<number | null>(null);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | number | null>(null);
  const [highlightGeneration, setHighlightGeneration] = useState(0);

  const activeIdRef = useRef<string | number | null>(null);
  const conversationIdRef = useRef<number | null>(null);
  const activeSourceRef = useRef<AudioSource | null>(null);
  const activeTrackRef = useRef<VoiceTrack | null>(null);
  const speedIdxRef = useRef(0);
  const finishHandledRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const queueRef = useRef<VoiceTrack[]>([]);
  const autoAdvanceRef = useRef(false);
  const bridgeRef = useRef<VoiceChatBridge | null>(null);
  const playGenRef = useRef(0);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrubWasPlayingRef = useRef(false);

  const clearSession = useCallback(() => {
    setActiveId(null);
    setConversationId(null);
    setNowPlaying(null);
    activeSourceRef.current = null;
    activeTrackRef.current = null;
    queueRef.current = [];
    autoAdvanceRef.current = false;
  }, []);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    speedIdxRef.current = speedIdx;
  }, [speedIdx]);

  useEffect(() => {
    if (status.playing) {
      wasPlayingRef.current = true;
    }
  }, [status.playing]);

  useEffect(() => {
    if (!status.didJustFinish) {
      finishHandledRef.current = false;
    }
  }, [status.didJustFinish]);

  useEffect(() => {
    if (!status.playing) return;
    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    }).catch(() => {});
  }, [status.playing]);

  useEffect(() => {
    if (status.duration > 0 && activeId != null) {
      cacheVoiceDuration(activeId, status.duration);
    }
  }, [status.duration, activeId]);

  const applySpeed = useCallback(
    (idx: number) => {
      safeSetPlaybackRate(player, SPEEDS[idx] ?? 1);
    },
    [player]
  );

  const playTrackInternal = useCallback(
    (track: VoiceTrack, opts?: { followingQueue?: VoiceTrack[]; keepSpeed?: boolean }) => {
      const gen = ++playGenRef.current;
      finishHandledRef.current = false;
      activeTrackRef.current = track;
      activeSourceRef.current = track.source;
      setNowPlaying(track.meta);
      setActiveId(track.messageId);
      setConversationId(track.conversationId);
      if (!opts?.keepSpeed) {
        setSpeedIdx(0);
        safeSetPlaybackRate(player, 1);
      } else {
        applySpeed(speedIdxRef.current);
      }
      if (opts?.followingQueue !== undefined) {
        queueRef.current = opts.followingQueue;
        autoAdvanceRef.current = opts.followingQueue.length > 0;
      } else if (!opts?.keepSpeed) {
        queueRef.current = [];
        autoAdvanceRef.current = false;
      }
      player.loop = false;
      player.replace(track.source);
      if (gen !== playGenRef.current) return;
      player.play();
    },
    [player, applySpeed]
  );

  const playNextInQueue = useCallback(() => {
    autoAdvanceRef.current = queueRef.current.length > 0;
    while (queueRef.current.length > 0) {
      const next = queueRef.current.shift();
      if (!next?.source?.uri) continue;
      autoAdvanceRef.current = queueRef.current.length > 0;
      playTrackInternal(next, { keepSpeed: true });
      return;
    }
    player.pause();
    void player.seekTo(0);
    safeSetPlaybackRate(player, 1);
    setSpeedIdx(0);
    clearSession();
  }, [player, clearSession, playTrackInternal]);

  useEffect(() => {
    if (!status.didJustFinish || activeId == null) return;
    if (finishHandledRef.current) return;
    if (!wasPlayingRef.current) return;
    finishHandledRef.current = true;
    player.pause();
    void player.seekTo(0);
    wasPlayingRef.current = false;
    if (autoAdvanceRef.current && queueRef.current.length > 0) {
      playNextInQueue();
      return;
    }
    safeSetPlaybackRate(player, 1);
    setSpeedIdx(0);
    clearSession();
  }, [status.didJustFinish, activeId, player, clearSession, playNextInQueue]);

  const play = useCallback(
    (id: string | number, source: AudioSource, meta?: VoicePlayMeta) => {
      finishHandledRef.current = false;
      activeSourceRef.current = source;
      activeTrackRef.current = null;
      queueRef.current = [];
      autoAdvanceRef.current = false;
      if (meta) setNowPlaying(meta);
      setActiveId(id);
      setConversationId(null);
      setSpeedIdx(0);
      player.loop = false;
      player.replace(source);
      safeSetPlaybackRate(player, 1);
      player.play();
    },
    [player]
  );

  const playTrack = useCallback(
    (track: VoiceTrack, opts?: { followingQueue?: VoiceTrack[] }) => {
      playTrackInternal(track, opts);
    },
    [playTrackInternal]
  );

  const pause = useCallback(() => {
    wasPlayingRef.current = false;
    player.pause();
  }, [player]);

  const stop = useCallback(() => {
    playGenRef.current += 1;
    wasPlayingRef.current = false;
    player.pause();
    void player.seekTo(0);
    safeSetPlaybackRate(player, 1);
    setSpeedIdx(0);
    setSeeking(false);
    clearSession();
  }, [player, clearSession]);

  const toggle = useCallback(
    (id: string | number, source: AudioSource, meta?: VoicePlayMeta) => {
      if (activeId === id) {
        if (status.playing) {
          pause();
          return;
        }
        applySpeed(speedIdxRef.current);
        player.play();
        return;
      }
      play(id, source, meta);
    },
    [activeId, status.playing, pause, play, player, applySpeed]
  );

  const toggleTrack = useCallback(
    (track: VoiceTrack, opts?: { followingQueue?: VoiceTrack[] }) => {
      if (activeId === track.messageId) {
        if (status.playing) {
          pause();
          return;
        }
        applySpeed(speedIdxRef.current);
        player.play();
        return;
      }
      playTrackInternal(track, opts);
    },
    [activeId, status.playing, pause, playTrackInternal, player, applySpeed]
  );

  const toggleCurrent = useCallback(() => {
    const track = activeTrackRef.current;
    const id = activeIdRef.current;
    const source = activeSourceRef.current;
    if (track) {
      toggleTrack(track);
      return;
    }
    if (id == null || !source) return;
    toggle(id, source);
  }, [toggle, toggleTrack]);

  const resume = useCallback(() => {
    if (activeIdRef.current == null) return;
    applySpeed(speedIdxRef.current);
    player.play();
  }, [player, applySpeed]);

  const seekTo = useCallback(
    async (seconds: number, opts?: { resume?: boolean }) => {
      await player.seekTo(seconds);
      if (opts?.resume && activeIdRef.current != null && !player.playing) {
        applySpeed(speedIdxRef.current);
        player.play();
      }
    },
    [player, applySpeed]
  );

  const beginScrub = useCallback(() => {
    scrubWasPlayingRef.current = status.playing;
    setSeeking(true);
    setScrubTime(status.currentTime);
  }, [status.currentTime, status.playing]);

  const scrubToFraction = useCallback(
    (fraction: number) => {
      const dur = status.duration > 0 ? status.duration : scrubTime || 0;
      if (dur <= 0) return;
      const t = Math.max(0, Math.min(dur, fraction * dur));
      setScrubTime(t);
    },
    [status.duration, scrubTime]
  );

  const endScrub = useCallback(
    async (fraction: number) => {
      const dur = status.duration > 0 ? status.duration : 0;
      setSeeking(false);
      if (dur <= 0 || activeIdRef.current == null) return;
      const target = Math.max(0, Math.min(dur, fraction * dur));
      await seekTo(target, { resume: scrubWasPlayingRef.current });
      setScrubTime(target);
    },
    [status.duration, status.playing, seekTo]
  );

  const cycleSpeed = useCallback(() => {
    if (activeId == null) return;
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    applySpeed(next);
    if (!status.playing) {
      player.play();
    }
  }, [activeId, speedIdx, status.playing, applySpeed, player]);

  const registerChatBridge = useCallback((bridge: VoiceChatBridge | null) => {
    bridgeRef.current = bridge;
  }, []);

  const triggerHighlight = useCallback((messageId: string | number) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedMessageId(messageId);
    setHighlightGeneration((g) => g + 1);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2600);
  }, []);

  const openActiveVoiceMessage = useCallback(async () => {
    const bridge = bridgeRef.current;
    const messageId = activeIdRef.current;
    const convId = conversationIdRef.current;
    if (!bridge || messageId == null || convId == null) return;
    await bridge.openConversation(convId);
    const loaded = await bridge.ensureMessageLoaded(messageId);
    if (!loaded) return;
    await bridge.scrollToMessage(messageId);
    triggerHighlight(messageId);
  }, [triggerHighlight]);

  const displayTime =
    seeking && status.duration > 0
      ? scrubTime
      : activeId != null
        ? status.currentTime
        : 0;

  const value = useMemo(
    (): VoicePlaybackContextValue => ({
      activeId,
      conversationId,
      nowPlaying,
      miniPlayerHost,
      miniPlayerTop,
      playing: Boolean(activeId != null && status.playing),
      buffering: status.isBuffering,
      currentTime: displayTime,
      duration: status.duration,
      playbackRate: SPEEDS[speedIdx] ?? 1,
      seeking,
      queueAutoAdvance: autoAdvanceRef.current,
      highlightedMessageId,
      highlightGeneration,
      play,
      playTrack,
      pause,
      stop,
      toggle,
      toggleTrack,
      toggleCurrent,
      seekTo,
      beginScrub,
      scrubToFraction,
      endScrub,
      resume,
      cycleSpeed,
      isActive: (id) => activeId === id,
      setMiniPlayerHost,
      setMiniPlayerTop,
      registerChatBridge,
      openActiveVoiceMessage,
      triggerHighlight,
    }),
    [
      activeId,
      conversationId,
      nowPlaying,
      miniPlayerHost,
      miniPlayerTop,
      status,
      speedIdx,
      seeking,
      displayTime,
      highlightedMessageId,
      highlightGeneration,
      play,
      playTrack,
      pause,
      stop,
      toggle,
      toggleTrack,
      toggleCurrent,
      seekTo,
      beginScrub,
      scrubToFraction,
      endScrub,
      resume,
      cycleSpeed,
      registerChatBridge,
      openActiveVoiceMessage,
      triggerHighlight,
    ]
  );

  return (
    <VoicePlaybackContext.Provider value={value}>{children}</VoicePlaybackContext.Provider>
  );
}

export function useVoicePlayback() {
  const ctx = useContext(VoicePlaybackContext);
  if (!ctx) {
    throw new Error('useVoicePlayback must be used within VoicePlaybackProvider');
  }
  return ctx;
}
