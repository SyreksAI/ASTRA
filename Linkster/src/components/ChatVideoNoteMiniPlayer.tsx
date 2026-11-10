import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MiniPlayerHost } from '../context/VoicePlaybackContext';
import { useVideoNotePlayback } from '../context/VideoNotePlaybackContext';
import { useTalkTheme } from '../hooks/useTalkTheme';
import { talkBrand } from '../theme/talkTheme';
import {
  GAP_BELOW_CHAT_LIST_HEADER,
  GAP_BELOW_OPEN_CHAT_HEADER,
  voiceMiniPlayerGlobalBottom,
} from './ChatVoiceMiniPlayer';

const BAR_H = 40;
const SIDE_LIST = 10;
const SIDE_OPEN_CHAT = 12;
const ACCENT = talkBrand.accent;

function gapBelowHeader(placement: MiniPlayerHost): number {
  if (placement === 'openChat') return GAP_BELOW_OPEN_CHAT_HEADER;
  if (placement === 'chatList') return GAP_BELOW_CHAT_LIST_HEADER;
  return 0;
}

function horizontalInset(placement: MiniPlayerHost): number {
  return placement === 'openChat' ? SIDE_OPEN_CHAT : SIDE_LIST;
}

type Props = {
  placement: MiniPlayerHost;
};

export default function ChatVideoNoteMiniPlayer({ placement }: Props) {
  const insets = useSafeAreaInsets();
  const { isDark, colors: themeColors } = useTalkTheme();
  const video = useVideoNotePlayback();

  const hostMatches = video.miniPlayerHost === placement;
  const visible = video.session != null && hostMatches;

  const progressBarW = useRef(0);
  const scrubFracRef = useRef(0);

  const progress = useMemo(() => {
    if (!visible || video.duration <= 0) return 0;
    return Math.min(1, Math.max(0, video.currentTime / video.duration));
  }, [visible, video.currentTime, video.duration]);

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
          video.beginScrub();
          video.scrubToFraction(f);
        },
        onPanResponderMove: (evt, gesture) => {
          const w = progressBarW.current;
          if (w <= 0) return;
          const x = evt.nativeEvent.locationX + gesture.dx;
          const f = Math.max(0, Math.min(1, x / w));
          scrubFracRef.current = f;
          video.scrubToFraction(f);
        },
        onPanResponderRelease: () => {
          video.endScrub(scrubFracRef.current);
        },
        onPanResponderTerminate: () => {
          video.endScrub(scrubFracRef.current);
        },
      }),
    [video]
  );

  if (!visible) return null;

  const { senderLabel, timeLabel } = video.session!;

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
          bottom: video.miniPlayerTop ?? voiceMiniPlayerGlobalBottom(insets),
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
          onPress={() => video.toggleCurrent()}
          hitSlop={8}
          activeOpacity={0.85}
        >
          <Ionicons
            name={video.playing ? 'pause' : 'play'}
            size={16}
            color={ACCENT}
            style={video.playing ? undefined : { marginLeft: 2 }}
          />
        </TouchableOpacity>

        <Pressable style={styles.titleWrap} onPress={() => void video.openActiveVideoNote()}>
          <Text style={styles.title} numberOfLines={1}>
            <Text style={[styles.titleBold, { color: titleBoldColor }]}>{senderLabel}</Text>
            <Text style={[styles.titleMuted, { color: titleMutedColor }]}>
              {' '}
              · видеокружок {timeLabel}
            </Text>
          </Text>
        </Pressable>

        <View style={styles.badge}>
          <Ionicons name="videocam" size={14} color={ACCENT} />
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => video.stop()}
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
  badge: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
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
    backgroundColor: ACCENT,
    borderBottomLeftRadius: BAR_H / 2,
  },
});
