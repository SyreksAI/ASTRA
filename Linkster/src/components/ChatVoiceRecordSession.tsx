import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  BackHandler,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import {
  VOICE_CANCEL_HINT_X,
  VOICE_LOCK_SLIDE_Y,
  voiceCancelProgress,
  shouldInstantCancelVoice,
  clampVoiceSlideX,
  voiceMicOrbOffset,
} from './voiceGesture';
import {
  COMPOSER_BAR_PADDING_H,
  COMPOSER_BAR_PADDING_TOP,
  COMPOSER_BAR_ROW_HEIGHT,
  COMPOSER_BTN_SIZE,
  VOICE_RECORD_OVERLAY_TOP_NUDGE,
  voiceRecordOverlayPanelHeight,
  voiceRecordMicScreenRect,
} from './composerBarLayout';
import type { ComposerScreenRect, MicAnchor } from './voiceOverlayTypes';

import { talkBrand } from '../theme/talkTheme';

/** Как в Telegram — зелёный микрофон при записи (чуть приглушённый). */
const TG_MIC_GREEN = talkBrand.recordGreen;
const TG_REC_RED = '#ff3b30';
const LOCK_TRACK_H = 76;
const MIN_RECORD_MS = 700;

type Props = {
  visible: boolean;
  isDark: boolean;
  fingerDown: boolean;
  gestureDx: number;
  gestureDy: number;
  paddingBottom: number;
  micAnchor: MicAnchor | null;
  fingerPage: { x: number; y: number } | null;
  composerRect: ComposerScreenRect | null;
  voicePanHandlers: Record<string, unknown>;
  onClose: () => void;
  onRecorded: (uri: string, durationSec: number) => Promise<void>;
};

function formatVoiceTimer(ms: number): string {
  const safe = Math.max(0, ms);
  const totalSec = Math.floor(safe / 1000);
  const tenths = Math.floor((safe % 1000) / 100);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')},${tenths}`;
}

