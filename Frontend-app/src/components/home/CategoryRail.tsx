import React from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { feed } from '@/src/theme/tokens';

export type Category = {
  id: string;
  label: string;
  image: string;
};

export const HOME_CATEGORIES: Category[] = [
  {
    id: 'for-you',
    label: 'Для тебя',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfcba31?w=400&q=80',
  },
  {
    id: 'dev',
    label: 'Разработка',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
  },
  {
    id: 'design',
    label: 'Дизайн',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80',
  },
  {
    id: 'games',
    label: 'Игры',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80',
  },
  {
    id: 'art',
    label: 'Искусство',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80',
  },
  {
    id: 'music',
    label: 'Музыка',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80',
  },
];

type Props = {
  activeId: string;
  onSelect: (id: string) => void;
};

export function CategoryRail({ activeId, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {HOME_CATEGORIES.map((cat) => {
          const active = cat.id === activeId;
          return (
            <Pressable key={cat.id} onPress={() => onSelect(cat.id)} style={styles.item}>
              <View style={[styles.thumbShell, active && styles.thumbShellActive]}>
                <ImageBackground
                  source={{ uri: cat.image }}
                  style={styles.thumb}
                  imageStyle={styles.thumbImage}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(5,7,12,0.8)']}
                    style={StyleSheet.absoluteFill}
                  />
                  {active ? (
                    <View style={styles.star}>
                      <FontAwesome name="star" size={9} color={feed.teal} />
                    </View>
                  ) : null}
                  <Text style={styles.label} numberOfLines={1}>
                    {cat.label}
                  </Text>
                </ImageBackground>
              </View>
              {active ? <View style={styles.underline} /> : <View style={styles.underlineGhost} />}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.more}>
        <FontAwesome name="chevron-right" size={12} color="#6B7285" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    marginTop: 6,
    marginBottom: 14,
  },
  row: {
    paddingHorizontal: 14,
    gap: 10,
    paddingRight: 40,
  },
  item: {
    width: 78,
    alignItems: 'center',
  },
  thumbShell: {
    borderRadius: 18,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbShellActive: {
    borderColor: feed.teal,
    shadowColor: feed.teal,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  thumb: {
    width: 72,
    height: 88,
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 8,
  },
  thumbImage: {
    borderRadius: 15,
  },
  star: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  underline: {
    marginTop: 7,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: feed.teal,
  },
  underlineGhost: {
    marginTop: 7,
    height: 3,
  },
  more: {
    position: 'absolute',
    right: 10,
    top: 28,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B1220',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
