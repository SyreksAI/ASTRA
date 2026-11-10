import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Animated,
  PanResponder,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { talkBrand } from '../../../theme/talkTheme';
import UserAvatar from '../../../components/ui/UserAvatar';
import type { StoryUser } from '../demo/linksterDemoStories';
import type { StoryOriginRect } from './storyOrigin';

const SLIDE_MS = 5200;
const TICK_MS = 40;
const REPLY_BAR_CORE = 52;
/** Поднять панель ответа над нижним краем экрана */
const REPLY_BAR_LIFT = 14;
/** Фаза 1: только сдвиг вниз до предела, размер не меняется. Фаза 2: полёт в кольцо. */
const PULL_MAX_Y_RATIO = 0.28;
const DISMISS_PULL_COMMIT = 0.32;
const DISMISS_VELOCITY_COMMIT = 0.85;
const DISMISS_VELOCITY_MIN_PULL = 0.12;

function pullMaxY(screenH: number): number {
  return screenH * PULL_MAX_Y_RATIO;
}

/** 0…1 — насколько опустили до предела */
function verticalPullProgress(dy: number, screenH: number): number {
  if (dy <= 0) return 0;
  return Math.min(1, dy / pullMaxY(screenH));
}

/** 1:1 за пальцем до предела, дальше — лёгкий резиновый ход */
function pullTranslateY(dy: number, screenH: number): number {
  const maxY = pullMaxY(screenH);
  const y = Math.max(0, dy);
  if (y <= maxY) return y;
  return maxY + (y - maxY) * 0.08;
}

type Props = {
  visible: boolean;
  users: StoryUser[];
  initialUserIndex: number;
  /** Позиция аватара в ряду — анимация «улетает на место» */
  originRect?: StoryOriginRect | null;
  onActiveUserChange?: (userId: string) => void;
  onClose: () => void;
  onUserViewed?: (userId: string) => void;
};

function computeDismissTarget(
  origin: StoryOriginRect | null | undefined,
  screenW: number,
  screenH: number
) {
  if (!origin) {
    return { tx: 0, ty: screenH, scale: 0.88 };
  }
  const cx = origin.x + origin.width / 2;
  const cy = origin.y + origin.height / 2;
  return {
    tx: cx - screenW / 2,
    ty: cy - screenH / 2,
    scale: Math.max(0.07, Math.min(0.24, origin.width / screenW)),
  };
}

