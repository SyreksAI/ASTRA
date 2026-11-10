import React, { useMemo } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VOICE_LOCK_SLIDE_Y, voiceMicOrbOffset } from './voiceGesture';
import { COMPOSER_BTN_SIZE } from './composerBarLayout';
import { talkBrand } from '../theme/talkTheme';

const LOCK_TRACK_H = 76;

type OrbBase = { x: number; y: number; width: number; height: number };

type Props = {
  gestureDx: number;
  gestureDy: number;
  locked: boolean;
  trashing: boolean;
  fingerDown: boolean;
  recordOrbBase: OrbBase;
  trashScale: Animated.Value;
  orbScale: Animated.Value;
};

export default function VideoNoteGestureChrome({
  gestureDx,
  gestureDy,
  locked,
  trashing,
  fingerDown,
  recordOrbBase,
  trashScale,
  orbScale,
}: Props) {
  const camOrbOffset = useMemo(() => {
    if (trashing) return null;
    if (locked) return { offsetX: 0, offsetY: 0 };
    return voiceMicOrbOffset(gestureDx, gestureDy);
  }, [trashing, locked, gestureDx, gestureDy]);

  const lockProgress = Math.min(1, Math.max(0, -gestureDy / -VOICE_LOCK_SLIDE_Y));
  const showLockTrack = !locked && !trashing && gestureDy < -6 && fingerDown;

  return (
    <>
      {camOrbOffset && !trashing && !locked ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.camOrbFloating,
            {
              left: recordOrbBase.x,
              top: recordOrbBase.y,
              transform: [
                { translateX: camOrbOffset.offsetX },
                { translateY: camOrbOffset.offsetY },
                { scale: orbScale },
              ],
            },
          ]}
        >
          <View style={styles.camOrbInner}>
            <Ionicons name="videocam" size={22} color="#fff" />
          </View>
        </Animated.View>
      ) : null}

      {showLockTrack ? (
        <View
          pointerEvents="none"
          style={[
            styles.lockTrack,
            {
              left: recordOrbBase.x + recordOrbBase.width / 2 - 18,
              top: recordOrbBase.y - LOCK_TRACK_H - 8,
              opacity: 0.55 + lockProgress * 0.45,
            },
          ]}
        >
          <View style={styles.lockTrackInner}>
            <Ionicons name="chevron-up" size={14} color="rgba(255,255,255,0.45)" style={{ marginBottom: 4 }} />
            <View style={styles.lockTrackBar}>
              <View style={[styles.lockTrackFill, { flex: lockProgress }]} />
              <View style={{ flex: 1 - lockProgress }} />
            </View>
            <Ionicons
              name={lockProgress > 0.82 ? 'lock-closed' : 'lock-open-outline'}
              size={17}
              color="#fff"
              style={{ marginTop: 6 }}
            />
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  camOrbFloating: {
    position: 'absolute',
    width: COMPOSER_BTN_SIZE,
    height: COMPOSER_BTN_SIZE,
    zIndex: 30,
  },
  camOrbInner: {
    width: COMPOSER_BTN_SIZE,
    height: COMPOSER_BTN_SIZE,
    borderRadius: COMPOSER_BTN_SIZE / 2,
    backgroundColor: talkBrand.recordGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  lockTrack: {
    position: 'absolute',
    width: 36,
    zIndex: 25,
  },
  lockTrackInner: {
    alignItems: 'center',
  },
  lockTrackBar: {
    width: 4,
    height: LOCK_TRACK_H,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    flexDirection: 'column-reverse',
  },
  lockTrackFill: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 2,
  },
});
