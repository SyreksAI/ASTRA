import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { feed } from '@/src/theme/tokens';
import { resolveMediaUrl } from '@/src/api/client';

type Props = {
  avatarUrl?: string | null;
  onSearchPress?: () => void;
};

export function HomeTopBar({ avatarUrl, onSearchPress }: Props) {
  const uri = resolveMediaUrl(avatarUrl);

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <Image
          source={require('../../../assets/images/elara-mark.png')}
          style={styles.mark}
        />
        <Text style={styles.brandText}>Elara</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.iconBtn} onPress={onSearchPress} hitSlop={8}>
          <FontAwesome name="search" size={16} color={feed.text} />
        </Pressable>
        <Pressable style={styles.iconBtn} hitSlop={8}>
          <FontAwesome name="bell-o" size={16} color={feed.text} />
          <View style={styles.dot} />
        </Pressable>
        {uri ? (
          <Image source={{ uri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <FontAwesome name="user" size={12} color="#fff" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mark: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  brandText: {
    color: '#0B1220',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2.4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: feed.teal,
    borderWidth: 1.5,
    borderColor: '#F5F7FA',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
