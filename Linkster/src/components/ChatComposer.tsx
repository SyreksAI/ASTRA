import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  PanResponder,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { talkBrand } from '../theme/talkTheme';
import { clampVoiceSlideX, shouldInstantCancelVoice } from './voiceGesture';
import {
  COMPOSER_BAR_PADDING_H,
  COMPOSER_BAR_PADDING_TOP,
  COMPOSER_BAR_ROW_HEIGHT,
} from './composerBarLayout';
import type { ComposerScreenRect } from './voiceOverlayTypes';
import ChatVoiceRecordSession from './ChatVoiceRecordSession';
import ChatVideoNoteSession from './ChatVideoNoteSession';
import ComposerSmileyIcon from './ComposerSmileyIcon';
import ChatEmojiKeyboard from './ChatEmojiKeyboard';

type MediaSlot = 'voice' | 'camera';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onSend: () => void;
  sending: boolean;
  disabled?: boolean;
  isDark: boolean;
  paddingBottom: number;
  onAttachPress: () => void;
  onSendFile: (
    localUri: string,
    mimeType: string,
    messageType: 'image' | 'file',
    opts?: {
      videoNote?: boolean;
      durationSec?: number;
      width?: number;
      height?: number;
      pendingPreview?: string;
    }
  ) => Promise<void>;
};

const HOLD_MS = 280;
const TAP_MAX_MOVE = 12;
const SIDE_SLOT = 40;
const SEND_ORB = 36;
const INPUT_LINE = 20;

const DEFAULT_EMOJI_PANEL_H = Platform.OS === 'ios' ? 320 : 300;

