import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  Platform,
  Animated,
  PanResponder,
  Easing,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { talkBrand } from '../../../theme/talkTheme';
import { linksterDarkHub } from '../theme/linksterDarkHub';

type KeyDef = {
  id: string;
  main: string;
  longPress?: string;
};

const KEY_ROWS: KeyDef[][] = [
  [
    { id: '1', main: '1' },
    { id: '2', main: '2' },
    { id: '3', main: '3' },
  ],
  [
    { id: '4', main: '4' },
    { id: '5', main: '5' },
    { id: '6', main: '6' },
  ],
  [
    { id: '7', main: '7' },
    { id: '8', main: '8' },
    { id: '9', main: '9' },
  ],
  [
    { id: '*', main: '*' },
    { id: '0', main: '0', longPress: '+' },
    { id: '#', main: '#' },
  ],
];

const SHEET_H_PAD = 12;
const KEY_GAP = 6;
const ROW_GAP = 6;
const KEY_H = 46;
/** Скругление блока удаления и серой обводки */
const DELETE_CORNER_R = 23;
const DISMISS_DRAG_PX = 76;
const DISMISS_VELOCITY = 1.05;
/** Чуть выше нижнего края экрана */
const SHEET_BOTTOM_LIFT = 10;
/** Затемнение страницы «Звонки» под клавиатурой (как в макете) */
export const KEYPAD_MODAL_SCRIM = 'rgba(0, 0, 0, 0.35)';

type Props = {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
};

type Layout = {
  padWidth: number;
  digitColW: number;
  actionW: number;
  callD: number;
  railH: number;
};

function computeLayout(screenW: number): Layout {
  const padWidth = screenW - SHEET_H_PAD * 2;
  const actionW = Math.round(Math.min(88, Math.max(72, padWidth * 0.23)));
  const digitAreaW = padWidth - actionW - KEY_GAP;
  const digitColW = (digitAreaW - KEY_GAP * 2) / 3;
  const railH = KEY_H * 4 + ROW_GAP * 3;
  const callD = Math.round(Math.min(72, actionW + 14));
  return { padWidth, digitColW, actionW, callD, railH };
}

