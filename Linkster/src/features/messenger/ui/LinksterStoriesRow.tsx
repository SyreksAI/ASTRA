import React, { useCallback, useRef } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import type { StoryOriginRect } from './storyOrigin';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { mediaUrl } from '../../../config/api';
import { talkBrand } from '../../../theme/talkTheme';
import { linksterDarkHub } from '../theme/linksterDarkHub';
import type { Conversation } from '../../chat/types';
import { conversationHasStoryRing } from '../demo/linksterDemoStories';

type Props = {
  isDark: boolean;
  conversations: Conversation[];
  /** id пользователей/чатов, чьи статусы уже просмотрены */
  viewedStoryUserIds?: ReadonlySet<string>;
  onPressStory?: () => void;
  /** Контакт без истории — обычно открытие чата */
  onPressContact: (item: Conversation) => void;
  /** Кольцо с историей — полноэкранный просмотр */
  onPressUserStory: (item: Conversation, indexInRow: number, origin: StoryOriginRect) => void;
  /** Координаты аватаров в ряду (для анимации закрытия) */
  onRegisterStoryOrigin?: (conversationId: string, origin: StoryOriginRect) => void;
};

function StoryRing({
  children,
  variant,
  isDark,
}: {
  children: React.ReactNode;
  variant: 'add' | 'story' | 'idle';
  isDark: boolean;
}) {
  const innerBg = isDark ? linksterDarkHub.bg : '#FFFFFF';
  const accent = talkBrand.accentBright;

  if (variant === 'add') {
    return (
      <View
        style={[
          styles.ringOuter,
          styles.ringAdd,
          {
            borderColor: accent,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 168, 150, 0.08)',
          },
          Platform.OS === 'ios' ? styles.ringAddDashed : null,
        ]}
      >
        <View style={[styles.storyAddInner, { backgroundColor: innerBg }]}>{children}</View>
      </View>
    );
  }

  if (variant === 'story') {
    return (
      <LinearGradient
        colors={
          isDark
            ? ['#6B9080', '#6B7FA8', '#8B7FA3', '#6B9080']
            : ['#7AB8B0', '#7A9BC4', '#A898C4', '#7AB8B0']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientRing}
      >
        <View style={[styles.gradientInner, { backgroundColor: innerBg }]}>{children}</View>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.ringOuter,
        styles.ringIdle,
        { borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0, 0, 0, 0.08)' },
      ]}
    >
      {children}
    </View>
  );
}

export default function LinksterStoriesRow({
  isDark,
  conversations,
  viewedStoryUserIds,
  onPressStory,
  onPressContact,
  onPressUserStory,
  onRegisterStoryOrigin,
}: Props) {
  const ringMeasureRefs = useRef<Record<string, View | null>>({});
  const contacts = conversations.slice(0, 6);

  const publishOrigin = useCallback(
    (conversationId: string, node: View | null) => {
      if (!node || !onRegisterStoryOrigin) return;
      node.measureInWindow((x, y, width, height) => {
        if (width <= 0 || height <= 0) return;
        onRegisterStoryOrigin(conversationId, { x, y, width, height });
      });
    },
    [onRegisterStoryOrigin]
  );
  const labelMuted = isDark ? linksterDarkHub.textMuted : '#6B7280';
  const labelName = isDark ? linksterDarkHub.textPrimary : '#111827';
  const innerBg = isDark ? linksterDarkHub.bg : '#FFFFFF';
  const accent = talkBrand.accentBright;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      style={styles.root}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={onPressStory} style={styles.item}>
        <StoryRing variant="add" isDark={isDark}>
          <Ionicons name="add" size={24} color={accent} />
        </StoryRing>
        <Text style={[styles.label, { color: labelMuted }]} numberOfLines={1}>
          Ваша история
        </Text>
      </TouchableOpacity>

      {contacts.map((c, i) => {
        const title = c.display_name || c.user?.full_name || c.user?.username || 'Чат';
        const avatarPath = c.display_avatar || c.user?.avatar;
        const uri = avatarPath ? mediaUrl(avatarPath) : null;
        const initial = title[0]?.toUpperCase() || '?';
        const hasStory = conversationHasStoryRing(i);
        const storyUnseen = hasStory && !viewedStoryUserIds?.has(String(c.id));
        const ringVariant = storyUnseen ? 'story' : hasStory ? 'idle' : 'idle';
        const convId = String(c.id);
        return (
          <TouchableOpacity
            key={convId}
            activeOpacity={0.85}
            onPress={() => {
              const node = ringMeasureRefs.current[convId];
              if (!node) {
                if (hasStory) {
                  onPressUserStory(c, i, { x: 28, y: 128, width: AVATAR + 4, height: AVATAR + 4 });
                } else {
                  onPressContact(c);
                }
                return;
              }
              node.measureInWindow((x, y, width, height) => {
                const origin = {
                  x,
                  y,
                  width: width > 0 ? width : AVATAR + 4,
                  height: height > 0 ? height : AVATAR + 4,
                };
                onRegisterStoryOrigin?.(convId, origin);
                if (hasStory) onPressUserStory(c, i, origin);
                else onPressContact(c);
              });
            }}
            style={styles.item}
          >
            <View
              ref={(el) => {
                ringMeasureRefs.current[convId] = el;
              }}
              collapsable={false}
              onLayout={() => publishOrigin(convId, ringMeasureRefs.current[convId])}
            >
              <StoryRing variant={hasStory ? ringVariant : 'idle'} isDark={isDark}>
                {uri ? (
                  <Image source={{ uri }} style={[styles.avatar, { backgroundColor: innerBg }]} />
                ) : (
                  <View
                    style={[
                      styles.avatarFallback,
                      { backgroundColor: isDark ? '#1A1A1A' : talkBrand.accentSoft },
                    ]}
                  >
                    <Text style={[styles.initial, { color: talkBrand.accentBright }]}>
                      {initial}
                    </Text>
                  </View>
                )}
              </StoryRing>
            </View>
            <Text style={[styles.label, { color: labelName }]} numberOfLines={1}>
              {title.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const AVATAR = 58;

const styles = StyleSheet.create({
  root: { marginBottom: 14 },
  scroll: { paddingLeft: 10, paddingRight: 20, gap: 16, alignItems: 'flex-start' },
  item: { width: AVATAR + 10, alignItems: 'center', position: 'relative' },
  ringOuter: {
    width: AVATAR + 4,
    height: AVATAR + 4,
    borderRadius: (AVATAR + 4) / 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringAdd: { borderWidth: 2 },
  ringAddDashed: { borderStyle: 'dashed' },
  ringIdle: { borderWidth: 2 },
  storyAddInner: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientRing: {
    width: AVATAR + 4,
    height: AVATAR + 4,
    borderRadius: (AVATAR + 4) / 2,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientInner: {
    width: AVATAR - 1,
    height: AVATAR - 1,
    borderRadius: (AVATAR - 1) / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: '100%', height: '100%', borderRadius: AVATAR / 2 },
  avatarFallback: {
    width: AVATAR - 1,
    height: AVATAR - 1,
    borderRadius: (AVATAR - 1) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 22, fontWeight: '700' },
  label: { marginTop: 8, fontSize: 12, fontWeight: '500', maxWidth: AVATAR + 14, textAlign: 'center' },
});
