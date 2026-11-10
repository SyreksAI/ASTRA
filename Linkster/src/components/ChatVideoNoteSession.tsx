import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Animated,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { linksterCanvas, talkBrand } from '../theme/talkTheme';
import {
  VOICE_CANCEL_HINT_X,
  VOICE_LOCK_SLIDE_Y,
  clampVoiceSlideX,
  shouldInstantCancelVoice,
  voiceCancelProgress,
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
import type {
  ComposerScreenRect,
  MicAnchor,
  VideoNoteGestureRef,
  VideoNoteMeta,
} from './voiceOverlayTypes';
import VideoNoteProgressRing from './VideoNoteProgressRing';
import VideoNoteCircleCamera from './VideoNoteCircleCamera';
import VideoNoteGestureChrome from './VideoNoteGestureChrome';

const GESTURE_SYNC_MS = 48;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CIRCLE = Math.min(SCREEN_W - 48, SCREEN_H * 0.46, 360);
const BOTTOM_DOCK_MIN = COMPOSER_BAR_ROW_HEIGHT + 28;
const MAX_DURATION_SEC = 60;
const MIN_RECORD_MS = 400;

/** Как в Telegram — зелёная кнопка видео/отправки при записи */
const TG_VIDEO_GREEN = talkBrand.recordGreen;
const TG_REC_RED = '#ff3b30';

type Props = {
  visible: boolean;
  isDark: boolean;
  fingerDown: boolean;
  gestureRef: React.MutableRefObject<VideoNoteGestureRef>;
  paddingBottom: number;
  camAnchor: MicAnchor | null;
  composerRect: ComposerScreenRect | null;
  videoPanHandlers: Record<string, unknown>;
  onClose: () => void;
  onRecorded: (uri: string, meta: VideoNoteMeta) => Promise<void>;
};

function formatVideoTimer(ms: number): string {
  const safe = Math.max(0, ms);
  const totalSec = Math.floor(safe / 1000);
  const tenths = Math.floor((safe % 1000) / 100);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')},${tenths}`;
}

export default function ChatVideoNoteSession({
  visible,
  isDark,
  fingerDown,
  gestureRef,
  paddingBottom,
  camAnchor,
  composerRect,
  videoPanHandlers,
  onClose,
  onRecorded,
}: Props) {
  const [gestureDx, setGestureDx] = useState(0);
  const [gestureDy, setGestureDy] = useState(0);

  useEffect(() => {
    if (!visible) {
      setGestureDx(0);
      setGestureDy(0);
      return undefined;
    }
    let frame = 0;
    let lastSync = 0;
    const tick = (now: number) => {
      if (now - lastSync >= GESTURE_SYNC_MS) {
        lastSync = now;
        const g = gestureRef.current;
        setGestureDx((prev) => (prev === g.dx ? prev : g.dx));
        setGestureDy((prev) => (prev === g.dy ? prev : g.dy));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, gestureRef]);
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const recordingRef = useRef(false);
  const recordPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const busyRef = useRef(false);
  const discardRef = useRef(false);
  const instantCancelRef = useRef(false);
  const recordStartedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const releaseSlideRef = useRef({ dx: 0, dy: 0 });
  const prevFingerDownRef = useRef(fingerDown);
  const fingerDownRef = useRef(fingerDown);
  const finishInProgressRef = useRef(false);
  fingerDownRef.current = fingerDown;
  const layoutSnapRef = useRef<{ rect: ComposerScreenRect; paddingBottom: number } | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [torch, setTorch] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [locked, setLocked] = useState(false);
  const [trashing, setTrashing] = useState(false);
  const [ringSessionKey, setRingSessionKey] = useState(0);

  const trashScale = useRef(new Animated.Value(0.72)).current;
  const orbScale = useRef(new Animated.Value(1)).current;
  const recPulse = useRef(new Animated.Value(1)).current;

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
    return { x: panelRect.x, y: top, width: panelRect.width, height };
  }, [panelRect, panelPaddingBottom, overlayNudge]);

  const camBase = useMemo(() => {
    if (overlayPanel) return voiceRecordMicScreenRect(overlayPanel);
    return camAnchor;
  }, [overlayPanel, camAnchor]);

  const slideX = clampVoiceSlideX(gestureDx);
  const cancelProgress = voiceCancelProgress(slideX);
  const cancelArmed = slideX <= VOICE_CANCEL_HINT_X;
  const slideLeft = gestureDx < -4;

  const onCameraReady = useCallback(() => {
    setCameraReady(true);
  }, []);

  /** На полноэкранном оверлее всегда светлые подписи (как в Telegram). */
  const overlayText = '#ffffff';
  const overlayHint = 'rgba(255,255,255,0.58)';

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetUi = useCallback(() => {
    clearTimer();
    recordingRef.current = false;
    recordPromiseRef.current = null;
    recordStartedAtRef.current = 0;
    setElapsedMs(0);
    setIsRecording(false);
    setCameraReady(false);
    setLocked(false);
    setTrashing(false);
    setTorch(false);
    discardRef.current = false;
    instantCancelRef.current = false;
    releaseSlideRef.current = { dx: 0, dy: 0 };
    trashScale.setValue(0.72);
    orbScale.setValue(1);
    busyRef.current = false;
  }, [clearTimer, trashScale, orbScale]);

  const cancelAll = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    discardRef.current = true;
    try {
      if (recordingRef.current) {
        cameraRef.current?.stopRecording();
      }
    } catch {
      /* ignore */
    }
    void recordPromiseRef.current?.catch(() => {});
    resetUi();
    onClose();
  }, [onClose, resetUi]);

  const finishAndSend = useCallback(async () => {
    if (
      finishInProgressRef.current ||
      !recordingRef.current ||
      !recordPromiseRef.current ||
      busyRef.current ||
      discardRef.current
    ) {
      return;
    }
    const elapsed = Date.now() - recordStartedAtRef.current;
    if (elapsed < MIN_RECORD_MS) {
      await cancelAll();
      Alert.alert('Слишком коротко', 'Удерживайте кнопку чуть дольше.');
      return;
    }
    finishInProgressRef.current = true;
    busyRef.current = true;
    clearTimer();
    const pendingRecord = recordPromiseRef.current;
    try {
      cameraRef.current?.stopRecording();
      const result = await pendingRecord;
      recordingRef.current = false;
      setIsRecording(false);
      recordPromiseRef.current = null;
      if (!result?.uri) {
        Alert.alert('Ошибка', 'Не удалось сохранить видео. Попробуйте ещё раз.');
        await cancelAll();
        return;
      }
      const normalized = result.uri.startsWith('file://') ? result.uri : `file://${result.uri}`;
      const info = await FileSystem.getInfoAsync(normalized);
      if (!info.exists || (typeof info.size === 'number' && info.size < 512)) {
        Alert.alert('Ошибка', 'Видеофайл пустой. Удерживайте запись дольше.');
        await cancelAll();
        return;
      }
      const durationSec = Math.max(1, Math.round(elapsed / 1000));
      const meta = { durationSec, width: CIRCLE, height: CIRCLE };
      resetUi();
      onClose();
      void onRecorded(normalized, meta).catch((err) => {
        const code = err instanceof Error ? err.message : '';
        if (code !== 'send_failed') {
          Alert.alert('Ошибка', 'Не удалось отправить видеосообщение');
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      Alert.alert('Ошибка', msg || 'Не удалось записать видеосообщение');
      await cancelAll();
    } finally {
      busyRef.current = false;
      finishInProgressRef.current = false;
    }
  }, [clearTimer, cancelAll, onRecorded, onClose, resetUi]);

  const startRecording = useCallback(() => {
    if (!cameraReady || recordingRef.current || discardRef.current || !fingerDownRef.current) return;
    recordingRef.current = true;
    setIsRecording(true);
    setRingSessionKey((k) => k + 1);
    recordStartedAtRef.current = Date.now();
    setElapsedMs(0);
    clearTimer();
    timerRef.current = setInterval(() => {
      const ms = Date.now() - recordStartedAtRef.current;
      setElapsedMs(ms);
      if (ms >= MAX_DURATION_SEC * 1000) {
        void finishAndSend();
      }
    }, 100);
    try {
      const promise = cameraRef.current?.recordAsync({
        maxDuration: MAX_DURATION_SEC,
        maxFileSize: 6 * 1024 * 1024,
      });
      recordPromiseRef.current = promise ?? null;
      if (!promise) {
        recordingRef.current = false;
        setIsRecording(false);
        clearTimer();
        Alert.alert('Ошибка', 'Камера не начала запись. Попробуйте снова.');
      }
    } catch (e) {
      recordingRef.current = false;
      setIsRecording(false);
      clearTimer();
      const msg = e instanceof Error ? e.message : '';
      Alert.alert('Ошибка записи', msg || 'Не удалось начать запись видео');
    }
  }, [cameraReady, clearTimer, finishAndSend]);

  const playTrashAndCancel = useCallback(() => {
    if (instantCancelRef.current || busyRef.current || locked) return;
    instantCancelRef.current = true;
    setTrashing(true);
    Animated.parallel([
      Animated.spring(trashScale, { toValue: 1.2, friction: 6, tension: 160, useNativeDriver: true }),
      Animated.timing(orbScale, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      void cancelAll();
    });
  }, [locked, trashScale, orbScale, cancelAll]);

  useEffect(() => {
    if (!visible) {
      resetUi();
      return;
    }
    let cancelled = false;
    (async () => {
      if (!cameraPermission?.granted) {
        const cam = await requestCameraPermission();
        if (cancelled) return;
        if (!cam.granted) {
          Alert.alert('Нужен доступ к камере');
          void cancelAll();
        }
      }
      if (!micPermission?.granted) {
        const mic = await requestMicPermission();
        if (cancelled) return;
        if (!mic.granted) {
          Alert.alert('Нужен доступ к микрофону');
          void cancelAll();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    visible,
    cameraPermission?.granted,
    micPermission?.granted,
    requestCameraPermission,
    requestMicPermission,
    cancelAll,
    resetUi,
  ]);

  useEffect(() => {
    if (!visible || !cameraReady || discardRef.current) return;
    if (fingerDown && !recordingRef.current) {
      startRecording();
    }
  }, [visible, cameraReady, fingerDown, startRecording]);

  useEffect(() => {
    releaseSlideRef.current = { dx: slideX, dy: gestureDy };
    if (!locked && !trashing && gestureDy <= VOICE_LOCK_SLIDE_Y) {
      setLocked(true);
    }
  }, [slideX, gestureDy, locked, trashing]);

  useEffect(() => {
    if (!visible || locked || trashing || !fingerDown) return;
    if (shouldInstantCancelVoice(slideX)) {
      playTrashAndCancel();
    }
  }, [slideX, visible, locked, trashing, fingerDown, playTrashAndCancel]);

  useEffect(() => {
    const wasDown = prevFingerDownRef.current;
    prevFingerDownRef.current = fingerDown;
    if (!visible || !wasDown || fingerDown || locked) return;
    if (instantCancelRef.current || trashing || discardRef.current) return;
    const { dx } = releaseSlideRef.current;
    if (cancelArmed || dx <= VOICE_CANCEL_HINT_X) {
      void cancelAll();
    } else if (recordingRef.current) {
      void finishAndSend();
    } else {
      void cancelAll();
    }
  }, [fingerDown, visible, locked, trashing, cancelArmed, cancelAll, finishAndSend]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      void cancelAll();
      return true;
    });
    return () => sub.remove();
  }, [visible, cancelAll]);

  useEffect(() => {
    if (!visible || !isRecording) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(recPulse, { toValue: 0.35, duration: 520, useNativeDriver: true }),
        Animated.timing(recPulse, { toValue: 1, duration: 520, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, isRecording, recPulse]);

  const canShowCamera = visible && cameraPermission?.granted && micPermission?.granted;
  const timer = formatVideoTimer(elapsedMs);
  const cancelTint = cancelArmed ? '#ff453a' : overlayHint;
  const bottomDockPad = Math.max(insets.bottom, 10) + 12;

  const recordOrbBase = useMemo(() => {
    if (camBase) return camBase;
    const size = COMPOSER_BTN_SIZE;
    const y = SCREEN_H - bottomDockPad - COMPOSER_BAR_ROW_HEIGHT + (COMPOSER_BAR_ROW_HEIGHT - size) / 2;
    return {
      x: SCREEN_W - COMPOSER_BAR_PADDING_H - size,
      y,
      width: size,
      height: size,
    };
  }, [camBase, bottomDockPad]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={cancelAll}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.modalRoot} pointerEvents="box-none">
        <View
          style={styles.gestureLayer}
          pointerEvents={fingerDown && !locked ? 'auto' : 'box-none'}
          {...videoPanHandlers}
        />
        <View style={styles.dimLayer} pointerEvents="none" />

        <View
          style={[styles.fullscreenBody, { paddingTop: insets.top + 8, paddingBottom: bottomDockPad + BOTTOM_DOCK_MIN }]}
          pointerEvents="box-none"
        >
          <View style={styles.circleStage} pointerEvents="box-none">
            <View style={styles.circleHandle} />
            <View style={styles.circleOuter}>
              {isRecording ? (
                <VideoNoteProgressRing
                  key={ringSessionKey}
                  size={CIRCLE + 10}
                  strokeWidth={3}
                  animateToFullMs={MAX_DURATION_SEC * 1000}
                />
              ) : null}
              <View style={styles.circleClipOuter}>
                <VideoNoteCircleCamera
                  size={CIRCLE}
                  cameraRef={cameraRef}
                  facing={facing}
                  torch={torch}
                  canShow={Boolean(canShowCamera)}
                  onReady={onCameraReady}
                />
                {!cameraReady && canShowCamera ? (
                  <View style={styles.prepOverlay}>
                    <Text style={styles.prepText}>Камера…</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {isRecording ? (
              <View style={styles.toolsUnderCircle} pointerEvents="box-none">
                <View style={styles.toolPill}>
                  <TouchableOpacity
                    onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
                    style={styles.toolBtn}
                    hitSlop={8}
                  >
                    <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.toolDivider} />
                  <TouchableOpacity
                    onPress={() => setTorch((t) => !t)}
                    style={styles.toolBtn}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={torch ? 'flash' : 'flash-outline'}
                      size={22}
                      color={torch ? talkBrand.accentBright : '#fff'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={[styles.bottomDock, { paddingBottom: bottomDockPad }]}
          pointerEvents={fingerDown && !locked ? 'none' : 'auto'}
        >
          <View style={styles.barRow}>
            {locked ? (
              <>
                <View style={styles.timerRow}>
                  <Animated.View style={[styles.recDot, { opacity: recPulse }]} />
                  <Text style={[styles.timerText, { color: overlayText }]}>{timer}</Text>
                </View>
                <View style={styles.lockedCenter}>
                  <TouchableOpacity
                    style={styles.lockedCancelBtn}
                    onPress={() => void cancelAll()}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.lockedCancelText}>ОТМЕНА</Text>
                  </TouchableOpacity>
                </View>
                {!trashing ? (
                  <TouchableOpacity
                    style={styles.sendOrb}
                    activeOpacity={0.85}
                    onPress={() => void finishAndSend()}
                  >
                    <Ionicons name="send" size={22} color="#fff" />
                  </TouchableOpacity>
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
                      { opacity: 0.55 + cancelProgress * 0.45, transform: [{ scale: trashScale }] },
                    ]}
                  >
                    <View style={[styles.trashInline, cancelArmed && styles.trashInlineActive]}>
                      <Ionicons
                        name="trash"
                        size={24}
                        color={cancelArmed || trashing ? '#ff453a' : overlayText}
                      />
                    </View>
                  </Animated.View>
                ) : (
                  <View style={styles.timerRow}>
                    <Animated.View style={[styles.recDot, { opacity: recPulse }]} />
                    <Text style={[styles.timerText, { color: overlayText }, cancelArmed && styles.timerCancel]}>
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
                        color={cancelArmed ? '#ff453a' : overlayHint}
                        style={{ opacity: 1 - i * 0.32, marginLeft: i === 0 ? 0 : -7 }}
                      />
                    ))}
                  </View>
                  <Text
                    style={[styles.cancelText, { color: cancelTint }, cancelArmed && styles.cancelTextActive]}
                  >
                    {trashing ? 'Удалено' : cancelArmed ? 'Отмена' : 'Влево — отмена'}
                  </Text>
                </View>
                <View style={styles.barSpacer} />
              </>
            )}
          </View>
        </View>

        <VideoNoteGestureChrome
          gestureDx={gestureDx}
          gestureDy={gestureDy}
          locked={locked}
          trashing={trashing}
          fingerDown={fingerDown}
          recordOrbBase={recordOrbBase}
          trashScale={trashScale}
          orbScale={orbScale}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, backgroundColor: linksterCanvas.dark },
  gestureLayer: { ...StyleSheet.absoluteFill, zIndex: 10 },
  dimLayer: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.72)' },
  fullscreenBody: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
    marginBottom: 10,
  },
  circleOuter: {
    width: CIRCLE + 10,
    height: CIRCLE + 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleClipOuter: {
    width: CIRCLE,
    height: CIRCLE,
    position: 'relative',
  },
  prepOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  prepText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  toolsUnderCircle: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    paddingTop: COMPOSER_BAR_PADDING_TOP,
    paddingHorizontal: COMPOSER_BAR_PADDING_H,
  },
  toolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 24,
    paddingHorizontal: 4,
  },
  toolBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  toolDivider: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.15)' },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: COMPOSER_BAR_ROW_HEIGHT,
  },
  timerRow: { flexDirection: 'row', alignItems: 'center', minWidth: 78, gap: 9 },
  timerTrashSlot: { minWidth: 78, justifyContent: 'flex-start' },
  trashInline: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  trashInlineActive: { backgroundColor: 'rgba(255, 59, 48, 0.38)' },
  recDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: TG_REC_RED },
  timerText: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  timerCancel: { color: '#ff453a' },
  cancelHint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cancelChevrons: { flexDirection: 'row', alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '500' },
  cancelTextActive: { color: '#ff453a', fontWeight: '600' },
  lockedCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockedCancelBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  lockedCancelText: { color: talkBrand.accentBright, fontSize: 15, fontWeight: '700', letterSpacing: 0.6 },
  barSpacer: { width: COMPOSER_BTN_SIZE, height: COMPOSER_BTN_SIZE },
  sendOrb: {
    width: COMPOSER_BTN_SIZE,
    height: COMPOSER_BTN_SIZE,
    borderRadius: COMPOSER_BTN_SIZE / 2,
    backgroundColor: TG_VIDEO_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
