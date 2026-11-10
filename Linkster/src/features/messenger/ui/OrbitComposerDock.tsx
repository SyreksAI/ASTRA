import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTalkColors } from '../../../theme/talkTheme';

type Props = {
  isDark: boolean;
  children: React.ReactNode;
};

export default function OrbitComposerDock({ isDark, children }: Props) {
  const insets = useSafeAreaInsets();
  const c = getTalkColors(isDark);

  return (
    <View
      style={[
        styles.dock,
        {
          backgroundColor: c.bg,
          borderTopColor: c.border,
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
});
