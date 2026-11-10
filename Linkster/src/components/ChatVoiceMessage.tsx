import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  PanResponder,
  type GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatAudioPlaySource } from '../config/api';
import { normalizeLocalUploadUri } from '../utils/chatMedia';
import { talkAccentAlpha, talkBrand } from '../theme/talkTheme';
import { useVoicePlayback, type VoiceTrack } from '../context/VoicePlaybackContext';
import {
  voiceWaveformBars,
  getCachedVoiceDuration,
  cacheVoiceDuration,
  voiceBubbleWidth,
} from '../utils/voiceWaveform';

const ACCENT = talkBrand.accent;

type Props = {
  messageId: string | number;
  fileUrl?: string | null;
  localPreviewUri?: string | null;
  token: string | null;
  isMe: boolean;
  isDark: boolean;
  timeLabel: string;
  senderName?: string | null;
  isRead?: boolean;
  durationSec?: number | null;
  pending?: boolean;
  track?: VoiceTrack | null;
  conversationId?: number | null;
  buildFollowingTracks?: (messageId: string | number) => VoiceTrack[];
};

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function ChatVoiceMessage({
  messageId,
  fileUrl,
  localPreviewUri,
  token,
  isMe,
  isDark,
  timeLabel,
  senderName,
  isRead,
  durationSec: durationFromServer,
  pending,
  track,
  conversationId,
  buildFollowingTracks,
}: Props) {
  const voice = useVoicePlayback();
  const [waveWidth, setWaveWidth] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const scrubFracRef = useRef(0);
  const wasPlayingBeforeScrubRef = useRef(false);

  useEffect(() => {
    if (durationFromServer != null && durationFromServer > 0) {
      cacheVoiceDuration(messageId, durationFromServer);
    }
  }, [messageId, durationFromServer]);

  const source = useMemo(() => {
    if (localPreviewUri) {
      return { uri: normalizeLocalUploadUri(localPreviewUri) };
    }
    return chatAudioPlaySource(fileUrl, token);
  }, [localPreviewUri, fileUrl, token]);

  const isActive = voice.isActive(messageId);
  const playing = isActive && voice.playing;
  const bars = useMemo(() => voiceWaveformBars(messageId, 40), [messageId]);

  const durationSec = useMemo(() => {
    if (isActive && voice.duration > 0) return voice.duration;
    if (durationFromServer != null && durationFromServer > 0) return durationFromServer;
    return getCachedVoiceDuration(messageId) ?? 0;
  }, [isActive, voice.duration, durationFromServer, messageId]);

  const currentTime = isActive ? voice.currentTime : 0;
  const progress =
    durationSec > 0 ? Math.min(1, Math.max(0, currentTime / durationSec)) : 0;

  const playMeta = useMemo(
    () => ({
      senderLabel: isMe ? 'Вы' : (senderName?.trim() || 'Голосовое'),
      timeLabel,
    }),
    [isMe, senderName, timeLabel]
  );

  const followingQueue = useMemo(
    () => buildFollowingTracks?.(messageId) ?? [],
    [buildFollowingTracks, messageId]
  );

  const resolvedTrack = useMemo((): VoiceTrack | null => {
    if (track) return track;
    if (conversationId == null || !source) return null;
    return {
      messageId,
      conversationId,
      source,
      meta: playMeta,
      fileUrl: fileUrl ?? null,
      localPreviewUri: localPreviewUri ?? null,
    };
  }, [track, conversationId, source, messageId, playMeta, fileUrl, localPreviewUri]);

  const togglePlay = useCallback(() => {
    if (!source) {
      setLoadError(true);
      return;
    }
    setLoadError(false);
    if (resolvedTrack) {
      voice.toggleTrack(resolvedTrack, { followingQueue });
      return;
    }
    voice.toggle(messageId, source, playMeta);
  }, [source, voice, messageId, playMeta, resolvedTrack, followingQueue]);

  const seekToFraction = useCallback(
    async (frac: number, resumeOverride?: boolean) => {
      const dur = durationSec || voice.duration;
      if (!dur || !source) return;
      setLoadError(false);
      const target = Math.max(0, Math.min(dur, frac * dur));
      if (!isActive) {
        if (resolvedTrack) {
          voice.playTrack(resolvedTrack, { followingQueue });
        } else {
          voice.play(messageId, source, playMeta);
        }
        await voice.seekTo(target);
        return;
      }
      const resume =
        resumeOverride !== undefined ? resumeOverride : wasPlayingBeforeScrubRef.current;
      await voice.seekTo(target, { resume });
    },
    [durationSec, voice, source, isActive, messageId, playMeta, resolvedTrack, followingQueue]
  );

  const wavePan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !pending && !loadError && waveWidth > 0,
        onMoveShouldSetPanResponder: () => !pending && !loadError && waveWidth > 0,
        onPanResponderGrant: (evt) => {
          wasPlayingBeforeScrubRef.current = playing;
          if (waveWidth > 0) {
            scrubFracRef.current = Math.max(
              0,
              Math.min(1, evt.nativeEvent.locationX / waveWidth)
            );
          }
          if (isActive) voice.beginScrub();
        },
        onPanResponderMove: (evt) => {
          if (waveWidth <= 0) return;
          const f = Math.max(0, Math.min(1, evt.nativeEvent.locationX / waveWidth));
          scrubFracRef.current = f;
          voice.scrubToFraction(f);
        },
        onPanResponderRelease: () => {
          if (isActive) {
            void voice.endScrub(scrubFracRef.current);
          } else {
            void seekToFraction(scrubFracRef.current, false);
          }
        },
        onPanResponderTerminate: () => {
          if (isActive) {
            void voice.endScrub(scrubFracRef.current);
          } else {
            void seekToFraction(scrubFracRef.current, false);
          }
        },
      }),
    [pending, loadError, waveWidth, playing, isActive, voice, seekToFraction]
  );

  const onWavePress = useCallback(
    (e: GestureResponderEvent) => {
      if (pending || loadError || waveWidth <= 0) return;
      void seekToFraction(e.nativeEvent.locationX / waveWidth);
    },
    [pending, loadError, waveWidth, seekToFraction]
  );

  const remainingSec =
    durationSec > 0 ? Math.max(0, durationSec - currentTime) : 0;

  const timerLabel = playing
    ? formatDuration(remainingSec)
    : formatDuration(durationSec) || '0:00';

  const bubbleW = voiceBubbleWidth(durationSec || 3);

  const playedColor = isMe ? '#fff' : ACCENT;
  const unplayedColor = isMe
    ? 'rgba(255,255,255,0.32)'
    : isDark
      ? talkAccentAlpha(0.28)
      : talkAccentAlpha(0.22);

  const playBtnStyle = isMe ? styles.playBtnMe : styles.playBtnOther;
  const playIconColor = isMe ? ACCENT : '#fff';

  const showSpeed = isActive && voice.playbackRate > 1;

  if (pending) {
    return (
      <View style={[styles.root, { width: bubbleW }]}>
        <View style={styles.mainRow}>
          <View style={[styles.playBtn, playBtnStyle]}>
            <ActivityIndicator size="small" color={playIconColor} />
          </View>
          <View style={styles.waveHit}>
            <View style={styles.waveRow}>
              {bars.map((h, i) => (
                <View
                  key={i}
                  style={[styles.waveBar, { height: h, backgroundColor: unplayedColor }]}
                />
              ))}
            </View>
          </View>
          <Text style={[styles.timer, isMe && styles.timerMe]}>…</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.time, isMe && styles.timeMe]}>{timeLabel}</Text>
          {isMe ? (
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.5)" />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { width: bubbleW }]}>
      <View style={styles.mainRow}>
        <TouchableOpacity
          style={[styles.playBtn, playBtnStyle]}
          onPress={togglePlay}
          onLongPress={isActive ? voice.cycleSpeed : undefined}
          delayLongPress={320}
          activeOpacity={0.85}
        >
          {voice.buffering && isActive ? (
            <ActivityIndicator size="small" color={playIconColor} />
          ) : (
            <Ionicons
              name={playing ? 'pause' : 'play'}
              size={17}
              color={playIconColor}
              style={playing ? undefined : { marginLeft: 2 }}
            />
          )}
        </TouchableOpacity>

        <Pressable style={styles.waveHit} onPress={onWavePress} {...wavePan.panHandlers}>
          <View
            style={styles.waveRow}
            onLayout={(e) => setWaveWidth(e.nativeEvent.layout.width)}
          >
            {bars.map((h, i) => {
              const at = (i + 0.5) / bars.length;
              return (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    { height: h, backgroundColor: at <= progress ? playedColor : unplayedColor },
                  ]}
                />
              );
            })}
          </View>
          {isActive && progress > 0 && progress < 1 ? (
            <View
              pointerEvents="none"
              style={[
                styles.scrubDot,
                {
                  left: `${progress * 100}%`,
                  backgroundColor: playedColor,
                },
              ]}
            />
          ) : null}
        </Pressable>

        <View style={styles.timerCol}>
          {showSpeed ? (
            <Text style={[styles.speedBadge, isMe && styles.speedBadgeMe]}>
              {voice.playbackRate}×
            </Text>
          ) : null}
          <Text style={[styles.timer, isMe && styles.timerMe]}>
            {loadError ? '—' : timerLabel}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.time, isMe && styles.timeMe]}>{timeLabel}</Text>
        {isMe ? (
          <Ionicons
            name={isRead ? 'checkmark-done' : 'checkmark'}
            size={13}
            color="rgba(255,255,255,0.68)"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 2,
    paddingVertical: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnMe: { backgroundColor: 'rgba(255,255,255,0.94)' },
  playBtnOther: { backgroundColor: ACCENT },
  waveHit: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    position: 'relative',
    height: 28,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 24,
    gap: 1.5,
  },
  waveBar: { flex: 1, maxWidth: 3, borderRadius: 1.5 },
  scrubDot: {
    position: 'absolute',
    top: '50%',
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: -3.5,
    marginLeft: -3.5,
  },
  timerCol: { alignItems: 'flex-end', minWidth: 36 },
  timer: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5f6b76',
    fontVariant: ['tabular-nums'],
  },
  timerMe: { color: 'rgba(255,255,255,0.92)' },
  speedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: ACCENT,
    marginBottom: 1,
  },
  speedBadgeMe: { color: 'rgba(255,255,255,0.75)' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: -2,
  },
  time: { fontSize: 11, color: '#8b98a5' },
  timeMe: { color: 'rgba(255,255,255,0.58)' },
});
