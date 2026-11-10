import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTalkTheme } from '../../hooks/useTalkTheme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
};

export default function SettingsRow({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  onPress,
  isLast,
}: Props) {
  const { colors: c } = useTalkTheme();
  const inner = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: c.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={[styles.value, { color: c.textSecondary }]}>{value}</Text>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
      ) : null}
    </>
  );

  const rowStyle = [
    styles.row,
    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={rowStyle} onPress={onPress} activeOpacity={0.65}>
        {inner}
      </TouchableOpacity>
    );
  }

  return <View style={rowStyle}>{inner}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 14,
    minHeight: 56,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, paddingVertical: 2 },
  title: { fontSize: 16, fontWeight: '500' },
  subtitle: { fontSize: 13, marginTop: 2, lineHeight: 17 },
  value: { fontSize: 15, marginRight: 2 },
});