function StoryBlurInput({
  value,
  onChangeText,
  onFocus,
  onBlur,
  onSubmitEditing,
}: {
  value: string;
  onChangeText: (t: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmitEditing: () => void;
}) {
  return (
    <View style={styles.replyInputShell}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={48} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={styles.replyInputGlassTint} pointerEvents="none" />
      <TextInput
        style={styles.replyInput}
        placeholder="Ответить сообщением..."
        placeholderTextColor="rgba(255, 255, 255, 0.62)"
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="send"
        multiline={false}
        underlineColorAndroid="transparent"
      />
    </View>
  );
}

function formatStoryTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 60) return `${Math.max(1, diffMin)} мин.`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)} ч.`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function LinksterStoryViewer({
  visible,
  users,
  initialUserIndex,
  originRect,
  onActiveUserChange,
  onClose,
  onUserViewed,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = Dimensions.get('screen');
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);

  const pausedRef = useRef(false);
  const longPressRef = useRef(false);
  const tapNavLockRef = useRef(false);
  const userIndexRef = useRef(userIndex);
  const slideIndexRef = useRef(slideIndex);
  const usersRef = useRef(users);
  const onUserViewedRef = useRef(onUserViewed);
  const onCloseRef = useRef(onClose);
  const dismissX = useRef(new Animated.Value(0)).current;
  const dismissY = useRef(new Animated.Value(0)).current;
  const dismissScaleAnim = useRef(new Animated.Value(1)).current;
  const backdropOpacity = useRef(new Animated.Value(1)).current;
  const dismissDraggingRef = useRef(false);
  const dismissResumeAfterRef = useRef(false);
  const dismissAnimatingRef = useRef(false);
  const dismissProgressRef = useRef(0);
  const originRectRef = useRef(originRect);
  originRectRef.current = originRect;

  userIndexRef.current = userIndex;
  slideIndexRef.current = slideIndex;

  usersRef.current = users;
  onUserViewedRef.current = onUserViewed;
  onCloseRef.current = onClose;

  const user = users[userIndex];
  const slides = user?.slides ?? [];
  const slide = slides[slideIndex];

  const markCurrentUserViewed = useCallback((uIdx: number) => {
    const u = usersRef.current[uIdx];
    if (u?.id) onUserViewedRef.current?.(u.id);
  }, []);

  useEffect(() => {
    if (visible) {
      const idx = Math.min(Math.max(initialUserIndex, 0), Math.max(users.length - 1, 0));
      userIndexRef.current = idx;
      slideIndexRef.current = 0;
      setUserIndex(idx);
      setSlideIndex(0);
      setProgress(0);
      setPaused(false);
      pausedRef.current = false;
      longPressRef.current = false;
      setReplyText('');
      setLiked(false);
      dismissDraggingRef.current = false;
      dismissAnimatingRef.current = false;
      dismissProgressRef.current = 0;
      dismissX.setValue(0);
      dismissY.setValue(0);
      dismissScaleAnim.setValue(1);
      backdropOpacity.setValue(1);
    }
  }, [visible, initialUserIndex, users.length, dismissX, dismissY, dismissScaleAnim, backdropOpacity]);

  useEffect(() => {
    if (!visible) return;
    const id = users[userIndex]?.id;
    if (id) onActiveUserChange?.(id);
  }, [visible, userIndex, users, onActiveUserChange]);

  useEffect(() => {
    setProgress(0);
    setLiked(false);
  }, [userIndex, slideIndex, slide?.id]);

  const stepNext = useCallback(() => {
    const list = usersRef.current;
    const uIdx = userIndexRef.current;
    const sIdx = slideIndexRef.current;
    const current = list[uIdx];
    if (!current) return;

    const currentSlides = current.slides ?? [];

    if (sIdx < currentSlides.length - 1) {
      const nextSlide = sIdx + 1;
      slideIndexRef.current = nextSlide;
      setSlideIndex(nextSlide);
      setProgress(0);
      return;
    }

    markCurrentUserViewed(uIdx);

    if (uIdx < list.length - 1) {
      const nextUser = uIdx + 1;
      userIndexRef.current = nextUser;
      slideIndexRef.current = 0;
      setUserIndex(nextUser);
      setSlideIndex(0);
      setProgress(0);
      return;
    }

    onCloseRef.current();
  }, [markCurrentUserViewed]);

  const stepPrev = useCallback(() => {
    const list = usersRef.current;
    const uIdx = userIndexRef.current;
    const sIdx = slideIndexRef.current;

    if (sIdx > 0) {
      const prevSlide = sIdx - 1;
      slideIndexRef.current = prevSlide;
      setSlideIndex(prevSlide);
      setProgress(0);
      return;
    }

    if (uIdx > 0) {
      const prevUser = uIdx - 1;
      const prevSlides = list[prevUser]?.slides ?? [];
      const lastSlide = Math.max(prevSlides.length - 1, 0);
      userIndexRef.current = prevUser;
      slideIndexRef.current = lastSlide;
      setUserIndex(prevUser);
      setSlideIndex(lastSlide);
      setProgress(0);
      return;
    }

    setProgress(0);
  }, []);

  const stepNextRef = useRef(stepNext);
  const stepPrevRef = useRef(stepPrev);
  stepNextRef.current = stepNext;
  stepPrevRef.current = stepPrev;

  useEffect(() => {
    if (!visible || !slide || paused) return;

    const step = TICK_MS / SLIDE_MS;
    const timer = setInterval(() => {
      if (pausedRef.current) return;
      setProgress((p) => {
        const next = p + step;
        if (next >= 1) {
          requestAnimationFrame(() => stepNextRef.current());
          return 0;
        }
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [visible, slide, paused, userIndex, slideIndex]);

  const onTapPrev = () => {
    if (longPressRef.current || tapNavLockRef.current || dismissDraggingRef.current) return;
    tapNavLockRef.current = true;
    pausedRef.current = false;
    setPaused(false);
    stepPrevRef.current();
    setTimeout(() => {
      tapNavLockRef.current = false;
    }, 180);
  };

  const onTapNext = () => {
    if (longPressRef.current || tapNavLockRef.current || dismissDraggingRef.current) return;
    tapNavLockRef.current = true;
    pausedRef.current = false;
    setPaused(false);
    stepNextRef.current();
    setTimeout(() => {
      tapNavLockRef.current = false;
    }, 180);
  };

  const pauseHold = () => {
    longPressRef.current = true;
    pausedRef.current = true;
    setPaused(true);
  };

  const resumeHold = () => {
    pausedRef.current = false;
    setPaused(false);
    setTimeout(() => {
      longPressRef.current = false;
    }, 120);
  };

  /** Telegram: сначала только вертикальный сдвиг вниз, без полёта к аватару */
  const applyDismissDrag = useCallback(
    (dy: number) => {
      const pull = verticalPullProgress(dy, screenH);
      dismissProgressRef.current = pull;
      dismissY.setValue(pullTranslateY(dy, screenH));
      dismissX.setValue(0);
      dismissScaleAnim.setValue(1);
      backdropOpacity.setValue(1 - pull * 0.5);
    },
    [backdropOpacity, dismissScaleAnim, dismissX, dismissY, screenH]
  );

  const resetDismissMotion = useCallback(() => {
    dismissProgressRef.current = 0;
    dismissX.setValue(0);
    dismissY.setValue(0);
    dismissScaleAnim.setValue(1);
    backdropOpacity.setValue(1);
  }, [backdropOpacity, dismissScaleAnim, dismissX, dismissY]);

  const finishDismiss = useCallback(() => {
    if (dismissAnimatingRef.current) return;
    dismissAnimatingRef.current = true;
    const target = computeDismissTarget(originRectRef.current, screenW, screenH);
    const easing = Easing.out(Easing.cubic);
    const flyDuration = 400;
    const maxY = pullMaxY(screenH);

    const flyToStoryRing = () => {
      Animated.parallel([
        Animated.timing(dismissY, {
          toValue: target.ty,
          duration: flyDuration,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(dismissX, {
          toValue: target.tx,
          duration: flyDuration,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(dismissScaleAnim, {
          toValue: target.scale,
          duration: flyDuration,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: flyDuration - 36,
          easing,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        resetDismissMotion();
        dismissProgressRef.current = 0;
        dismissDraggingRef.current = false;
        dismissAnimatingRef.current = false;
        markCurrentUserViewed(userIndexRef.current);
        onCloseRef.current();
      });
    };

    // Сначала довести до нижнего предела (если ещё не там), затем — полёт к аватару
    dismissY.stopAnimation((currentY) => {
      const y = typeof currentY === 'number' ? currentY : 0;
      if (y < maxY * 0.92) {
        Animated.timing(dismissY, {
          toValue: maxY,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) flyToStoryRing();
          else {
            dismissAnimatingRef.current = false;
          }
        });
      } else {
        flyToStoryRing();
      }
    });
  }, [
    backdropOpacity,
    dismissScaleAnim,
    dismissX,
    dismissY,
    markCurrentUserViewed,
    resetDismissMotion,
    screenH,
    screenW,
  ]);

  const snapDismissBack = useCallback(() => {
    Animated.parallel([
      Animated.spring(dismissY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }),
      Animated.spring(dismissX, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }),
      Animated.spring(dismissScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissDraggingRef.current = false;
      if (dismissResumeAfterRef.current) {
        pausedRef.current = false;
        setPaused(false);
      }
    });
  }, [backdropOpacity, dismissScaleAnim, dismissX, dismissY]);

  const handleClose = () => {
    if (dismissAnimatingRef.current) return;
    finishDismiss();
  };

  const dismissPan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          g.dy > 14 && g.dy > Math.abs(g.dx) * 1.25,
        onMoveShouldSetPanResponderCapture: (_, g) =>
          g.dy > 18 && g.dy > Math.abs(g.dx) * 1.35,
        onPanResponderGrant: () => {
          dismissDraggingRef.current = true;
          dismissResumeAfterRef.current = !pausedRef.current;
          pausedRef.current = true;
          setPaused(true);
          dismissX.stopAnimation();
          dismissY.stopAnimation();
          dismissScaleAnim.stopAnimation();
          backdropOpacity.stopAnimation();
        },
        onPanResponderMove: (_, g) => {
          applyDismissDrag(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          const pull = verticalPullProgress(Math.max(0, g.dy), screenH);
          const fastFlick =
            pull >= DISMISS_VELOCITY_MIN_PULL && g.vy > DISMISS_VELOCITY_COMMIT;
          if (pull >= DISMISS_PULL_COMMIT || fastFlick) {
            finishDismiss();
            return;
          }
          snapDismissBack();
        },
        onPanResponderTerminate: () => {
          snapDismissBack();
        },
      }),
    [applyDismissDrag, finishDismiss, screenH, snapDismissBack]
  );

  /** Прозрачность только на фазе полёта (когда уменьшаем к кольцу) */
  const cardOpacity = dismissScaleAnim.interpolate({
    inputRange: [0.06, 0.22, 0.88, 1],
    outputRange: [0, 0.92, 1, 1],
    extrapolate: 'clamp',
  });

  const replyBottomPad = Math.max(insets.bottom, 8) + REPLY_BAR_LIFT;
  const replyBarHeight = REPLY_BAR_CORE + replyBottomPad;

  const pauseForInput = () => {
    pausedRef.current = true;
    setPaused(true);
  };

  const resumeFromInput = () => {
    pausedRef.current = false;
    setPaused(false);
  };

  const sendReply = () => {
    const text = replyText.trim();
    if (!text) return;
    Alert.alert('Linkster', `Ответ для ${user.name} отправится в чат — демо.`);
    setReplyText('');
  };

  const toggleLike = () => {
    setLiked((v) => !v);
  };

  if (!visible || !user || !slide) return null;

  const statusText = user.isOnline
    ? 'в сети'
    : user.statusLabel || formatStoryTime(slide.createdAt);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar style="light" />
      <Animated.View style={[styles.modalBackdrop, { opacity: backdropOpacity }]}>
        <Animated.View
          style={[
            styles.root,
            {
              width: screenW,
              height: screenH,
              opacity: cardOpacity,
              transform: [
                { translateX: dismissX },
                { translateY: dismissY },
                { scale: dismissScaleAnim },
              ],
            },
          ]}
          {...dismissPan.panHandlers}
        >
        {slide.imageUri ? (
          <Image
            source={{ uri: slide.imageUri }}
            style={[styles.media, { width: screenW, height: screenH }]}
            contentFit="cover"
            contentPosition="center"
            transition={200}
          />
        ) : (
          <View
            style={[
              styles.media,
              { width: screenW, height: screenH, backgroundColor: slide.backgroundColor ?? '#1A1A2E' },
            ]}
          />
        )}

        <View style={styles.dimOverlay} pointerEvents="none" />

        <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="none">
          <View style={styles.progressRow}>
            {slides.map((s, i) => (
              <View key={s.id} style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        i < slideIndex
                          ? '100%'
                          : i === slideIndex
                            ? `${Math.min(progress, 1) * 100}%`
                            : '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          <View style={styles.headerRow}>
            <View style={styles.author}>
              <UserAvatar
                avatarPath={user.avatarUri}
                name={user.name}
                size={36}
                ring={{ color: 'rgba(255,255,255,0.85)', width: 1.5, padding: 1 }}
              />
              <View style={styles.authorText}>
                <Text style={styles.authorName}>{user.name}</Text>
                <View style={styles.statusRow}>
                  {user.isOnline ? <View style={styles.onlineDot} /> : null}
                  <Text style={styles.authorTime}>{statusText}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 10 }]}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.75}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {slide.caption ? (
          <View
            style={[styles.captionWrap, { bottom: replyBarHeight + 8 }]}
            pointerEvents="none"
          >
            <Text style={styles.caption}>{slide.caption}</Text>
          </View>
        ) : null}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.72)']}
          style={[styles.bottomFade, { height: replyBarHeight + 48 }]}
          pointerEvents="none"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.replyBarWrap, { bottom: REPLY_BAR_LIFT, paddingBottom: Math.max(insets.bottom, 8) }]}
          keyboardVerticalOffset={0}
        >
          <View style={styles.replyRow}>
            <StoryBlurInput
              value={replyText}
              onChangeText={setReplyText}
              onFocus={pauseForInput}
              onBlur={resumeFromInput}
              onSubmitEditing={sendReply}
            />
            <TouchableOpacity
              style={styles.likeBtn}
              onPress={toggleLike}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={30}
                color={liked ? '#FF375F' : '#FFFFFF'}
                style={styles.likeIcon}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Зоны тапа как в Telegram: лево — назад, право — следующий слайд / следующий автор */}
        <View
          style={[styles.tapRow, { bottom: replyBarHeight }]}
          pointerEvents="box-none"
        >
          <Pressable
            style={styles.tapHalf}
            onPress={onTapPrev}
            onLongPress={pauseHold}
            delayLongPress={260}
            onPressOut={resumeHold}
            android_disableSound
            accessibilityRole="button"
            accessibilityLabel="Предыдущая история"
          />
          <Pressable
            style={styles.tapHalf}
            onPress={onTapNext}
            onLongPress={pauseHold}
            delayLongPress={260}
            onPressOut={resumeHold}
            android_disableSound
            accessibilityRole="button"
            accessibilityLabel="Следующая история"
          />
        </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  root: { backgroundColor: '#000000', overflow: 'hidden' },
  media: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  dimOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 24,
  },
  tapRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    zIndex: 38,
  },
  tapHalf: { flex: 1, height: '100%' },
  top: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 22, paddingHorizontal: 12 },
  progressRow: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(210, 238, 232, 0.28)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    /** Почти белый с лёгким mint Linkster (#7AB8B0) */
    backgroundColor: 'rgba(224, 248, 242, 0.97)',
    borderRadius: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 44 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  authorText: { flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: talkBrand.online,
  },
  authorName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  authorTime: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  closeBtn: {
    position: 'absolute',
    right: 12,
    zIndex: 45,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 22,
  },
  replyBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 35,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  replyInputShell: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
  },
  replyInputGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(28, 32, 36, 0.72)',
  },
  replyInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 11 : 9,
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  likeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  caption: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
