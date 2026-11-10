import React from 'react';
import { type StyleProp, type ImageStyle } from 'react-native';
import { useAuth } from '../context/AuthContext';
import TalkWordmark from './TalkWordmark';

export { TALK_LOGO_ASPECT, talkLogoHeightForWidth } from '../theme/talkLogoConstants';

type Props = {
  style?: StyleProp<ImageStyle>;
  /** Белая шапка / светлый экран — тёмный логотип */
  onLightBackground?: boolean;
};

export default function TalkLogo({ style, onLightBackground }: Props) {
  const { theme } = useAuth();
  const isDark = theme === 'dark';
  const onLight = onLightBackground ?? !isDark;
  return <TalkWordmark style={style} onLightBackground={onLight} size="large" />;
}
