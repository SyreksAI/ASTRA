import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { feed } from '@/src/theme/tokens';

export const FEED_TABS = [
  { id: 'for-you', label: 'Для тебя', icon: 'star' as const },
  { id: 'following', label: 'Подписки', icon: 'users' as const },
  { id: 'popular', label: 'Популярное', icon: 'line-chart' as const },
  { id: 'new', label: 'Новое', icon: 'clock-o' as const },
] as const;

export type FeedTabId = (typeof FEED_TABS)[number]['id'];

type Props = {
  active: FeedTabId;
  onChange: (id: FeedTabId) => void;
};

export function FeedTabRow({ active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FEED_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <FontAwesome
              name={tab.icon}
              size={12}
              color={isActive ? '#fff' : '#4B5565'}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#EEF1F5',
  },
  chipActive: {
    backgroundColor: '#0B1220',
  },
  label: {
    color: '#4B5565',
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: '#fff',
  },
});