export default function ChatComposer({
  value,
  onChangeText,
  onSend,
  sending,
  disabled,
  isDark,
  paddingBottom,
  onAttachPress,
  onSendFile,
}: Props) {
  const [mediaSlot, setMediaSlot] = useState<MediaSlot>('voice');
  const [voiceActive, setVoiceActive] = useState(false);
  const [fingerDown, setFingerDown] = useState(false);
  const [gesture, setGesture] = useState({ dx: 0, dy: 0 });
  const [fingerPage, setFingerPage] = useState<{ x: number; y: number } | null>(null);
  const [videoActive, setVideoActive] = useState(false);
  const [videoFingerDown, setVideoFingerDown] = useState(false);
  const videoGestureStoreRef = useRef({ dx: 0, dy: 0 });
  const [voiceModuleReady, setVoiceModuleReady] = useState(false);
  const [videoModuleReady, setVideoModuleReady] = useState(false);

  const fingerDownRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingRef = useRef(false);
  const gestureRef = useRef({ dx: 0, dy: 0 });
  const instantCancelRef = useRef(false);
  const videoFingerDownRef = useRef(false);
  const videoHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRecordingRef = useRef(false);
  const videoGestureRef = useRef({ dx: 0, dy: 0 });
  const videoInstantCancelRef = useRef(false);
  const micBtnRef = useRef<View>(null);
  const camBtnRef = useRef<View>(null);
  const barRef = useRef<View>(null);
  const inputRef = useRef<TextInput>(null);
  const lastKeyboardHeightRef = useRef(DEFAULT_EMOJI_PANEL_H);
  const [micAnchor, setMicAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [camAnchor, setCamAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [composerRect, setComposerRect] = useState<ComposerScreenRect | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiPanelHeight, setEmojiPanelHeight] = useState(DEFAULT_EMOJI_PANEL_H);
  const hasText = Boolean(value.trim());

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: { endCoordinates: { height: number } }) => {
      const h = Math.max(220, Math.round(e.endCoordinates.height));
      lastKeyboardHeightRef.current = h;
      setEmojiPanelHeight(h);
      setEmojiOpen(false);
    };
    const onHide = () => {
      /* keep last height for emoji panel */
    };
    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  useEffect(() => {
    if (hasText) setMediaSlot('voice');
  }, [hasText]);

  const ensureVoiceModule = useCallback(async () => {
    if (voiceModuleReady) return true;
    try {
      await import('./ChatVoiceRecordSession');
      setVoiceModuleReady(true);
      return true;
    } catch {
      Alert.alert(
        'Голосовые сообщения',
        'Обновите Expo Go до последней версии или пересоберите dev-билд.'
      );
      return false;
    }
  }, [voiceModuleReady]);

  const ensureVideoModule = useCallback(async () => {
    if (videoModuleReady) return true;
    try {
      await import('./ChatVideoNoteSession');
      setVideoModuleReady(true);
      return true;
    } catch {
      Alert.alert(
        'Видеосообщения',
        'Обновите Expo Go до последней версии или пересоберите dev-билд.'
      );
      return false;
    }
  }, [videoModuleReady]);

  useEffect(() => {
    if (mediaSlot === 'camera') {
      void ensureVideoModule();
    }
  }, [mediaSlot, ensureVideoModule]);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const clearVideoHoldTimer = useCallback(() => {
    if (videoHoldTimerRef.current) {
      clearTimeout(videoHoldTimerRef.current);
      videoHoldTimerRef.current = null;
    }
  }, []);

  const closeVoice = useCallback(() => {
    setVoiceActive(false);
    fingerDownRef.current = false;
    recordingRef.current = false;
    setFingerDown(false);
    gestureRef.current = { dx: 0, dy: 0 };
    setGesture({ dx: 0, dy: 0 });
    setFingerPage(null);
    instantCancelRef.current = false;
    clearHoldTimer();
  }, [clearHoldTimer]);

  const onVoiceRecorded = useCallback(
    async (uri: string, durationSec: number) => {
      await onSendFile(uri, 'audio/mp4', 'file', { durationSec });
    },
    [onSendFile]
  );

  const onVideoRecorded = useCallback(
    async (uri: string, meta: { durationSec: number; width: number; height: number }) => {
      await onSendFile(uri, 'video/mp4', 'file', {
        videoNote: true,
        durationSec: meta.durationSec,
        width: meta.width,
        height: meta.height,
      });
    },
    [onSendFile]
  );

  const measureMicAnchor = useCallback(() => {
    micBtnRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setMicAnchor({ x, y, width, height });
      }
    });
  }, []);

  const measureComposerRect = useCallback(() => {
    barRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setComposerRect({ x, y, width, height });
      }
    });
  }, []);

  const measureCamAnchor = useCallback(() => {
    camBtnRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setCamAnchor({ x, y, width, height });
      }
    });
  }, []);

  const closeVideo = useCallback(() => {
    setVideoActive(false);
    videoFingerDownRef.current = false;
    videoRecordingRef.current = false;
    setVideoFingerDown(false);
    videoGestureRef.current = { dx: 0, dy: 0 };
    videoGestureStoreRef.current = { dx: 0, dy: 0 };
    videoInstantCancelRef.current = false;
    clearVideoHoldTimer();
  }, [clearVideoHoldTimer]);

  const beginVideoHold = useCallback(async () => {
    if (disabled || videoRecordingRef.current) return;
    videoRecordingRef.current = true;
    videoFingerDownRef.current = true;
    setVideoFingerDown(true);
    videoGestureRef.current = { dx: 0, dy: 0 };
    videoGestureStoreRef.current = { dx: 0, dy: 0 };
    measureCamAnchor();
    measureComposerRect();
    const ok = await ensureVideoModule();
    if (ok && videoFingerDownRef.current) {
      measureCamAnchor();
      measureComposerRect();
      setVideoActive(true);
    } else {
      closeVideo();
    }
  }, [disabled, ensureVideoModule, closeVideo, measureCamAnchor, measureComposerRect]);

  const beginVoiceHold = useCallback(async () => {
    if (disabled || recordingRef.current) return;
    recordingRef.current = true;
    fingerDownRef.current = true;
    setFingerDown(true);
    gestureRef.current = { dx: 0, dy: 0 };
    setGesture({ dx: 0, dy: 0 });
    measureMicAnchor();
    measureComposerRect();
    const ok = await ensureVoiceModule();
    if (ok && fingerDownRef.current) {
      measureMicAnchor();
      measureComposerRect();
      setVoiceActive(true);
    } else {
      closeVoice();
    }
  }, [disabled, ensureVoiceModule, closeVoice, measureMicAnchor, measureComposerRect]);

  const voiceMicPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled && !hasText && mediaSlot === 'voice',
        onMoveShouldSetPanResponder: () =>
          !disabled && !hasText && mediaSlot === 'voice' && (recordingRef.current || fingerDownRef.current),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          if (disabled || hasText || mediaSlot !== 'voice') return;
          const { pageX, pageY } = evt.nativeEvent;
          setFingerPage({ x: pageX, y: pageY });
          clearHoldTimer();
          holdTimerRef.current = setTimeout(() => {
            void beginVoiceHold();
          }, HOLD_MS);
        },
        onPanResponderMove: (evt, g) => {
          const { pageX, pageY } = evt.nativeEvent;
          setFingerPage({ x: pageX, y: pageY });
          if (!recordingRef.current && !fingerDownRef.current) return;
          if (instantCancelRef.current) return;
          const slideX = clampVoiceSlideX(g.dx);
          gestureRef.current = { dx: g.dx, dy: g.dy };
          setGesture({ dx: g.dx, dy: g.dy });
          if (shouldInstantCancelVoice(slideX)) {
            instantCancelRef.current = true;
            fingerDownRef.current = false;
            setFingerDown(false);
          }
        },
        onPanResponderRelease: (_, g) => {
          clearHoldTimer();
          const moved = Math.abs(g.dx) > TAP_MAX_MOVE || Math.abs(g.dy) > TAP_MAX_MOVE;
          if (!recordingRef.current) {
            if (!moved) {
              setMediaSlot((slot) => (slot === 'voice' ? 'camera' : 'voice'));
            }
            return;
          }
          gestureRef.current = { dx: g.dx, dy: g.dy };
          setGesture({ dx: g.dx, dy: g.dy });
          fingerDownRef.current = false;
          setFingerDown(false);
        },
        onPanResponderTerminate: (_, g) => {
          clearHoldTimer();
          if (recordingRef.current) {
            gestureRef.current = { dx: g.dx, dy: g.dy };
            fingerDownRef.current = false;
            setFingerDown(false);
          }
        },
      }),
    [disabled, hasText, mediaSlot, clearHoldTimer, beginVoiceHold]
  );

  const videoCamPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled && !hasText && mediaSlot === 'camera',
        onMoveShouldSetPanResponder: () =>
          !disabled &&
          !hasText &&
          mediaSlot === 'camera' &&
          (videoRecordingRef.current || videoFingerDownRef.current),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          if (disabled || hasText || mediaSlot !== 'camera') return;
          clearVideoHoldTimer();
          videoHoldTimerRef.current = setTimeout(() => {
            void beginVideoHold();
          }, HOLD_MS);
        },
        onPanResponderMove: (_, g) => {
          if (!videoRecordingRef.current && !videoFingerDownRef.current) return;
          if (videoInstantCancelRef.current) return;
          const slideX = clampVoiceSlideX(g.dx);
          videoGestureRef.current = { dx: g.dx, dy: g.dy };
          videoGestureStoreRef.current = { dx: g.dx, dy: g.dy };
          if (shouldInstantCancelVoice(slideX)) {
            videoInstantCancelRef.current = true;
            videoFingerDownRef.current = false;
            setVideoFingerDown(false);
          }
        },
        onPanResponderRelease: (_, g) => {
          clearVideoHoldTimer();
          const moved = Math.abs(g.dx) > TAP_MAX_MOVE || Math.abs(g.dy) > TAP_MAX_MOVE;
          if (!videoRecordingRef.current) {
            if (!moved) {
              setMediaSlot((slot) => (slot === 'camera' ? 'voice' : 'camera'));
            }
            return;
          }
          videoGestureRef.current = { dx: g.dx, dy: g.dy };
          videoGestureStoreRef.current = { dx: g.dx, dy: g.dy };
          videoFingerDownRef.current = false;
          setVideoFingerDown(false);
        },
        onPanResponderTerminate: (_, g) => {
          clearVideoHoldTimer();
          if (videoRecordingRef.current) {
            videoGestureRef.current = { dx: g.dx, dy: g.dy };
            videoGestureStoreRef.current = { dx: g.dx, dy: g.dy };
            videoFingerDownRef.current = false;
            setVideoFingerDown(false);
          }
        },
      }),
    [disabled, hasText, mediaSlot, clearVideoHoldTimer, beginVideoHold]
  );

  const recordingUi = voiceActive || videoActive;

  useEffect(() => {
    if (voiceActive) {
      measureMicAnchor();
      measureComposerRect();
    }
  }, [voiceActive, measureMicAnchor, measureComposerRect]);

  const appendEmoji = useCallback(
    (emo: string) => {
      onChangeText(value + emo);
    },
    [onChangeText, value]
  );

  const handleEmojiBackspace = useCallback(() => {
    if (!value) return;
    onChangeText([...value].slice(0, -1).join(''));
  }, [value, onChangeText]);

  const toggleEmojiPanel = useCallback(() => {
    if (disabled || recordingUi) return;
    setEmojiOpen((open) => {
      const next = !open;
      if (next) {
        Keyboard.dismiss();
        inputRef.current?.blur();
        setEmojiPanelHeight(lastKeyboardHeightRef.current);
      } else {
        setTimeout(() => inputRef.current?.focus(), Platform.OS === 'ios' ? 60 : 0);
      }
      return next;
    });
  }, [disabled, recordingUi]);

  const barBottomPad = emojiOpen && !recordingUi ? 6 : paddingBottom;

  return (
    <>
      <View style={styles.composerRoot}>
        <View
          ref={barRef}
          onLayout={measureComposerRect}
          collapsable={false}
          style={[
            styles.bar,
            isDark && styles.barDark,
            { paddingBottom: barBottomPad },
            recordingUi && styles.barHiddenUnderOverlay,
          ]}
          pointerEvents={recordingUi ? 'box-none' : 'auto'}
        >
        <View style={styles.inputShell}>
          <TouchableOpacity
            style={styles.sideSlot}
            onPress={toggleEmojiPanel}
            disabled={disabled || recordingUi}
            hitSlop={6}
            activeOpacity={0.65}
          >
            <ComposerSmileyIcon
              size={24}
              color={
                emojiOpen
                  ? talkBrand.accent
                  : isDark
                    ? 'rgba(255,255,255,0.5)'
                    : '#7a8a96'
              }
            />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={[styles.input, isDark && styles.inputDark]}
            value={value}
            onChangeText={onChangeText}
            placeholder="Сообщение"
            placeholderTextColor={isDark ? '#71767b' : '#8b98a5'}
            multiline
            editable={!disabled && !recordingUi}
            showSoftInputOnFocus={!emojiOpen}
            onFocus={() => {
              if (!emojiOpen) return;
              setEmojiOpen(false);
              setTimeout(() => inputRef.current?.focus(), Platform.OS === 'ios' ? 80 : 30);
            }}
          />

          <View style={styles.trailingControls}>
            <TouchableOpacity
              style={styles.sideSlot}
              onPress={onAttachPress}
              disabled={disabled || recordingUi}
              hitSlop={6}
              activeOpacity={0.65}
            >
              <Ionicons
                name="attach"
                size={24}
                color={isDark ? 'rgba(255,255,255,0.55)' : '#6b7c8a'}
              />
            </TouchableOpacity>

            {hasText ? (
              <TouchableOpacity
                style={styles.sideSlot}
                onPress={onSend}
                disabled={sending || disabled}
                activeOpacity={0.85}
              >
                <View style={[styles.actionOrb, styles.actionOrbPrimary, sending && { opacity: 0.55 }]}>
                  {sending ? (
                    <ActivityIndicator size="small" color={talkBrand.onAccent} />
                  ) : (
                    <Ionicons name="arrow-up" size={22} color={talkBrand.onAccent} />
                  )}
                </View>
              </TouchableOpacity>
            ) : mediaSlot === 'voice' ? (
              <View
                ref={micBtnRef}
                onLayout={measureMicAnchor}
                {...voiceMicPan.panHandlers}
                style={[styles.sideSlot, voiceActive && styles.sideSlotGhost]}
                collapsable={false}
              >
                {!voiceActive ? (
                  <View style={[styles.actionOrb, styles.actionOrbPrimary]}>
                    <Ionicons name="mic" size={22} color={talkBrand.onAccent} />
                  </View>
                ) : (
                  <View style={styles.actionOrb} />
                )}
              </View>
            ) : (
              <View
                ref={camBtnRef}
                onLayout={measureCamAnchor}
                {...videoCamPan.panHandlers}
                style={[styles.sideSlot, videoActive && styles.sideSlotGhost]}
                collapsable={false}
              >
                {!videoActive ? (
                  <View style={[styles.actionOrb, styles.actionOrbPrimary]}>
                    <Ionicons name="videocam" size={22} color={talkBrand.onAccent} />
                  </View>
                ) : (
                  <View style={styles.actionOrb} />
                )}
              </View>
            )}
          </View>
        </View>
        </View>

        {emojiOpen && !recordingUi ? (
          <ChatEmojiKeyboard
            isDark={isDark}
            height={emojiPanelHeight}
            paddingBottom={paddingBottom}
            onEmoji={appendEmoji}
            onBackspace={handleEmojiBackspace}
          />
        ) : null}
      </View>

      {voiceActive && voiceModuleReady ? (
        <ChatVoiceRecordSession
          visible
          isDark={isDark}
          fingerDown={fingerDown}
          gestureDx={gesture.dx}
          gestureDy={gesture.dy}
          paddingBottom={paddingBottom}
          micAnchor={micAnchor}
          fingerPage={fingerPage}
          composerRect={composerRect}
          voicePanHandlers={voiceMicPan.panHandlers}
          onClose={closeVoice}
          onRecorded={onVoiceRecorded}
        />
      ) : null}

      {videoActive && videoModuleReady ? (
        <ChatVideoNoteSession
          visible
          isDark={isDark}
          fingerDown={videoFingerDown}
          gestureRef={videoGestureStoreRef}
          paddingBottom={paddingBottom}
          camAnchor={camAnchor}
          composerRect={composerRect}
          videoPanHandlers={videoCamPan.panHandlers as Record<string, unknown>}
          onClose={closeVideo}
          onRecorded={onVideoRecorded}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: COMPOSER_BAR_PADDING_H,
    paddingTop: COMPOSER_BAR_PADDING_TOP,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'transparent',
  },
  barDark: {
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'transparent',
  },
  barHiddenUnderOverlay: {
    opacity: 0,
  },
  composerRoot: {
    width: '100%',
  },
  inputShell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: COMPOSER_BAR_ROW_HEIGHT,
    maxHeight: 124,
    backgroundColor: 'transparent',
  },
  sideSlot: {
    width: SIDE_SLOT,
    height: COMPOSER_BAR_ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideSlotGhost: {
    opacity: 0,
  },
  trailingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    height: COMPOSER_BAR_ROW_HEIGHT,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: INPUT_LINE,
    color: '#0f1419',
    minHeight: COMPOSER_BAR_ROW_HEIGHT,
    maxHeight: 108,
    paddingTop: (COMPOSER_BAR_ROW_HEIGHT - INPUT_LINE) / 2,
    paddingBottom: (COMPOSER_BAR_ROW_HEIGHT - INPUT_LINE) / 2,
    paddingLeft: 2,
    paddingRight: 4,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : null),
  },
  inputDark: { color: '#e7e9ea' },
  actionOrb: {
    width: SEND_ORB,
    height: SEND_ORB,
    borderRadius: SEND_ORB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOrbPrimary: {
    backgroundColor: talkBrand.accent,
  },
});
