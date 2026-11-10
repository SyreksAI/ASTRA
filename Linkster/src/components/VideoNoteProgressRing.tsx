import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size: number;
  strokeWidth: number;
  /** Длительность полного оборота 0→360° (линейно, от 12 часов по часовой) */
  animateToFullMs: number;
  trackColor?: string;
  progressColor?: string;
};

export default function VideoNoteProgressRing({
  size,
  strokeWidth,
  animateToFullMs,
  trackColor = 'rgba(255,255,255,0.22)',
  progressColor = '#ffffff',
}: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    const timing = Animated.timing(anim, {
      toValue: 1,
      duration: animateToFullMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    timing.start();
    return () => {
      timing.stop();
    };
  }, [animateToFullMs, anim]);

  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
});
