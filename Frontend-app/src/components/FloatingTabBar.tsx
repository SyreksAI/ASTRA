import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { feed } from '@/src/theme/tokens';
import {
  ConstellationIcon,
  HomeIcon,
  MusicIcon,
  PlusIcon,
  ProfileIcon,
} from '@/src/components/MenuIcons';

const LABELS: Record<string, string> = {
  index: 'Главная',
  constellations: 'Созвездия',
  create: '',
  music: 'Музыка',
  profile: 'Профиль',
};

type TabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string; params?: object }[];
  };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (event: {
      type: string;
      target: string;
      canPreventDefault: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

function TabGlyph({ name, color }: { name: string; color: string }) {
  switch (name) {
    case 'index':
      return <HomeIcon size={20} color={color} />;
    case 'constellations':
      return <ConstellationIcon size={20} color={color} />;
    case 'music':
      return <MusicIcon size={20} color={color} />;
    case 'profile':
      return <ProfileIcon size={20} color={color} />;
    default:
      return null;
  }
}

export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const createRoute = state.routes.find((r) => r.name === 'create');
  const createIndex = state.routes.findIndex((r) => r.name === 'create');
  const createFocused = createIndex >= 0 && state.index === createIndex;

  const pressCreate = () => {
    if (!createRoute) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: createRoute.key,
      canPreventDefault: true,
    });
    if (!createFocused && !event.defaultPrevented) {
      navigation.navigate(createRoute.name, createRoute.params);
    }
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={styles.barShell} pointerEvents="box-none">
        <View style={styles.pill}>
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.row}>
            {state.routes.map((route, index) => {
              if (route.name === 'create') {
                return <View key={route.key} style={styles.createSlot} />;
              }

              const focused = state.index === index;
              const { options } = descriptors[route.key];
              const label = LABELS[route.name] ?? options.title ?? route.name;
              const color = focused ? feed.teal : '#8B98A5';

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  style={styles.item}
                  accessibilityRole="button"
                  accessibilityState={focused ? { selected: true } : {}}
                >
                  <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                    <TabGlyph name={route.name} color={color} />
                  </View>
                  {label ? (
                    <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                      {label}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {createRoute ? (
          <Pressable
            onPress={pressCreate}
            style={styles.createHit}
            accessibilityRole="button"
            accessibilityLabel="Создать"
          >
            <View style={styles.createGlow}>
              <View style={styles.createBtn}>
                <PlusIcon size={20} color="#fff" />
              </View>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  barShell: {
    width: '100%',
    maxWidth: 420,
    position: 'relative',
  },
  pill: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#0B1220',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 64,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  createSlot: {
    width: 72,
  },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(22,184,166,0.16)',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B98A5',
  },
  labelActive: {
    color: feed.teal,
  },
  createHit: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 20,
  },
  createGlow: {
    padding: 4,
    borderRadius: 32,
    backgroundColor: 'rgba(22,184,166,0.22)',
    shadowColor: feed.teal,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 16,
  },
  createBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
