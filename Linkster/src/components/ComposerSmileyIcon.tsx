import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type Props = {
  size?: number;
  color: string;
};

/** Простой смайлик — только контур (круг, глаза, улыбка). */
export default function ComposerSmileyIcon({ size = 24, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.25" stroke={color} strokeWidth="1.55" />
      <Circle cx="9.25" cy="10.25" r="1.05" fill={color} />
      <Circle cx="14.75" cy="10.25" r="1.05" fill={color} />
      <Path
        d="M8.4 14.1c1.5 1.85 5.7 1.85 7.2 0"
        stroke={color}
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </Svg>
  );
}