export default function ChatVoiceRecordSession({
  visible,
  isDark,
  fingerDown,
  gestureDx,
  gestureDy,
  paddingBottom,
  micAnchor,
  composerRect,
  voicePanHandlers,
  onClose,
  onRecorded,
}: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 100);
  const busyRef = useRef(false);
  const recordingStartedRef = useRef(false);
  const discardRef = useRef(false);
  const releaseSlideRef = useRef({ dx: 0, dy: 0 });
  const instantCancelRef = useRef(false);

  const [locked, setLocked] = useState(false);
  const [trashing, setTrashing] = useState(false);
  const lockAnim = useRef(new Animated.Value(0)).current;
  const trashScale = useRef(new Animated.Value(0.72)).current;
  const orbScale = useRef(new Animated.Value(1)).current;
  const recPulse = useRef(new Animated.Value(1)).current;
  const prevFingerDownRef = useRef(fingerDown);
  const layoutSnapRef = useRef<{
    rect: ComposerScreenRect;
    paddingBottom: number;
  } | null>(null);

  if (visible && composerRect && !layoutSnapRef.current) {
    layoutSnapRef.current = { rect: composerRect, paddingBottom };
  }
  if (!visible && layoutSnapRef.current) {
    layoutSnapRef.current = null;
  }

  const layoutSnap = layoutSnapRef.current;
  const panelRect = layoutSnap?.rect ?? composerRect;
  const panelPaddingBottom = layoutSnap?.paddingBottom ?? paddingBottom;
  const overlayNudge = panelRect ? VOICE_RECORD_OVERLAY_TOP_NUDGE : 0;

  const overlayPanel = useMemo(() => {
    if (!panelRect) return null;
    const height = voiceRecordOverlayPanelHeight(panelPaddingBottom, panelRect.height);
    const top = panelRect.y + panelRect.height - height + overlayNudge;
    return {
      x: panelRect.x,
      y: top,
      width: panelRect.width,
      height,
    };
  }, [panelRect, panelPaddingBottom, overlayNudge]);

  const micBase = useMemo(() => {
    if (overlayPanel) {
      return voiceRecordMicScreenRect(overlayPanel);
    }
    return micAnchor;
  }, [overlayPanel, micAnchor]);

  const slideX = clampVoiceSlideX(gestureDx);
  const cancelProgress = voiceCancelProgress(slideX);
  const lockProgress = Math.min(1, Math.max(0, -gestureDy / -VOICE_LOCK_SLIDE_Y));

  const micOrbOffset = useMemo(() => {
    if (trashing) return null;
    if (locked) return { offsetX: 0, offsetY: 0 };
    return voiceMicOrbOffset(gestureDx, gestureDy);
  }, [trashing, locked, gestureDx, gestureDy]);

  const cancelArmed = slideX <= VOICE_CANCEL_HINT_X;
  const slideLeft = gestureDx < -4;

  const panelColors = useMemo(
    () =>
      isDark
        ? { bg: '#17212b', border: '#0f1923', hint: 'rgba(255,255,255,0.62)' }
        : { bg: '#ffffff', border: 'rgba(0,0,0,0.08)', hint: 'rgba(0,0,0,0.45)' },
    [isDark]
  );

  const resetUi = useCallback(() => {
    setLocked(false);
    setTrashing(false);
    lockAnim.setValue(0);
    trashScale.setValue(0.72);
    orbScale.setValue(1);
    recordingStartedRef.current = false;
    discardRef.current = false;
    instantCancelRef.current = false;
    releaseSlideRef.current = { dx: 0, dy: 0 };
  }, [lockAnim, trashScale, orbScale]);

  const cleanupAudio = useCallback(async () => {
    await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
  }, []);

  const cancelRecording = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    discardRef.current = true;
    try {
      if (recordingStartedRef.current) {
        await recorder.stop().catch(() => {});
      }
    } finally {
      recordingStartedRef.current = false;
      await cleanupAudio();
      busyRef.current = false;
      resetUi();
      onClose();
    }
  }, [recorder, cleanupAudio, resetUi, onClose]);

  const playTrashAndCancel = useCallback(() => {
    if (instantCancelRef.current || busyRef.current || locked) return;
    instantCancelRef.current = true;
    setTrashing(true);
    Animated.parallel([
      Animated.spring(trashScale, {
        toValue: 1.2,
        friction: 6,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.timing(orbScale, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      void cancelRecording();
    });
  }, [locked, trashScale, orbScale, cancelRecording]);

  const stopAndSend = useCallback(async () => {
    if (busyRef.current || discardRef.current || instantCancelRef.current) return;
    if (!recordingStartedRef.current) {
      resetUi();
      onClose();
      return;
    }
    busyRef.current = true;
    try {
      const durationMs = recState.durationMillis;
      await recorder.stop();
      let uri = recorder.uri || recorder.getStatus().url;
      if (!uri) {
        await new Promise((r) => setTimeout(r, 120));
        uri = recorder.uri || recorder.getStatus().url;
      }
      if (durationMs < MIN_RECORD_MS || !uri) {
        Alert.alert('Слишком коротко', 'Удерживайте кнопку чуть дольше.');
        return;
      }
      const durationSec = Math.max(1, Math.round(durationMs / 1000));
      await onRecorded(uri, durationSec);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg !== 'send_failed') {
        Alert.alert('Ошибка', 'Не удалось отправить голосовое');
      }
    } finally {
      recordingStartedRef.current = false;
      await cleanupAudio();
      busyRef.current = false;
      resetUi();
      onClose();
    }
  }, [recorder, recState.durationMillis, onRecorded, cleanupAudio, resetUi, onClose]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      const perm = await requestRecordingPermissionsAsync();
      if (cancelled) return;
      if (!perm.granted) {
        Alert.alert('Нужен доступ к микрофону');
        onClose();
        return;
      }
      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        await recorder.prepareToRecordAsync();
        recorder.record();
        recordingStartedRef.current = true;
      } catch {
        Alert.alert('Ошибка', 'Не удалось начать запись');
        onClose();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, recorder, onClose]);

  useEffect(() => {
    if (!visible) resetUi();
  }, [visible, resetUi]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      void cancelRecording();
      return true;
    });
    return () => sub.remove();
  }, [visible, cancelRecording]);

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(recPulse, { toValue: 0.35, duration: 520, useNativeDriver: true }),
        Animated.timing(recPulse, { toValue: 1, duration: 520, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, recPulse]);

  useEffect(() => {
    releaseSlideRef.current = { dx: slideX, dy: gestureDy };
    if (!locked && !trashing && gestureDy <= VOICE_LOCK_SLIDE_Y) {
      setLocked(true);
      Animated.spring(lockAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
      }).start();
    }
  }, [slideX, gestureDy, locked, trashing, lockAnim]);

  useEffect(() => {
    if (!visible || locked || trashing || !fingerDown) return;
    if (shouldInstantCancelVoice(slideX)) {
      playTrashAndCancel();
    }
  }, [slideX, visible, locked, trashing, fingerDown, playTrashAndCancel]);

  useEffect(() => {
    const wasDown = prevFingerDownRef.current;
    prevFingerDownRef.current = fingerDown;
    if (!visible || !wasDown || fingerDown) return;
    if (locked || instantCancelRef.current || trashing || discardRef.current) return;
    const { dx } = releaseSlideRef.current;
    if (cancelArmed || dx <= VOICE_CANCEL_HINT_X) {
      void cancelRecording();
    } else {
      void stopAndSend();
    }
  }, [fingerDown, visible, locked, trashing, cancelArmed, cancelRecording, stopAndSend]);

  if (!visible) return null;

  const timer = formatVoiceTimer(recState.durationMillis);
  const screenH = Dimensions.get('window').height;
  const panelTop = overlayPanel?.y ?? screenH - 72;
  const panelHeight = overlayPanel?.height ?? 72;
  const panelLeft = overlayPanel?.x ?? panelRect?.x ?? 0;
  const panelWidth = overlayPanel?.width ?? panelRect?.width ?? Dimensions.get('window').width;

  const cancelTint = cancelArmed ? '#ff453a' : panelColors.hint;
  const showLockTrack = micBase && !locked && !trashing && gestureDy < -6;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={cancelRecording}>
      <View style={styles.modalRoot} pointerEvents="box-none">
        <View
          style={styles.gestureLayer}
          pointerEvents={fingerDown && !locked ? 'auto' : 'box-none'}
          {...voicePanHandlers}
        />
        <View style={styles.dimLayer} pointerEvents={fingerDown && !locked ? 'none' : 'auto'} />

        <View
          style={[
            styles.composerCover,
            {
              top: panelTop,
              left: panelLeft,
              width: panelWidth,
              height: panelHeight,
              paddingBottom: panelPaddingBottom,
              backgroundColor: panelColors.bg,
              borderTopColor: panelColors.border,
            },
          ]}
          pointerEvents={fingerDown && !locked ? 'none' : 'auto'}
        >
          <View style={styles.barRow}>
            {locked ? (
              <>
                <View style={styles.timerRow}>
                  <Animated.View style={[styles.recDot, { opacity: recPulse }]} />
                  <Text style={[styles.timerText, { color: isDark ? '#fff' : '#0f1419' }]}>
                    {timer}
                  </Text>
                </View>

                <View style={styles.lockedCenter}>
                  <TouchableOpacity
                    style={styles.lockedCancelBtn}
                    onPress={() => void cancelRecording()}
                    activeOpacity={0.75}
                    hitSlop={8}
                  >
                    <Text style={styles.lockedCancelText}>ОТМЕНА</Text>
                  </TouchableOpacity>
                </View>

                {!trashing ? (
                  <View style={styles.micOrbInRow}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.micOrbInner}
                      onPress={() => void stopAndSend()}
                    >
                      <Ionicons name="send" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.barSpacer} />
                )}
              </>
            ) : (
              <>
                {slideLeft ? (
                  <Animated.View
                    style={[
                      styles.timerRow,
                      styles.timerTrashSlot,
                      {
                        opacity: 0.55 + cancelProgress * 0.45,
                        transform: [{ scale: trashScale }],
                      },
                    ]}
                  >
                    <View style={[styles.trashInline, cancelArmed && styles.trashInlineActive]}>
                      <Ionicons
                        name="trash"
                        size={24}
                        color={cancelArmed || trashing ? '#ff453a' : isDark ? '#fff' : '#536471'}
                      />
                    </View>
                  </Animated.View>
                ) : (
                  <View style={styles.timerRow}>
                    <Animated.View style={[styles.recDot, { opacity: recPulse }]} />
                    <Text
                      style={[
                        styles.timerText,
                        { color: isDark ? '#fff' : '#0f1419' },
                        cancelArmed && styles.timerCancel,
                      ]}
                    >
                      {timer}
                    </Text>
                  </View>
                )}

                <View style={styles.cancelHint}>
                  <View style={styles.cancelChevrons}>
                    {[0, 1, 2].map((i) => (
                      <Ionicons
                        key={i}
                        name="chevron-back"
                        size={15}
                        color={cancelArmed ? '#ff453a' : panelColors.hint}
                        style={{ opacity: 1 - i * 0.32, marginLeft: i === 0 ? 0 : -7 }}
                      />
                    ))}
                  </View>
                  <Text
                    style={[
                      styles.cancelText,
                      { color: cancelTint },
                      cancelArmed && styles.cancelTextActive,
                    ]}
                  >
                    {trashing ? 'Удалено' : cancelArmed ? 'Отмена' : 'Влево — отмена'}
                  </Text>
                </View>

                {micOrbOffset && !trashing ? (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.micOrbInRow,
                      {
                        transform: [
                          { translateX: micOrbOffset.offsetX },
                          { translateY: micOrbOffset.offsetY },
                          { scale: orbScale },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.micOrbInner}>
                      <Ionicons name="mic" size={22} color="#fff" />
                    </View>
                  </Animated.View>
                ) : (
                  <View style={styles.barSpacer} />
                )}
              </>
            )}
          </View>
        </View>

        {showLockTrack ? (
          <View
            pointerEvents="none"
            style={[
              styles.lockTrack,
              {
                left: micBase!.x + micBase!.width / 2 - 18,
                top: micBase!.y - LOCK_TRACK_H - 8,
                opacity: 0.55 + lockProgress * 0.45,
              },
            ]}
          >
            <View style={styles.lockTrackInner}>
              <Ionicons
                name="chevron-up"
                size={14}
                color="rgba(255,255,255,0.45)"
                style={{ marginBottom: 4 }}
              />
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

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  gestureLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  dimLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.26)',
  },
  composerCover: {
    position: 'absolute',
    zIndex: 5,
    paddingTop: COMPOSER_BAR_PADDING_TOP,
    paddingHorizontal: COMPOSER_BAR_PADDING_H,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'visible',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: COMPOSER_BAR_ROW_HEIGHT,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 78,
    gap: 9,
  },
  timerTrashSlot: {
    minWidth: 78,
    justifyContent: 'flex-start',
  },
  trashInline: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  trashInlineActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.38)',
  },
  recDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: TG_REC_RED,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
  timerCancel: { color: '#ff453a' },
  cancelHint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  cancelChevrons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
  cancelTextActive: {
    color: '#ff453a',
    fontWeight: '600',
  },
  lockedCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  lockedCancelText: {
    color: '#ff453a',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  barSpacer: { width: COMPOSER_BTN_SIZE, height: COMPOSER_BTN_SIZE },
  micOrbInRow: {
    width: COMPOSER_BTN_SIZE,
    height: COMPOSER_BTN_SIZE,
    borderRadius: COMPOSER_BTN_SIZE / 2,
    backgroundColor: TG_MIC_GREEN,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  lockTrack: {
    position: 'absolute',
    zIndex: 9,
    width: 36,
    height: LOCK_TRACK_H,
    borderRadius: 18,
    backgroundColor: 'rgba(32, 38, 44, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  lockTrackInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  lockTrackBar: {
    width: 4,
    flex: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    flexDirection: 'column',
    marginVertical: 2,
  },
  lockTrackFill: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 2,
  },
  micOrbInner: {
    width: COMPOSER_BTN_SIZE,
    height: COMPOSER_BTN_SIZE,
    borderRadius: COMPOSER_BTN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
