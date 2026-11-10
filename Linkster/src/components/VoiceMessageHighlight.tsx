import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewProps } from 'react-native';
import { talkAccentAlpha } from '../theme/talkTheme';

const HIGHLIGHT = talkAccentAlpha(0.28);

type Props = ViewProps & {
  active: boolean;
  /** Меняется при каждом новом переходе из плеера */
  pulseKey?: number;
  children: React.ReactNode;
};

export default function VoiceMessageHighlight({
  active,
  pulseKey = 0,
  children,
  style,
  ...rest
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) {
      opacity.setValue(0);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }, 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, pulseKey, opacity]);

  return (
    <View style={[styles.wrap, style]} {...rest}>
      <Animated.View pointerEvents="none" style={[styles.glow, { opacity }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: HIGHLIGHT,
    borderRadius: 16,
  },
});
