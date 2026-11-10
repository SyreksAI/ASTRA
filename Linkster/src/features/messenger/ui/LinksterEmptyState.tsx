import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTalkColors, talkBrand } from '../../../theme/talkTheme';
import { linksterDarkHub } from '../theme/linksterDarkHub';

type Props = {
  isDark: boolean;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function LinksterEmptyState({
  isDark,
  title,
  subtitle,
  actionLabel,
  onAction,
}: Props) {
  const c = getTalkColors(isDark);

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: talkBrand.accentFill }]}>
        <Ionicons
          name="chatbubbles-outline"
          size={36}
          color={talkBrand.accentBright}
        />
      </View>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      <Text style={[styles.sub, { color: c.textSecondary }]}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onAction}
          style={[styles.cta, isDark ? styles.ctaDark : styles.ctaLight]}
        >
          <Text style={[styles.ctaText, isDark && styles.ctaTextDark]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 40, paddingTop: 56, alignItems: 'center' },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  sub: { marginTop: 10, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  cta: {
    marginTop: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  ctaLight: { backgroundColor: talkBrand.accent },
  ctaDark: { backgroundColor: linksterDarkHub.buttonBg },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  ctaTextDark: { color: linksterDarkHub.buttonIcon },
});
