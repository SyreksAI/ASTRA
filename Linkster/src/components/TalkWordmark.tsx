import React from 'react';
import { Image, StyleSheet, type StyleProp, type ImageStyle } from 'react-native';
import {
  talkLogoHeightForWidth,
  TALK_WORDMARK_HEADER_WIDTH,
  TALK_WORDMARK_HUB_WIDTH,
} from '../theme/talkLogoConstants';
import { AUTH_LOGO_WIDTH } from '../theme/authLogoStyle';

type Props = {
  style?: StyleProp<ImageStyle>;
  /** Светлый фон — logo-light; тёмный — logo-dark */
  onLightBackground?: boolean;
  size?: 'header' | 'hub' | 'large';
};

/** PNG wordmark Linkster (светлая / тёмная тема) */
export default function TalkWordmark({ style, onLightBackground = false, size = 'header' }: Props) {
  const source = onLightBackground
    ? require('../../assets/logo-light.png')
    : require('../../assets/logo-dark.png');

  if (size === 'large') {
    return (
      <Image
        source={source}
        style={[styles.imageLarge, { backgroundColor: 'transparent' }, style]}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Linkster"
      />
    );
  }

  const boxWidth = size === 'hub' ? TALK_WORDMARK_HUB_WIDTH : TALK_WORDMARK_HEADER_WIDTH;
  const boxHeight = talkLogoHeightForWidth(boxWidth);

  return (
    <Image
      source={source}
      style={[
        styles.wordmarkBox,
        { width: boxWidth, height: boxHeight, backgroundColor: 'transparent' },
        size === 'hub' ? styles.hub : styles.header,
        style,
      ]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Linkster"
    />
  );
}

const styles = StyleSheet.create({
  wordmarkBox: {
    flexShrink: 0,
  },
  header: {
    marginLeft: -2,
  },
  hub: {
    marginLeft: -10,
  },
  imageLarge: {
    width: '100%',
    maxWidth: AUTH_LOGO_WIDTH,
    height: talkLogoHeightForWidth(AUTH_LOGO_WIDTH),
    alignSelf: 'center',
  },
});
