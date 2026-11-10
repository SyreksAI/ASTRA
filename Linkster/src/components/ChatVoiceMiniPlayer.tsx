import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVoicePlayback, type MiniPlayerHost } from '../context/VoicePlaybackContext';
import { useTalkTheme } from '../hooks/useTalkTheme';
import { talkBrand } from '../theme/talkTheme';

const BAR_H = 40;
const SIDE_LIST = 10;
const SIDE_OPEN_CHAT = 12;

export const GAP_BELOW_OPEN_CHAT_HEADER = 6;
export const GAP_BELOW_CHAT_LIST_HEADER = 10;

export const GAP_BELOW_HEADER = GAP_BELOW_OPEN_CHAT_HEADER;

export const VOICE_MINI_TAB_BAR_CORE = 56;
const GLOBAL_BOTTOM_GAP = 6;
const GREEN = talkBrand.recordGreen;

function gapBelowHeader(placement: MiniPlayerHost): number {
  if (placement === 'openChat') return GAP_BELOW_OPEN_CHAT_HEADER;
  if (placement === 'chatList') return GAP_BELOW_CHAT_LIST_HEADER;
  return 0;
}

function horizontalInset(placement: MiniPlayerHost): number {
  return placement === 'openChat' ? SIDE_OPEN_CHAT : SIDE_LIST;
}

export function voiceMiniPlayerGlobalBottom(insets: { bottom: number }): number {
  return VOICE_MINI_TAB_BAR_CORE + Math.max(insets.bottom, 8) + GLOBAL_BOTTOM_GAP;
}

/** @deprecated список/чат — inline, резерв не нужен */
export function voiceMiniPlayerUnderHeaderReserve(placement: MiniPlayerHost): number {
  return BAR_H + gapBelowHeader(placement) + 6;
}

function formatSpeedLabel(rate: number): string {
  if (rate === 1) return '1X';
  if (rate === 1.5) return '1.5X';
  if (rate === 2) return '2X';
  return `${rate}X`;
}

type Props = {
  placement: MiniPlayerHost;
};

export default function ChatVoiceMiniPlayer({ placement }: Props) {
  const insets = useSafeAreaInsets();
  const { isDark, colors: themeColors } = useTalkTheme();
  const voice = useVoicePlayback();

  const hostMatches = voice.miniPlayerHost === placement;

  const visible = voice.activeId != null && voice.nowPlaying != null && hostMatches;

  const progressBarW = useRef(0);
  const scrubFracRef = useRef(0);

  const progress = useMemo(() => {
    if (!visible || voice.duration <= 0) return 0;
    return Math.min(1, Math.max(0, voice.currentTime / voice.duration));
  }, [visible, voice.currentTime, voice.duration]);

  const progressPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const w = progressBarW.current;
          if (w <= 0) return;
          const f = Math.max(0, Math.min(1, evt.nativeEvent.locationX / w));
          scrubFracRef.current = f;
          voice.beginScrub();
          voice.scrubToFraction(f);
        },
        onPanResponderMove: (evt, gesture) => {
          const w = progressBarW.current;
          if (w <= 0) return;
          const x = evt.nativeEvent.locationX + gesture.dx;
          const f = Math.max(0, Math.min(1, x / w));
          scrubFracRef.current = f;
          voice.scrubToFraction(f);
        },
        onPanResponderRelease: () => {
          void voice.endScrub(scrubFracRef.current);
        },
        onPanResponderTerminate: () => {
          void voice.endScrub(scrubFracRef.current);
        },
      }),
    [voice]
  );

  if (!visible) return null;

  const { senderLabel, timeLabel } = voice.nowPlaying!;

  const barBg = isDark ? '#1a2229' : themeColors.inputBg;
  const titleBoldColor = isDark ? '#fff' : themeColors.text;
  const titleMutedColor = isDark ? 'rgba(255,255,255,0.55)' : themeColors.textSecondary;
  const closeColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(15,20,25,0.4)';
  const progressTrackBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,20,25,0.1)';
  const barBorderColor = isDark ? 'transparent' : 'rgba(15, 20, 25, 0.11)';

  const underHeader = placement === 'chatList' || placement === 'openChat';
  const inset = horizontalInset(placement);
  const gap = gapBelowHeader(placement);

  const wrapStyle = underHeader
    ? [
        styles.inlineWrap,
        {
          paddingHorizontal: inset,
          paddingTop: gap,
          paddingBottom: 4,
        },
        !isDark && styles.inlineWrapLight,
      ]
    : [
        styles.globalDockWrap,
        {
          bottom: voice.miniPlayerTop ?? voiceMiniPlayerGlobalBottom(insets),
        },
        !isDark && styles.globalDockWrapLight,
      ];

  return (
    <View style={wrapStyle} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          { backgroundColor: barBg },
          !isDark && styles.barLight,
          !isDark && { borderColor: barBorderColor },
        ]}
      >
        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => voice.toggleCurrent()}
          hitSlop={8}
          activeOpacity={0.85}
        >
          {voice.buffering ? (
            <ActivityIndicator size="small" color={GREEN} />
          ) : (
            <Ionicons
              name={voice.playing ? 'pause' : 'play'}
              size={16}
              color={GREEN}
              style={voice.playing ? undefined : { marginLeft: 2 }}
            />
          )}
        </TouchableOpacity>

        <Pressable
          style={styles.titleWrap}
          onPress={() => void voice.openActiveVoiceMessage()}
        >
          <Text style={styles.title} numberOfLines={1}>
            <Text style={[styles.titleBold, { color: titleBoldColor }]}>{senderLabel}</Text>
            <Text style={[styles.titleMuted, { color: titleMutedColor }]}> в {timeLabel}</Text>
          </Text>
        </Pressable>

        <TouchableOpacity
          style={styles.speedBtn}
          onPress={() => voice.cycleSpeed()}
          activeOpacity={0.85}
          hitSlop={6}
        >
          <Text style={styles.speedText}>{formatSpeedLabel(voice.playbackRate)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => voice.stop()}
          hitSlop={10}
          activeOpacity={0.75}
        >
          <Ionicons name="close" size={20} color={closeColor} />
        </TouchableOpacity>

        <View
          style={[styles.progressTrack, { backgroundColor: progressTrackBg }]}
          onLayout={(e) => {
            progressBarW.current = e.nativeEvent.layout.width;
          }}
          {...progressPan.panHandlers}
        >
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineWrap: {
    zIndex: 10,
  },
  inlineWrapLight: {
    ...Platform.select({
      ios: {
        shadowColor: '#0f1419',
        shadowOpacity: 0.07,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
    }),
  },
  globalDockWrap: {
    position: 'absolute',
    left: SIDE_LIST,
    right: SIDE_LIST,
    zIndex: 200,
    ...Platform.select({
      android: { elevation: 12 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
      },
    }),
  },
  globalDockWrapLight: {
    ...Platform.select({
      android: { elevation: 5 },
      ios: {
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -2 },
      },
    }),
  },
  bar: {
    height: BAR_H,
    borderRadius: BAR_H / 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 2,
    overflow: 'hidden',
  },
  barLight: {
    borderWidth: 1,
  },
  playBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
  },
  titleBold: {
    fontWeight: '700',
  },
  titleMuted: {
    fontWeight: '500',
  },
  speedBtn: {
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 2,
  },
  speedText: {
    color: GREEN,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GREEN,
    borderBottomLeftRadius: BAR_H / 2,
  },
});
