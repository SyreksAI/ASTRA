import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { talkBrand } from '../theme/talkTheme';
import {
  ALL_EMOJIS,
  EMOJI_CATEGORIES,
  type EmojiCategoryId,
} from './chatEmojiData';
import { COMPOSER_BAR_PADDING_H } from './composerBarLayout';

const COLS = 8;
const MAX_RECENT = 40;
/** Категории и нижняя панель — пока не проскроллили вниз (поиск уезжает вместе с контентом) */
const CHROME_SHOW_Y = 56;

type BottomTab = 'emoji' | 'gif' | 'stickers';

type Props = {
  isDark: boolean;
  height: number;
  paddingBottom: number;
  onEmoji: (emoji: string) => void;
  onBackspace: () => void;
};

function getTheme(isDark: boolean) {
  if (isDark) {
    return {
      bg: '#1C1C1E',
      searchBg: '#2C2C2E',
      searchText: '#FFFFFF',
      searchPlaceholder: '#8E8E93',
      icon: '#AEAEB2',
      iconActive: talkBrand.accentBright,
      border: 'rgba(255,255,255,0.08)',
      pillBg: '#2C2C2E',
      pillActive: '#3A3A3C',
      pillText: '#8E8E93',
      pillTextActive: '#FFFFFF',
      backspaceBg: '#2C2C2E',
      backspaceIcon: '#FFFFFF',
      stubText: '#8E8E93',
    };
  }
  return {
    bg: '#F2F2F7',
    searchBg: '#E9E9EB',
    searchText: '#000000',
    searchPlaceholder: '#8E8E93',
    icon: '#8E8E93',
    iconActive: talkBrand.accent,
    border: 'rgba(0,0,0,0.08)',
    pillBg: '#E3E3E8',
    pillActive: '#FFFFFF',
    pillText: '#8E8E93',
    pillTextActive: '#000000',
    backspaceBg: '#E3E3E8',
    backspaceIcon: '#3C3C43',
    stubText: '#8E8E93',
  };
}

const CONTENT_CATEGORIES = EMOJI_CATEGORIES.filter((c) => c.id !== 'recent');

