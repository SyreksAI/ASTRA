import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { talkBrand } from '../theme/talkTheme';

type Props = {
  size: number;
  strokeWidth?: number;
  progress: number;
  trackColor?: string;
  progressColor?: string;
  /** Ручка на конце дуги (диаметр в px) */
  thumbDiameter?: number;
  thumbColor?: string;
  thumbBorderColor?: string;
};

export function progressToThumbCenter(size: number, strokeWidth: number, progress: number) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const p = Math.min(1, Math.max(0, progress));
  return {
    x: cx + radius * Math.sin(p * 2 * Math.PI),
    y: cy - radius * Math.cos(p * 2 * Math.PI),
    radius,
    cx,
    cy,
  };
}

export default function VideoNotePlaybackRing({
  size,
  strokeWidth = 2.5,
  progress,
  trackColor = 'rgba(255,255,255,0.28)',
  progressColor = talkBrand.accentBright,
  thumbDiameter = 0,
  thumbColor = talkBrand.accentBright,
  thumbBorderColor = '#ffffff',
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = useMemo(
    () => circumference * (1 - clamped),
    [circumference, clamped]
  );

  const thumb = useMemo(() => {
    if (thumbDiameter <= 0) return null;
    const { x, y } = progressToThumbCenter(size, strokeWidth, clamped);
    return { x, y, r: thumbDiameter / 2 };
  }, [thumbDiameter, size, strokeWidth, clamped]);

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
        <Circle
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
      {thumb ? (
        <View
          style={[
            styles.thumb,
            {
              width: thumbDiameter,
              height: thumbDiameter,
              borderRadius: thumb.r,
              left: thumb.x - thumb.r,
              top: thumb.y - thumb.r,
              backgroundColor: thumbColor,
              borderColor: thumbBorderColor,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  thumb: {
    position: 'absolute',
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.28,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 4 },
    }),
  },
});
