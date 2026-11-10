import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { MiniPlayerHost } from './VoicePlaybackContext';

export type VideoNoteSession = {
  messageId: string | number;
  conversationId: number;
  senderLabel: string;
  timeLabel: string;
  playing: boolean;
  currentTime: number;
  duration: number;
};

type VideoNoteController = {
  toggle: () => void;
  stop: () => void;
  seekToFraction: (fraction: number) => void;
};

export type VideoNoteChatBridge = {
  openConversation: (conversationId: number) => Promise<void>;
  ensureMessageLoaded: (messageId: string | number) => Promise<boolean>;
  scrollToMessage: (messageId: string | number) => Promise<void>;
};

type VideoNotePlaybackContextValue = {
  session: VideoNoteSession | null;
  miniPlayerHost: MiniPlayerHost;
  miniPlayerTop: number | null;
  seeking: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  setMiniPlayerHost: (host: MiniPlayerHost) => void;
  setMiniPlayerTop: (top: number | null) => void;
  publishSession: (next: VideoNoteSession | null) => void;
  registerController: (messageId: string | number, controller: VideoNoteController | null) => void;
  toggleCurrent: () => void;
  stop: () => void;
  beginScrub: () => void;
  scrubToFraction: (fraction: number) => void;
  endScrub: (fraction: number) => void;
  registerChatBridge: (bridge: VideoNoteChatBridge | null) => void;
  openActiveVideoNote: () => Promise<void>;
  isActiveMessage: (id: string | number) => boolean;
};

const VideoNotePlaybackContext = createContext<VideoNotePlaybackContextValue | null>(null);

export function VideoNotePlaybackProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<VideoNoteSession | null>(null);
  const [miniPlayerHost, setMiniPlayerHost] = useState<MiniPlayerHost>('chatList');
  const [miniPlayerTop, setMiniPlayerTop] = useState<number | null>(null);
  const [seeking, setSeeking] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);

  const sessionRef = useRef<VideoNoteSession | null>(null);
  const controllerRef = useRef<VideoNoteController | null>(null);
  const controllerMessageIdRef = useRef<string | number | null>(null);
  const bridgeRef = useRef<VideoNoteChatBridge | null>(null);
  const scrubWasPlayingRef = useRef(false);

  sessionRef.current = session;

  const publishSession = useCallback((next: VideoNoteSession | null) => {
    setSession(next);
  }, []);

  const registerController = useCallback(
    (messageId: string | number, controller: VideoNoteController | null) => {
      if (controller) {
        controllerRef.current = controller;
        controllerMessageIdRef.current = messageId;
        return;
      }
      if (controllerMessageIdRef.current === messageId) {
        controllerRef.current = null;
        controllerMessageIdRef.current = null;
      }
    },
    []
  );

  const registerChatBridge = useCallback((bridge: VideoNoteChatBridge | null) => {
    bridgeRef.current = bridge;
  }, []);

  const stop = useCallback(() => {
    controllerRef.current?.stop();
    controllerRef.current = null;
    controllerMessageIdRef.current = null;
    setSession(null);
    setSeeking(false);
  }, []);

  const toggleCurrent = useCallback(() => {
    controllerRef.current?.toggle();
  }, []);

  const beginScrub = useCallback(() => {
    const s = sessionRef.current;
    scrubWasPlayingRef.current = s?.playing ?? false;
    setSeeking(true);
    if (s) setScrubTime(s.currentTime);
  }, []);

  const scrubToFraction = useCallback((fraction: number) => {
    const s = sessionRef.current;
    const dur = s?.duration ?? 0;
    if (dur <= 0) return;
    const t = Math.max(0, Math.min(dur, fraction * dur));
    setScrubTime(t);
    controllerRef.current?.seekToFraction(fraction);
  }, []);

  const endScrub = useCallback((fraction: number) => {
    scrubToFraction(fraction);
    setSeeking(false);
  }, [scrubToFraction]);

  const openActiveVideoNote = useCallback(async () => {
    const s = sessionRef.current;
    const bridge = bridgeRef.current;
    if (!s || !bridge) return;
    await bridge.openConversation(s.conversationId);
    await bridge.ensureMessageLoaded(s.messageId);
    await bridge.scrollToMessage(s.messageId);
  }, []);

  const isActiveMessage = useCallback((id: string | number) => {
    return session != null && String(session.messageId) === String(id);
  }, [session]);

  const playing = session?.playing ?? false;
  const duration = session?.duration ?? 0;
  const currentTime = seeking ? scrubTime : session?.currentTime ?? 0;

  const value = useMemo(
    (): VideoNotePlaybackContextValue => ({
      session,
      miniPlayerHost,
      miniPlayerTop,
      seeking,
      playing,
      currentTime,
      duration,
      setMiniPlayerHost,
      setMiniPlayerTop,
      publishSession,
      registerController,
      toggleCurrent,
      stop,
      beginScrub,
      scrubToFraction,
      endScrub,
      registerChatBridge,
      openActiveVideoNote,
      isActiveMessage,
    }),
    [
      session,
      miniPlayerHost,
      miniPlayerTop,
      seeking,
      playing,
      currentTime,
      duration,
      publishSession,
      registerController,
      toggleCurrent,
      stop,
      beginScrub,
      scrubToFraction,
      endScrub,
      registerChatBridge,
      openActiveVideoNote,
      isActiveMessage,
    ]
  );

  return (
    <VideoNotePlaybackContext.Provider value={value}>{children}</VideoNotePlaybackContext.Provider>
  );
}

export function useVideoNotePlayback() {
  const ctx = useContext(VideoNotePlaybackContext);
  if (!ctx) {
    throw new Error('useVideoNotePlayback must be used within VideoNotePlaybackProvider');
  }
  return ctx;
}