export default function LinksterPhoneKeypadModal({ visible, isDark, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const layout = useMemo(() => computeLayout(screenW), [screenW]);
  const { padWidth, digitColW, actionW, callD, railH } = layout;
  const sheetEnterY = useMemo(() => Math.round(Math.min(480, screenH * 0.48)), [screenH]);
  const sheetExitY = useMemo(() => Math.round(screenH * 0.55), [screenH]);

  const [digits, setDigits] = useState('');
  const longPressFiredRef = useRef(false);
  const sheetDragY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dismissingRef = useRef(false);

  const finishClose = useCallback(() => {
    dismissingRef.current = false;
    sheetDragY.setValue(sheetEnterY);
    backdropOpacity.setValue(0);
    onClose();
  }, [backdropOpacity, onClose, sheetDragY, sheetEnterY]);

  const dismissSheet = useCallback(() => {
    if (dismissingRef.current || !visible) return;
    dismissingRef.current = true;
    sheetDragY.stopAnimation();
    backdropOpacity.stopAnimation();

    Animated.parallel([
      Animated.timing(sheetDragY, {
        toValue: sheetExitY,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) finishClose();
      else dismissingRef.current = false;
    });
  }, [backdropOpacity, finishClose, sheetDragY, sheetExitY, visible]);

  const snapSheetBack = useCallback(() => {
    Animated.parallel([
      Animated.spring(sheetDragY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 280,
        mass: 0.85,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: false,
      }),
    ]).start();
  }, [backdropOpacity, sheetDragY]);

  const sheetPan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 10 && g.dy > Math.abs(g.dx) * 1.2,
        onMoveShouldSetPanResponderCapture: (_, g) => g.dy > 14 && g.dy > Math.abs(g.dx) * 1.25,
        onPanResponderGrant: () => {
          sheetDragY.stopAnimation();
          backdropOpacity.stopAnimation();
        },
        onPanResponderMove: (_, g) => {
          const dy = Math.max(0, g.dy);
          sheetDragY.setValue(dy);
          const fade = Math.max(0, 1 - dy / (sheetExitY * 0.85));
          backdropOpacity.setValue(fade);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy >= DISMISS_DRAG_PX || g.vy >= DISMISS_VELOCITY) {
            dismissSheet();
            return;
          }
          snapSheetBack();
        },
        onPanResponderTerminate: () => {
          snapSheetBack();
        },
      }),
    [backdropOpacity, dismissSheet, sheetDragY, sheetExitY, snapSheetBack]
  );

  const palette = useMemo(
    () =>
      isDark
        ? {
            sheet: '#121214',
            text: linksterDarkHub.textPrimary,
            muted: linksterDarkHub.textMuted,
            keyBg: 'rgba(255,255,255,0.08)',
            keyPressed: 'rgba(255,255,255,0.14)',
            railBg: 'rgba(255,255,255,0.06)',
            callActive: talkBrand.accent,
            callDisabled: 'rgba(79, 133, 126, 0.5)',
            accent: talkBrand.accent,
          }
        : {
            sheet: '#FFFFFF',
            text: '#1C1C1E',
            muted: '#AEAEB2',
            keyBg: '#EBEBEF',
            keyPressed: '#DCDCE2',
            railBg: '#EBEBEF',
            callActive: talkBrand.accent,
            callDisabled: 'rgba(0, 168, 150, 0.42)',
            accent: talkBrand.accent,
          },
    [isDark]
  );

  useEffect(() => {
    if (!visible) {
      backdropOpacity.setValue(0);
      return;
    }
    setDigits('');
    dismissingRef.current = false;
    sheetDragY.setValue(sheetEnterY);
    backdropOpacity.setValue(0);

    const frame = requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(sheetDragY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 26,
          stiffness: 300,
          mass: 0.92,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: false,
        }),
      ]).start();
    });

    return () => cancelAnimationFrame(frame);
  }, [visible, backdropOpacity, sheetDragY, sheetEnterY]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      dismissSheet();
      return true;
    });
    return () => sub.remove();
  }, [visible, dismissSheet]);

  const append = useCallback((char: string) => {
    setDigits((prev) => prev + char);
  }, []);

  const backspace = useCallback(() => {
    setDigits((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  const startCall = useCallback(() => {
    const n = digits.trim();
    if (!n) return;
    Alert.alert('Linkster', `Звонок на ${n} — демо.`);
  }, [digits]);

  const onAddContact = useCallback(() => {
    Alert.alert('Linkster', 'Добавление контакта — скоро.');
  }, []);

  const canCall = digits.length > 0;
  const pillRadius = KEY_H / 2;
  const deleteH = KEY_H * 2 + ROW_GAP + 18;

  const renderDigitKey = (key: KeyDef) => (
    <Pressable
      style={({ pressed }) => [
        styles.digitKey,
        {
          width: digitColW,
          height: KEY_H,
          borderRadius: pillRadius,
          backgroundColor: pressed ? palette.keyPressed : palette.keyBg,
        },
      ]}
      onPress={() => {
        if (longPressFiredRef.current) {
          longPressFiredRef.current = false;
          return;
        }
        append(key.main);
      }}
      onLongPress={() => {
        if (!key.longPress) return;
        longPressFiredRef.current = true;
        append(key.longPress);
      }}
      delayLongPress={420}
      android_disableSound
    >
      <Text style={[styles.digitMain, { color: palette.text }]}>{key.main}</Text>
    </Pressable>
  );

  if (!visible) return null;

  return (
    <View style={styles.host} pointerEvents="box-none">
      <View style={styles.overlay}>
        <Animated.View
          pointerEvents="none"
          collapsable={false}
          style={[styles.scrim, { opacity: backdropOpacity }]}
        />
        <Pressable
          style={styles.backdropTap}
          onPress={dismissSheet}
          accessibilityLabel="Закрыть клавиатуру"
          accessibilityRole="button"
        />

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 8),
              marginBottom: SHEET_BOTTOM_LIFT,
              backgroundColor: palette.sheet,
              transform: [{ translateY: sheetDragY }],
            },
          ]}
        >
          <View style={styles.grabberZone} {...sheetPan.panHandlers}>
            <View style={[styles.grabber, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#C7C7CC' }]} />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputMain}>
              {!canCall ? <View style={[styles.cursor, { backgroundColor: palette.accent }]} /> : null}
              <Text
                style={[
                  styles.inputText,
                  { color: canCall ? palette.text : palette.muted },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {canCall ? digits : 'Введите номер'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onAddContact}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Добавить контакт"
            >
              <Ionicons name="person-add" size={26} color={palette.accent} />
            </TouchableOpacity>
          </View>

          <View style={[styles.keypadRow, { width: padWidth }]}>
            <View style={styles.digitBlock}>
              {KEY_ROWS.map((row, rowIndex) => (
                <View
                  key={row.map((k) => k.id).join('-')}
                  style={[
                    styles.digitRow,
                    { marginBottom: rowIndex < KEY_ROWS.length - 1 ? ROW_GAP : 0, gap: KEY_GAP },
                  ]}
                >
                  {row.map((key) => (
                    <View key={key.id}>{renderDigitKey(key)}</View>
                  ))}
                </View>
              ))}
            </View>

            <View style={[styles.actionCol, { width: actionW, height: railH }]}>
              <View
                style={[
                  styles.actionRailShell,
                  {
                    width: actionW,
                    height: deleteH + 8,
                    borderRadius: DELETE_CORNER_R,
                    backgroundColor: palette.railBg,
                  },
                ]}
              >
                <Pressable
                  onPress={backspace}
                  style={({ pressed }) => [
                    styles.deletePill,
                    {
                      width: actionW - 8,
                      height: deleteH,
                      borderRadius: DELETE_CORNER_R,
                      backgroundColor: pressed ? palette.keyPressed : palette.keyBg,
                    },
                  ]}
                  accessibilityLabel="Удалить символ"
                >
                  <View style={styles.deleteIconBox}>
                    <Ionicons name="backspace" size={22} color={palette.text} />
                  </View>
                </Pressable>
              </View>

              <View style={styles.callSlot}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={startCall}
                  disabled={!canCall}
                  accessibilityLabel="Позвонить"
                  style={[
                    styles.callBtn,
                    {
                      width: callD,
                      height: callD,
                      borderRadius: callD / 2,
                      backgroundColor: palette.callActive,
                      opacity: canCall ? 1 : 0.55,
                    },
                  ]}
                >
                  <Ionicons name="call" size={Math.round(callD * 0.44)} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    elevation: 40,
  },
  overlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: KEYPAD_MODAL_SCRIM,
    zIndex: 1,
    elevation: 1,
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    elevation: 2,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: SHEET_H_PAD,
    paddingTop: 0,
    zIndex: 3,
    elevation: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      default: {},
    }),
  },
  grabberZone: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: 2,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
    minHeight: 36,
  },
  inputMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  cursor: {
    width: 2,
    height: 22,
    borderRadius: 1,
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '400',
  },
  keypadRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: KEY_GAP,
  },
  digitBlock: {
    flex: 1,
  },
  digitRow: {
    flexDirection: 'row',
  },
  digitKey: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitMain: {
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 28,
  },
  actionCol: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actionRailShell: {
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  deletePill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  callSlot: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 2,
  },
  callBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: talkBrand.accent,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
});
