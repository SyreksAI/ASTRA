import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
  LayoutAnimation,
  UIManager,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView, type VideoPlayer, type VideoSource } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { chatAudioPlaySource, chatVideoNoteMediaUri } from '../config/api';
import { normalizeLocalUploadUri } from '../utils/chatMedia';
import { talkBrand } from '../theme/talkTheme';
import { useTalkTheme } from '../hooks/useTalkTheme';
import VideoNotePlaybackRing from './VideoNotePlaybackRing';
import VideoNoteCircularScrubOverlay, {
  angleToProgress,
  touchPointToProgress,
} from './VideoNoteCircularScrubOverlay';
import { useVideoNotePlayback } from '../context/VideoNotePlaybackContext';
import { useVoicePlayback } from '../context/VoicePlaybackContext';

const BASE_SIZE = 220;
const ACTIVE_SCALE = 1.42;
const ACTIVE_SIZE = Math.round(BASE_SIZE * ACTIVE_SCALE);
const GLASS_RING = 4;
const WHEEL_SEEK_STEP = 0.35;
/** Сдвиг кружков чуть вправо */
const NUDGE_RIGHT_ME = 10;
const NUDGE_RIGHT_OTHER = 14;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  messageId: string | number;
  conversationId: number;
  senderLabel: string;
  fileUrl?: string | null;
  localPreviewUri?: string;
  token: string | null;
  isMe: boolean;
  timeLabel: string;
  isRead?: boolean;
  pending?: boolean;
  activeVideoId: string | number | null;
  onActivate: (id: string | number | null) => void;
};

type CirclePlayerProps = {
  source: VideoSource;
  playing: boolean;
  innerSize: number;
  onPlayingChange: (v: boolean) => void;
  onEnded: () => void;
  onProgress: (current: number, duration: number) => void;
  onPlayerReady: (player: VideoPlayer) => void;
};

function CircleVideoPlayer({
  source,
  playing,
  innerSize,
  onPlayingChange,
  onEnded,
  onProgress,
  onPlayerReady,
}: CirclePlayerProps) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.muted = false;
    p.timeUpdateEventInterval = 0.08;
  });

  useEffect(() => {
    onPlayerReady(player);
  }, [player, onPlayerReady]);

  useEffect(() => {
    const subPlay = player.addListener('playingChange', ({ isPlaying }) => {
      onPlayingChange(isPlaying);
    });
    const subEnd = player.addListener('playToEnd', () => {
      onPlayingChange(false);
      onEnded();
    });
    const subTime = player.addListener('timeUpdate', ({ currentTime }) => {
      onProgress(currentTime, player.duration);
    });
    return () => {
      subPlay.remove();
      subEnd.remove();
      subTime.remove();
    };
  }, [player, onPlayingChange, onEnded, onProgress]);

  useEffect(() => {
    if (playing) {
      void player.play();
    } else {
      player.pause();
    }
  }, [playing, player]);

  return (
    <VideoView
      style={{ width: innerSize, height: innerSize }}
      player={player}
      contentFit="cover"
      nativeControls={false}
      pointerEvents="none"
    />
  );
}

