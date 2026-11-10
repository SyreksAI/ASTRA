import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getTalkHeaderColors } from '../../theme/talkTheme';

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export default function ScreenHeader({ title, onBack, right }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useAuth();
  const isDark = theme === 'dark';
  const h = getTalkHeaderColors(isDark);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 6,
          backgroundColor: h.background,
          borderBottomColor: h.border,
        },
      ]}
    >
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={h.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <Text style={[styles.title, { color: h.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        {right ?? <View style={styles.iconBtn} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minHeight: 44,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
});
