import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTalkTheme } from '../../../hooks/useTalkTheme';
import { useI18n } from '../../../i18n/useI18n';
import { getTalkColors, talkBrand } from '../../../theme/talkTheme';
import type { MessengerTabParamList } from '../navigation/MessengerTabs';
import OrbitScreenScaffold from '../ui/OrbitScreenScaffold';
import OrbitPageHeader from '../ui/OrbitPageHeader';
import { linksterMatteCard } from '../theme/linksterPro';

export default function MessengerLinksScreen() {
  const { isDark } = useTalkTheme();
  const { t } = useI18n();
  const c = getTalkColors(isDark);
  const navigation = useNavigation<BottomTabNavigationProp<MessengerTabParamList>>();

  const openNewLink = () => {
    navigation.navigate('Orbit', { screen: 'NewLink' });
  };

  const cards = [
    {
      id: 'new',
      icon: 'person-add-outline' as const,
      title: t('links.findPerson'),
      sub: t('links.findPersonSub'),
      onPress: openNewLink,
    },
    {
      id: 'group',
      icon: 'people-outline' as const,
      title: t('links.createGroup'),
      sub: t('links.createGroupSub'),
      onPress: openNewLink,
    },
    {
      id: 'chats',
      icon: 'chatbubbles-outline' as const,
      title: t('links.toChats'),
      sub: t('links.toChatsSub'),
      onPress: () => navigation.navigate('Orbit'),
    },
  ];

  return (
    <OrbitScreenScaffold isDark={isDark}>
      <OrbitPageHeader
        isDark={isDark}
        kicker={t('links.kicker')}
        title={t('links.title')}
        subtitle={t('links.subtitle')}
      />

      <View style={styles.cards}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.card, linksterMatteCard(isDark)]}
            activeOpacity={0.72}
            onPress={card.onPress}
          >
            <View style={styles.iconRing}>
              <Ionicons name={card.icon} size={24} color={talkBrand.accentBright} />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{card.title}</Text>
              <Text style={[styles.cardSub, { color: c.textSecondary }]}>{card.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </OrbitScreenScaffold>
  );
}

const styles = StyleSheet.create({
  cards: { paddingHorizontal: 16, gap: 8, paddingTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  iconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: talkBrand.accentFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSub: { marginTop: 3, fontSize: 13, lineHeight: 18 },
});
