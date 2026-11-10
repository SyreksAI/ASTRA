import React from 'react';
import { View, StyleSheet } from 'react-native';
import VideoNotePlaybackRing, { progressToThumbCenter } from './VideoNotePlaybackRing';

export const RING_STROKE = 3.5;
const RING_HIT_THICKNESS = 18;
export const THUMB_DIAMETER = 16;
const THUMB_GRAB_EXTRA = 10;

export function angleToProgress(x: number, y: number, size: number): number {
  const cx = size / 2;
  const cy = size / 2;
  let p = (Math.atan2(y - cy, x - cx) + Math.PI / 2) / (2 * Math.PI);
  if (p < 0) p += 1;
  return Math.min(1, Math.max(0, p));
}

/** 0 = верх, по часовой; null — вне зоны захвата (кольцо / бегунок) */
export function touchPointToProgress(
  x: number,
  y: number,
  size: number,
  progress?: number
): number | null {
  const cx = size / 2;
  const cy = size / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);

  if (progress != null) {
    const { x: tx, y: ty } = progressToThumbCenter(size, RING_STROKE, progress);
    const grabR = THUMB_DIAMETER / 2 + THUMB_GRAB_EXTRA;
    if (Math.hypot(x - tx, y - ty) <= grabR) {
      return angleToProgress(x, y, size);
    }
  }

  const outerR = size / 2;
  const innerR = Math.max(outerR - RING_HIT_THICKNESS, outerR * 0.72);
  if (dist < innerR || dist > outerR) return null;
  return angleToProgress(x, y, size);
}

type Props = {
  size: number;
  progress: number;
  progressColor: string;
  trackColor: string;
};

/** Только отрисовка кольца и бегунка (жесты — на родителе). */
export default function VideoNoteCircularScrubOverlay({
  size,
  progress,
  progressColor,
  trackColor,
}: Props) {
  return (
    <View style={[styles.host, { width: size, height: size }]} pointerEvents="none">
      <VideoNotePlaybackRing
        size={size}
        strokeWidth={RING_STROKE}
        progress={progress}
        progressColor={progressColor}
        trackColor={trackColor}
        thumbDiameter={THUMB_DIAMETER}
        thumbColor={progressColor}
        thumbBorderColor="#ffffff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 30,
  },
});
