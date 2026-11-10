import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { useTalkTheme } from '../../hooks/useTalkTheme';
import { talkBrand } from '../../theme/talkTheme';
import { linksterLayout, linksterMatteCard } from '../../features/messenger/theme/linksterPro';

export function SettingsSectionTitle({ children, color }: { children: string; color: string }) {
  return <Text style={[layoutStyles.sectionTitle, { color }]}>{children}</Text>;
}

export function SettingsHint({ children, color }: { children: string; color: string }) {
  return <Text style={[layoutStyles.blockHint, { color }]}>{children}</Text>;
}

type PageProps = {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
};

export function SettingsPage({ title, onBack, children }: PageProps) {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTalkTheme();
  return (
    <View style={[layoutStyles.page, { backgroundColor: c.bg }]}>
      <ScreenHeader title={title} onBack={onBack} />
      <ScrollView
        contentContainerStyle={[layoutStyles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function SettingsCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { isDark } = useTalkTheme();
  const cardStyle = linksterMatteCard(isDark);
  return <View style={[layoutStyles.card, cardStyle, style]}>{children}</View>;
}

type SwitchRowProps = {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isLast?: boolean;
};

export function SettingsSwitchRow({ label, hint, value, onValueChange, isLast }: SwitchRowProps) {
  const { colors: c } = useTalkTheme();
  return (
    <View
      style={[
        layoutStyles.switchRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
      ]}
    >
      <View style={layoutStyles.switchText}>
        <Text style={[layoutStyles.label, { color: c.text }]}>{label}</Text>
        {hint ? (
          <Text style={[layoutStyles.hint, { color: c.textSecondary }]}>{hint}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: c.textMuted, true: talkBrand.accentPressed }}
        thumbColor="#fff"
      />
    </View>
  );
}

type NavRowProps = {
  label: string;
  hint?: string;
  onPress: () => void;
  isLast?: boolean;
};

export function SettingsNavRow({ label, hint, onPress, isLast }: NavRowProps) {
  const { colors: c } = useTalkTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.72}
      onPress={onPress}
      style={[
        layoutStyles.navRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
      ]}
    >
      <View style={layoutStyles.flex}>
        <Text style={[layoutStyles.label, { color: c.text }]}>{label}</Text>
        {hint ? (
          <Text style={[layoutStyles.hint, { color: c.textSecondary }]}>{hint}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
    </TouchableOpacity>
  );
}

type SegmentOption<T extends string> = { id: T; label: string };

type SegmentRowProps<T extends string> = {
  label: string;
  hint?: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (id: T) => void;
};

export function SettingsSegmentRow<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: SegmentRowProps<T>) {
  const { colors: c } = useTalkTheme();
  return (
    <View style={layoutStyles.segmentBlock}>
      <Text style={[layoutStyles.label, { color: c.text, marginBottom: hint ? 4 : 10 }]}>{label}</Text>
      {hint ? (
        <Text style={[layoutStyles.hint, { color: c.textSecondary, marginBottom: 10 }]}>{hint}</Text>
      ) : null}
      <View style={layoutStyles.segmentRow}>
        {options.map((opt) => {
          const active = opt.id === value;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                layoutStyles.segmentChip,
                {
                  backgroundColor: active ? talkBrand.accentSoft : c.surface2,
                  borderColor: active ? talkBrand.accentBright : c.border,
                },
              ]}
              onPress={() => onChange(opt.id)}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: active ? talkBrand.accentBright : c.textSecondary,
                  fontWeight: active ? '700' : '500',
                  fontSize: 13,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function useSettingsChrome() {
  const { isDark, colors: c } = useTalkTheme();
  return {
    isDark,
    c,
    sectionAccent: talkBrand.accentBright,
    cardStyle: linksterMatteCard(isDark),
  };
}

const layoutStyles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    paddingHorizontal: linksterLayout.screenH,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 12,
  },
  blockHint: {
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 12,
    lineHeight: 18,
  },
  card: { overflow: 'hidden', marginBottom: 4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  switchText: { flex: 1 },
  label: { fontSize: 16, fontWeight: '500' },
  hint: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  flex: { flex: 1 },
  segmentBlock: { padding: 14 },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segmentChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
