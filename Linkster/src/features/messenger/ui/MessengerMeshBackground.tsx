import React from 'react';
import { StyleSheet, View } from 'react-native';
import { linksterCanvas } from '../../../theme/talkTheme';

type Props = {
  isDark: boolean;
  variant?: 'hub' | 'thread';
};

/** Матовый однотонный фон экранов мессенджера */
export default function MessengerMeshBackground({ isDark }: Props) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: isDark ? linksterCanvas.dark : linksterCanvas.light },
      ]}
      pointerEvents="none"
    />
  );
}
