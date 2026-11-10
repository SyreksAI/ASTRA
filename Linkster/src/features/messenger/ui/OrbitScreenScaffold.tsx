import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import MessengerMeshBackground from './MessengerMeshBackground';

type Props = {
  isDark: boolean;
  variant?: 'hub' | 'thread' | 'page';
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function OrbitScreenScaffold({
  isDark,
  variant = 'page',
  children,
  style,
}: Props) {
  return (
    <View style={[styles.root, style]}>
      <MessengerMeshBackground isDark={isDark} variant={variant === 'thread' ? 'thread' : 'hub'} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
});