export default function ChatEmojiKeyboard({
  isDark,
  height,
  paddingBottom,
  onEmoji,
  onBackspace,
}: Props) {
  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const { width } = useWindowDimensions();
  const cell = Math.floor((width - COMPOSER_BAR_PADDING_H * 2) / COLS);
  const scrollRef = useRef<ScrollView>(null);
  const sectionYRef = useRef<Partial<Record<EmojiCategoryId, number>>>({});
  const programmaticScrollRef = useRef(false);
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [categoryId, setCategoryId] = useState<EmojiCategoryId>('smileys');
  const [bottomTab, setBottomTab] = useState<BottomTab>('emoji');
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [scrollY, setScrollY] = useState(0);

  const pickEmoji = useCallback(
    (emoji: string) => {
      onEmoji(emoji);
      setRecent((prev) => {
        const next = [emoji, ...prev.filter((e) => e !== emoji)];
        return next.slice(0, MAX_RECENT);
      });
    },
    [onEmoji]
  );

  const registerSectionY = useCallback((id: EmojiCategoryId, e: LayoutChangeEvent) => {
    sectionYRef.current[id] = e.nativeEvent.layout.y;
  }, []);

  const resolveActiveCategory = useCallback(
    (y: number): EmojiCategoryId => {
      const entries = Object.entries(sectionYRef.current) as [EmojiCategoryId, number][];
      if (!entries.length) return 'smileys';
      entries.sort((a, b) => a[1] - b[1]);
      let active: EmojiCategoryId = entries[0][0];
      const lead = 24;
      for (const [id, sy] of entries) {
        if (y + lead >= sy) active = id;
      }
      return active;
    },
    []
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = Math.max(0, e.nativeEvent.contentOffset.y);
      setScrollY((prev) => (Math.abs(prev - y) < 0.5 ? prev : y));
      if (programmaticScrollRef.current || search.trim()) return;
      const next = resolveActiveCategory(y);
      setCategoryId((prev) => (prev === next ? prev : next));
    },
    [resolveActiveCategory, search]
  );

  const scrollToCategory = useCallback(
    (id: EmojiCategoryId) => {
      setSearch('');
      setCategoryId(id);
      if (id === 'recent' && recent.length === 0) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
      const target = sectionYRef.current[id];
      if (target == null) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
      programmaticScrollRef.current = true;
      if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current);
      scrollRef.current?.scrollTo({ y: target, animated: true });
      programmaticTimerRef.current = setTimeout(() => {
        programmaticScrollRef.current = false;
      }, 450);
    },
    [recent.length]
  );

  const searchResults = useMemo(() => {
    const q = search.trim();
    if (!q) return null;
    const hit = ALL_EMOJIS.filter((e) => e.includes(q));
    return hit.length ? hit : [];
  }, [search]);

  const recentEmojis = recent.length > 0 ? recent : null;

  const renderEmojiGrid = (emojis: string[], keyPrefix: string) => (
    <View style={styles.grid}>
      {emojis.map((emo, idx) => (
        <TouchableOpacity
          key={`${keyPrefix}-${emo}-${idx}`}
          style={[styles.cell, { width: cell, height: cell }]}
          onPress={() => pickEmoji(emo)}
          activeOpacity={0.55}
        >
          <Text style={styles.cellEmoji}>{emo}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const isEmojiTab = bottomTab === 'emoji';
  const showCategories = isEmojiTab && scrollY <= CHROME_SHOW_Y;
  const showBottom = !isEmojiTab || scrollY <= CHROME_SHOW_Y;

  return (
    <View style={[styles.root, { height, backgroundColor: theme.bg, paddingBottom }]}>
      {isEmojiTab ? (
        <View style={styles.emojiBody}>
          {showCategories ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.categories, { borderBottomColor: theme.border }]}
              contentContainerStyle={styles.categoriesContent}
            >
              {EMOJI_CATEGORIES.map((cat) => {
                const active = categoryId === cat.id && !search.trim();
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryBtn}
                    onPress={() => scrollToCategory(cat.id)}
                    hitSlop={6}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={22}
                      color={active ? theme.iconActive : theme.icon}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          <ScrollView
            ref={scrollRef}
            style={styles.gridScroll}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={[styles.searchRow, { backgroundColor: theme.searchBg }]}>
              <Ionicons name="search" size={18} color={theme.searchPlaceholder} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Поиск"
                placeholderTextColor={theme.searchPlaceholder}
                style={[styles.searchInput, { color: theme.searchText }]}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            {search.trim() ? (
              searchResults && searchResults.length > 0 ? (
                renderEmojiGrid(searchResults, 'search')
              ) : (
                <Text style={[styles.emptySearch, { color: theme.stubText }]}>Ничего не найдено</Text>
              )
            ) : (
              <>
                {recentEmojis ? (
                  <View onLayout={(e) => registerSectionY('recent', e)}>
                    {renderEmojiGrid(recentEmojis, 'recent')}
                  </View>
                ) : null}
                {CONTENT_CATEGORIES.map((cat) => (
                  <View key={cat.id} onLayout={(e) => registerSectionY(cat.id, e)}>
                    {renderEmojiGrid(cat.emojis, cat.id)}
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.stub}>
          <Text style={[styles.stubText, { color: theme.stubText }]}>
            {bottomTab === 'gif' ? 'GIF — скоро' : 'Стикеры — скоро'}
          </Text>
        </View>
      )}

      {showBottom ? (
        <View style={styles.bottomRow}>
          <View style={[styles.pill, { backgroundColor: theme.pillBg }]}>
            {(
              [
                ['emoji', 'Эмодзи'],
                ['gif', 'GIF'],
                ['stickers', 'Стикеры'],
              ] as const
            ).map(([id, label]) => {
              const active = bottomTab === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.pillTab, active && { backgroundColor: theme.pillActive }]}
                  onPress={() => setBottomTab(id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.pillTabText,
                      { color: active ? theme.pillTextActive : theme.pillText },
                      active && styles.pillTabTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.backspace, { backgroundColor: theme.backspaceBg }]}
            onPress={onBackspace}
            onLongPress={onBackspace}
            activeOpacity={0.75}
          >
            <Ionicons name="backspace-outline" size={22} color={theme.backspaceIcon} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  emojiBody: {
    flex: 1,
    minHeight: 0,
  },
  gridScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  emptySearch: {
    width: '100%',
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 15,
  },
  categories: {
    maxHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoriesContent: {
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  categoryBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: COMPOSER_BAR_PADDING_H,
    paddingBottom: 4,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellEmoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 6,
    gap: 10,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 22,
    padding: 3,
    minHeight: 36,
  },
  pillTab: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  pillTabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pillTabTextActive: {
    fontWeight: '600',
  },
  backspace: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stub: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  stubText: {
    fontSize: 15,
  },
});
