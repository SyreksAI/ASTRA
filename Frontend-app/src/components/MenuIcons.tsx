import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

function Base({
  size = 22,
  color = '#8B98A5',
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

export function HomeIcon({ size, color = '#8B98A5' }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Base>
  );
}

export function ConstellationIcon({ size, color = '#8B98A5' }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Circle cx="12" cy="12" r="4.2" stroke={color} strokeWidth={1.7} />
      <Ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="3.4"
        stroke={color}
        strokeWidth={1.5}
        transform="rotate(-22 12 12)"
      />
    </Base>
  );
}

export function MusicIcon({ size, color = '#8B98A5' }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path
        d="M10 17.5V7.2l9-2.2v10.3"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7.5" cy="17.5" r="2.5" stroke={color} strokeWidth={1.7} />
      <Circle cx="16.5" cy="15.3" r="2.5" stroke={color} strokeWidth={1.7} />
    </Base>
  );
}

export function ProfileIcon({ size, color = '#8B98A5' }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Circle cx="12" cy="9" r="3.4" stroke={color} strokeWidth={1.7} />
      <Path
        d="M5.5 19.2c1.3-2.5 3.5-3.8 6.5-3.8s5.2 1.3 6.5 3.8"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Base>
  );
}

export function PlusIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export const TAB_ICONS = {
  index: HomeIcon,
  constellations: ConstellationIcon,
  music: MusicIcon,
  profile: ProfileIcon,
} as const;