function ChatVideoNoteMessage({
  messageId,
  conversationId,
  senderLabel,
  fileUrl,
  localPreviewUri,
  token,
  isMe,
  timeLabel,
  isRead,
  pending,
  activeVideoId,
  onActivate,
}: Props) {
  const { isDark } = useTalkTheme();
  const videoNote = useVideoNotePlayback();
  const voice = useVoicePlayback();
  const { publishSession, registerController, isActiveMessage } = videoNote;
  const localUri = localPreviewUri ? normalizeLocalUploadUri(localPreviewUri) : null;
  const playSource = useMemo((): VideoSource | null => {
    const remote = chatAudioPlaySource(fileUrl, token);
    if (remote?.uri) return remote;
    if (localUri) return { uri: localUri };
    return null;
  }, [fileUrl, token, localUri]);

  const mediaUri = useMemo(
    () => chatVideoNoteMediaUri(fileUrl, localUri, token),
    [fileUrl, localUri, token]
  );

  const [posterUri, setPosterUri] = useState<string | null>(null);
  const [posterFailed, setPosterFailed] = useState(false);
  const [playerMounted, setPlayerMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [playSession, setPlaySession] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubPreview, setScrubPreview] = useState(0);

  const playerRef = useRef<VideoPlayer | null>(null);
  const scrubHostRef = useRef<View>(null);
  const scrubbingGestureRef = useRef(false);
  const tapMovedRef = useRef(false);
  const progressRef = useRef(0);
  const showScrubBarRef = useRef(false);
  const toggleRef = useRef<() => void>(() => {});

  const isActive = activeVideoId === messageId;
  const displaySize = isActive ? ACTIVE_SIZE : BASE_SIZE;
  const innerSize = displaySize - GLASS_RING * 2;
  const displayTime = scrubbing ? scrubPreview : currentTime;
  const progress = duration > 0 ? displayTime / duration : 0;
  const showScrubBar = isActive && !playing && playerMounted && duration > 0 && !pending;
  const accent = isDark ? talkBrand.accentBright : talkBrand.accent;
  progressRef.current = progress;
  showScrubBarRef.current = showScrubBar;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [isActive]);

  useEffect(() => {
    if (localUri && pending) setPlayerMounted(true);
  }, [localUri, pending]);

  useEffect(() => {
    setPosterUri(null);
    setPosterFailed(false);
    if (!mediaUri) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(mediaUri, {
          time: 400,
          quality: 0.82,
        });
        if (!cancelled) setPosterUri(uri);
      } catch {
        if (!cancelled) setPosterFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mediaUri]);

  useEffect(() => {
    if (activeVideoId != null && activeVideoId !== messageId) {
      setPlaying(false);
      setScrubbing(false);
    }
  }, [activeVideoId, messageId]);

  const seekToTime = useCallback(
    (t: number) => {
      const player = playerRef.current;
      if (!player || duration <= 0) return;
      const clamped = Math.max(0, Math.min(duration, t));
      player.currentTime = clamped;
      setCurrentTime(clamped);
      setScrubPreview(clamped);
    },
    [duration]
  );

  const seekToFraction = useCallback(
    (f: number) => {
      if (duration <= 0) return;
      seekToTime(f * duration);
    },
    [duration, seekToTime]
  );

  const stopFromMiniPlayer = useCallback(() => {
    setPlaying(false);
    playerRef.current?.pause();
    onActivate(null);
  }, [onActivate]);

  const onPlayerReady = useCallback((player: VideoPlayer) => {
    playerRef.current = player;
  }, []);

  const onProgress = useCallback(
    (current: number, dur: number) => {
      if (dur > 0) setDuration(dur);
      if (!scrubbing) setCurrentTime(current);
    },
    [scrubbing]
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || !showScrubBar) return undefined;
    const node = scrubHostRef.current as unknown as HTMLElement | null;
    if (!node) return undefined;

    const onWheel = (e: WheelEvent) => {
      if (duration <= 0) return;
      e.preventDefault();
      e.stopPropagation();
      const dir = e.deltaY > 0 ? 1 : -1;
      seekToTime(currentTime + dir * WHEEL_SEEK_STEP);
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [showScrubBar, duration, currentTime, seekToTime]);

  const toggle = useCallback(() => {
    if (!playSource || pending) return;

    const isPlayingNow = playing || Boolean(playerRef.current?.playing);
    if (isPlayingNow) {
      setPlaying(false);
      playerRef.current?.pause();
      onActivate(messageId);
      return;
    }

    voice.stop();
    onActivate(messageId);
    if (ended) {
      setEnded(false);
      setPlaySession((n) => n + 1);
      setCurrentTime(0);
    } else {
      const resumeAt = currentTime;
      if (playerRef.current && resumeAt > 0.05) {
        playerRef.current.currentTime = resumeAt;
      }
    }
    if (!playerMounted) setPlayerMounted(true);
    setPlaying(true);
  }, [playSource, pending, playing, onActivate, messageId, ended, playerMounted, currentTime, voice]);

  toggleRef.current = toggle;

  useEffect(() => {
    if (!isActive || !playerMounted || pending) {
      if (isActiveMessage(messageId)) {
        publishSession(null);
      }
      registerController(messageId, null);
      return;
    }
    registerController(messageId, {
      toggle: () => toggleRef.current(),
      stop: stopFromMiniPlayer,
      seekToFraction,
    });
    return () => registerController(messageId, null);
  }, [
    isActive,
    playerMounted,
    pending,
    messageId,
    seekToFraction,
    stopFromMiniPlayer,
    publishSession,
    registerController,
    isActiveMessage,
  ]);

  useEffect(() => {
    if (!isActive || !playerMounted || pending) {
      if (isActiveMessage(messageId)) {
        publishSession(null);
      }
      return;
    }
    const t = scrubbing ? scrubPreview : currentTime;
    publishSession({
      messageId,
      conversationId,
      senderLabel,
      timeLabel,
      playing,
      currentTime: t,
      duration,
    });
  }, [
    isActive,
    playerMounted,
    pending,
    messageId,
    conversationId,
    senderLabel,
    timeLabel,
    playing,
    currentTime,
    scrubPreview,
    scrubbing,
    duration,
    publishSession,
    isActiveMessage,
  ]);

  const circlePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => scrubbingGestureRef.current,
        onPanResponderGrant: (evt) => {
          tapMovedRef.current = false;
          const x = evt.nativeEvent.locationX;
          const y = evt.nativeEvent.locationY;
          if (showScrubBarRef.current) {
            const f = touchPointToProgress(x, y, displaySize, progressRef.current);
            if (f != null) {
              scrubbingGestureRef.current = true;
              setScrubbing(true);
              seekToFraction(f);
            }
          }
        },
        onPanResponderMove: (evt, g) => {
          if (scrubbingGestureRef.current) {
            tapMovedRef.current = true;
            const x = evt.nativeEvent.locationX + g.dx;
            const y = evt.nativeEvent.locationY + g.dy;
            seekToFraction(angleToProgress(x, y, displaySize));
            return;
          }
          if (Math.hypot(g.dx, g.dy) > 8) tapMovedRef.current = true;
        },
        onPanResponderRelease: () => {
          if (scrubbingGestureRef.current) {
            scrubbingGestureRef.current = false;
            setScrubbing(false);
            return;
          }
          if (!tapMovedRef.current) toggleRef.current();
        },
        onPanResponderTerminate: () => {
          scrubbingGestureRef.current = false;
          setScrubbing(false);
        },
      }),
    [displaySize, seekToFraction]
  );

  const hasMedia = Boolean(playSource);
  const showPlayer = playerMounted && playSource;
  const showPoster = Boolean(posterUri && (!playerMounted || (ended && !playing)));
  const showPlayOverlay = !playing && !pending && (!playerMounted || ended);

  const nudgeStyle = isMe
    ? { marginRight: NUDGE_RIGHT_ME, marginLeft: 0 }
    : { marginLeft: NUDGE_RIGHT_OTHER, marginRight: 0 };

  const activeSpacing = isActive
    ? { marginTop: 10, marginBottom: 14 }
    : { marginTop: 2, marginBottom: 6 };

  return (
    <View
      style={[
        styles.wrap,
        { width: displaySize },
        nudgeStyle,
        activeSpacing,
        isMe ? styles.wrapMe : styles.wrapOther,
      ]}
    >
      <View
        ref={scrubHostRef}
        style={[styles.ringHost, { width: displaySize, height: displaySize }]}
        {...circlePan.panHandlers}
      >
        <View style={{ width: displaySize, height: displaySize }}>
          {isActive && playing ? (
            <VideoNotePlaybackRing
              size={displaySize}
              progress={progress}
              progressColor={accent}
              trackColor={isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)'}
            />
          ) : null}
          <View
            style={{
              width: displaySize,
              height: displaySize,
              borderRadius: displaySize / 2,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {Platform.OS === 'ios' ? (
              <BlurView
                intensity={isDark ? 48 : 56}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  isDark ? styles.glassAndroidDark : styles.glassAndroidLight,
                ]}
              />
            )}
            <View
              style={[
                styles.glassTint,
                isDark ? styles.glassTintDark : styles.glassTintLight,
              ]}
              pointerEvents="none"
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: GLASS_RING,
                top: GLASS_RING,
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
                overflow: 'hidden',
                backgroundColor: 'rgba(0, 0, 0, 0.12)',
              }}
            >
              {pending && !hasMedia ? (
                <View style={[styles.pendingFill, { width: innerSize, height: innerSize }]}>
                  <ActivityIndicator color={talkBrand.accent} />
                </View>
              ) : hasMedia ? (
                <>
                  {showPoster ? (
                    <Image
                      source={{ uri: posterUri! }}
                      style={{ width: innerSize, height: innerSize }}
                      resizeMode="cover"
                    />
                  ) : null}
                  {!posterUri && !showPlayer && !posterFailed ? (
                    <View style={[styles.pendingFill, { width: innerSize, height: innerSize }]}>
                      <ActivityIndicator color={talkBrand.accent} />
                    </View>
                  ) : null}
                  {!posterUri && posterFailed && !showPlayer ? (
                    <View style={[styles.pendingFill, { width: innerSize, height: innerSize }]}>
                      <Ionicons name="videocam" size={40} color="#64748b" />
                    </View>
                  ) : null}
                  {showPlayer ? (
                    <CircleVideoPlayer
                      key={playSession}
                      source={playSource}
                      innerSize={innerSize}
                      playing={playing}
                      onPlayingChange={setPlaying}
                      onEnded={() => {
                        setEnded(true);
                        setPlaying(false);
                        onActivate(null);
                      }}
                      onProgress={onProgress}
                      onPlayerReady={onPlayerReady}
                    />
                  ) : null}
                  {showPlayOverlay ? (
                    <View style={styles.playOverlay} pointerEvents="none">
                      <Ionicons name="play" size={36} color="#fff" style={{ marginLeft: 4 }} />
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={[styles.pendingFill, { width: innerSize, height: innerSize }]}>
                  <Ionicons name="videocam-outline" size={36} color="#8b98a5" />
                  <Text style={styles.missingHint}>Нет видео</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {showScrubBar ? (
          <VideoNoteCircularScrubOverlay
            size={displaySize}
            progress={progress}
            progressColor={accent}
            trackColor={isDark ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.55)'}
          />
        ) : null}
      </View>

      <View style={[styles.metaRow, { width: displaySize }]} pointerEvents="none">
        <Text style={styles.metaTime}>{timeLabel}</Text>
        {isMe ? (
          <Ionicons
            name={pending ? 'time-outline' : isRead ? 'checkmark-done' : 'checkmark'}
            size={13}
            color={pending ? '#8b98a5' : isRead ? talkBrand.accent : '#8b98a5'}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: ACTIVE_SIZE + 20,
    overflow: 'hidden',
  },
  wrapMe: { alignSelf: 'flex-end' },
  wrapOther: { alignSelf: 'flex-start' },
  ringHost: {
    alignSelf: 'center',
    position: 'relative',
  },
  glassTint: {
    ...StyleSheet.absoluteFill,
  },
  glassTintDark: {
    backgroundColor: 'rgba(15, 22, 34, 0.28)',
  },
  glassTintLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  glassAndroidDark: {
    backgroundColor: 'rgba(15, 22, 34, 0.52)',
  },
  glassAndroidLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingFill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  missingHint: { color: '#8b98a5', fontSize: 12 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
    alignSelf: 'center',
  },
  metaTime: {
    color: '#8b98a5',
    fontSize: 11,
    fontWeight: '500',
  },
});

export default React.memo(ChatVideoNoteMessage);
