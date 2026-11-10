import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useTalkTheme } from '../../../hooks/useTalkTheme';
import { useAuth } from '../../../context/AuthContext';
import { talkBrand } from '../../../theme/talkTheme';
import { useI18n } from '../../../i18n/useI18n';
import UserAvatar from '../../../components/ui/UserAvatar';
import { navigateRoot } from '../../../navigation/rootNavigation';
import {
  linksterLayout,
  linksterMatteCard,
  linksterSectionLabel,
} from '../theme/linksterPro';

const LOGOUT_RED = '#FF453A';
const ONLINE_GREEN = '#34C759';

type IonIcon = keyof typeof Ionicons.glyphMap;

type RowItem = {
  icon: IonIcon;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
  trailing?: string;
};

type Props = {
  navigation: NavigationProp<ParamListBase>;
  paddingBottom?: number;
};

function soon(label: string) {
  Alert.alert('Linkster', label);
}

function InstrumentsRow({
  icon,
  title,
  subtitle,
  onPress,
  danger,
  badge,
  trailing,
  isLast,
  dividerColor,
  titleColor,
  subColor,
  chevronColor,
}: RowItem & {
  isLast?: boolean;
  dividerColor: string;
  titleColor: string;
  subColor: string;
  chevronColor: string;
}) {
  const { accent } = useI18n();
  const iconColor = danger ? LOGOUT_RED : accent;
  return (
    <TouchableOpacity
      activeOpacity={0.72}
      onPress={onPress}
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: dividerColor },
      ]}
    >
      <View style={[styles.iconBox, danger && styles.iconBoxDanger]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <View style={styles.titleRow}>
          <Text style={[styles.rowTitle, { color: danger ? LOGOUT_RED : titleColor }]}>{title}</Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle && !danger ? (
          <Text style={[styles.rowSub, { color: subColor }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Text style={[styles.trailing, { color: subColor }]} numberOfLines={1}>
          {trailing}
        </Text>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={chevronColor} />
      )}
    </TouchableOpacity>
  );
}

function SettingsSection({
  title,
  rows,
  cardStyle,
  sectionStyle,
  colors,
}: {
  title: string;
  rows: RowItem[];
  cardStyle: object;
  sectionStyle: object;
  colors: { border: string; text: string; textSecondary: string; textMuted: string };
}) {
  return (
    <>
      <Text style={[styles.section, sectionStyle]}>{title}</Text>
      <View style={[styles.card, cardStyle]}>
        {rows.map((row, i) => (
          <InstrumentsRow
            key={`${title}-${row.title}`}
            {...row}
            isLast={i === rows.length - 1}
            dividerColor={colors.border}
            titleColor={colors.text}
            subColor={colors.textSecondary}
            chevronColor={colors.textMuted}
          />
        ))}
      </View>
    </>
  );
}

function PremiumBanner({ cardStyle, textColor, subColor }: { cardStyle: object; textColor: string; subColor: string }) {
  const { t, accent } = useI18n();
  const perks = [
    { icon: 'infinite-outline' as IonIcon, label: '∞' },
    { icon: 'cloud-outline' as IonIcon, label: '☁' },
    { icon: 'rocket-outline' as IonIcon, label: '🚀' },
    { icon: 'sparkles-outline' as IonIcon, label: '✦' },
  ];
  return (
    <View style={[styles.card, cardStyle, styles.premiumCard]}>
      <View style={styles.premiumTop}>
        <View style={styles.premiumIconBox}>
          <Ionicons name="diamond-outline" size={24} color={accent} />
        </View>
        <View style={styles.premiumText}>
          <Text style={[styles.premiumTitle, { color: textColor }]}>{t('deck.premiumTitle')}</Text>
          <Text style={[styles.premiumSub, { color: subColor }]}>{t('deck.premiumSub')}</Text>
        </View>
        <TouchableOpacity
          style={styles.premiumBtn}
          activeOpacity={0.8}
          onPress={() => soon(t('common.soon', { name: 'Premium' }))}
        >
          <Text style={[styles.premiumBtnText, { color: accent }]}>{t('deck.premiumCta')}</Text>
          <Ionicons name="chevron-forward" size={16} color={accent} />
        </TouchableOpacity>
      </View>
      <View style={styles.perkRow}>
        {perks.map((p) => (
          <View key={p.icon} style={styles.perk}>
            <Ionicons name={p.icon} size={14} color={accent} />
            <Text style={[styles.perkLabel, { color: subColor }]} numberOfLines={1}>
              {p.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function LinksterInstrumentsDeck({ navigation, paddingBottom = 28 }: Props) {
  const { isDark, colors: c, accentPreset } = useTalkTheme();
  const { t, language } = useI18n();
  const { user, logout } = useAuth();
  const iconAccent = talkBrand.accentBright;

  const openStack = (screen: string, params?: object) => navigateRoot(navigation, screen, params);

  const fullName =
    (typeof user?.full_name === 'string' && user.full_name) ||
    (typeof user?.username === 'string' && user.username) ||
    t('deck.profileFallback');
  const username = typeof user?.username === 'string' ? user.username : '';

  const openProfileSettings = () => {
    openStack('SettingsProfile');
  };

  const bio =
    (typeof user?.bio === 'string' && user.bio.trim()) || t('deck.bioFallback');

  const linksterId = useMemo(() => {
    if (username) return `@${username}`;
    const id = user?.id;
    if (id != null) return `#${String(id)}`;
    return '—';
  }, [user?.id, username]);

  const appVersion = require('../../../../app.json').expo.version as string;
  const cardStyle = linksterMatteCard(isDark);
  const sectionStyle = linksterSectionLabel(isDark);

  const inviteFriends = async () => {
    try {
      await Share.share({
        message: t('deck.inviteShare'),
      });
    } catch {
      soon(t('deck.rowInvite'));
    }
  };

  const confirmLogout = () => {
    Alert.alert(t('deck.logoutTitle'), t('deck.logoutMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  const accountRows: RowItem[] = useMemo(
    () => [
      {
        icon: 'person-outline',
        title: t('deck.rowAccount'),
        subtitle: t('deck.rowAccountSub'),
        onPress: openProfileSettings,
      },
      {
        icon: 'shield-checkmark-outline',
        title: t('deck.rowSecurity'),
        subtitle: t('deck.rowSecuritySub'),
        onPress: () => openStack('SettingsAccount'),
      },
      {
        icon: 'lock-closed-outline',
        title: t('deck.rowPrivacy'),
        subtitle: t('deck.rowPrivacySub'),
        onPress: () => openStack('SettingsPrivacy'),
      },
      {
        icon: 'laptop-outline',
        title: t('deck.rowDevices'),
        subtitle: t('deck.rowDevicesSub'),
        onPress: () => openStack('SettingsDevices'),
      },
    ],
    [t, openProfileSettings, openStack]
  );

  const appRows: RowItem[] = useMemo(
    () => [
      {
        icon: 'color-palette-outline',
        title: t('deck.rowAppearance'),
        subtitle: t('deck.rowAppearanceSub'),
        onPress: () => openStack('SettingsChat'),
      },
      {
        icon: 'notifications-outline',
        title: t('deck.rowNotifications'),
        subtitle: t('deck.rowNotificationsSub'),
        onPress: () => openStack('SettingsNotifications'),
      },
      {
        icon: 'server-outline',
        title: t('deck.rowData'),
        subtitle: t('deck.rowDataSub'),
        onPress: () => openStack('SettingsData'),
      },
      {
        icon: 'download-outline',
        title: t('deck.rowDownloads'),
        subtitle: t('deck.rowDownloadsSub'),
        onPress: () => openStack('SettingsData'),
      },
      {
        icon: 'chatbubbles-outline',
        title: t('deck.rowChatsSettings'),
        subtitle: t('deck.rowChatsSettingsSub'),
        onPress: () => openStack('SettingsChats'),
      },
      {
        icon: 'call-outline',
        title: t('deck.rowCallsSettings'),
        subtitle: t('deck.rowCallsSettingsSub'),
        onPress: () => openStack('SettingsCalls'),
      },
      {
        icon: 'happy-outline',
        title: t('deck.rowStickers'),
        subtitle: t('deck.rowStickersSub'),
        onPress: () => soon(t('common.soon', { name: t('deck.rowStickers') })),
      },
      {
        icon: 'language-outline',
        title: t('deck.rowLanguage'),
        subtitle: t('deck.rowLanguageSub'),
        onPress: () => openStack('SettingsChat'),
        trailing: language === 'en' ? t('deck.langEn') : t('deck.langRu'),
      },
    ],
    [t, language, openStack]
  );

  const featureRows: RowItem[] = useMemo(
    () => [
      {
        icon: 'gift-outline',
        title: t('deck.rowInvite'),
        subtitle: t('deck.rowInviteSub'),
        onPress: inviteFriends,
      },
      {
        icon: 'bookmark-outline',
        title: t('deck.rowSaved'),
        subtitle: t('deck.rowSavedSub'),
        onPress: () => soon(t('common.soon', { name: t('deck.rowSaved') })),
      },
      {
        icon: 'id-card-outline',
        title: t('deck.rowLinksterId'),
        subtitle: t('deck.rowLinksterIdSub'),
        badge: 'NEW',
        onPress: () => Alert.alert('Linkster ID', linksterId),
      },
      {
        icon: 'bag-handle-outline',
        title: t('deck.rowShop'),
        subtitle: t('deck.rowShopSub'),
        onPress: () => soon(t('common.soon', { name: t('deck.rowShop') })),
      },
    ],
    [t, inviteFriends, linksterId]
  );

  const supportRows: RowItem[] = useMemo(
    () => [
      {
        icon: 'help-circle-outline',
        title: t('deck.rowHelp'),
        subtitle: t('deck.rowHelpSub'),
        onPress: () => openStack('SettingsHelp'),
      },
      {
        icon: 'chatbox-ellipses-outline',
        title: t('deck.rowSupport'),
        subtitle: t('deck.rowSupportSub'),
        onPress: () => openStack('SettingsHelp'),
      },
    ],
    [t]
  );

  const otherRows: RowItem[] = useMemo(
    () => [
      {
        icon: 'information-circle-outline',
        title: t('deck.rowAbout'),
        subtitle: t('deck.rowAboutSub', { version: appVersion }),
        onPress: () => openStack('SettingsAbout'),
      },
      {
        icon: 'document-text-outline',
        title: t('deck.rowTerms'),
        subtitle: t('deck.rowTermsSub'),
        onPress: () => openStack('SettingsTerms'),
      },
    ],
    [t, appVersion]
  );

  const rowColors = {
    border: c.border,
    text: c.text,
    textSecondary: c.textSecondary,
    textMuted: c.textMuted,
  };

  return (
    <View style={[styles.root, { paddingBottom }]} key={`${language}-${accentPreset}`}>
      <View style={[styles.card, cardStyle]}>
        <TouchableOpacity style={styles.profileRow} activeOpacity={0.75} onPress={openProfileSettings}>
          <UserAvatar
            avatarPath={typeof user?.avatar === 'string' ? user.avatar : null}
            name={fullName}
            size={56}
            ring={{ color: iconAccent, width: 2, padding: 2 }}
          />
          <View style={styles.profileText}>
            <Text style={[styles.profileName, { color: c.text }]} numberOfLines={1}>
              {fullName}
            </Text>
            {username ? (
              <Text style={[styles.profileHandle, { color: c.textSecondary }]}>@{username}</Text>
            ) : null}
            <Text style={[styles.profileBio, { color: c.textSecondary }]} numberOfLines={1}>
              {bio}
            </Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: ONLINE_GREEN }]} />
              <Text style={[styles.onlineLabel, { color: c.textSecondary }]}>{t('common.online')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
        </TouchableOpacity>
      </View>

      <PremiumBanner cardStyle={[cardStyle, styles.cardGap]} textColor={c.text} subColor={c.textSecondary} />

      <SettingsSection
        title={t('deck.sectionAccount')}
        rows={accountRows}
        cardStyle={cardStyle}
        sectionStyle={sectionStyle}
        colors={rowColors}
      />
      <SettingsSection
        title={t('deck.sectionApp')}
        rows={appRows}
        cardStyle={cardStyle}
        sectionStyle={sectionStyle}
        colors={rowColors}
      />
      <SettingsSection
        title={t('deck.sectionFeatures')}
        rows={featureRows}
        cardStyle={cardStyle}
        sectionStyle={sectionStyle}
        colors={rowColors}
      />
      <SettingsSection
        title={t('deck.sectionSupport')}
        rows={supportRows}
        cardStyle={cardStyle}
        sectionStyle={sectionStyle}
        colors={rowColors}
      />
      <SettingsSection
        title={t('deck.sectionOther')}
        rows={otherRows}
        cardStyle={cardStyle}
        sectionStyle={sectionStyle}
        colors={rowColors}
      />

      <View style={[styles.card, cardStyle, styles.cardGapTop]}>
        <InstrumentsRow
          icon="log-out-outline"
          title={t('deck.logoutRow')}
          subtitle=""
          onPress={confirmLogout}
          danger
          isLast
          dividerColor={c.border}
          titleColor={c.text}
          subColor={c.textSecondary}
          chevronColor={c.textMuted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 8,
    paddingHorizontal: linksterLayout.screenH,
  },
  card: { overflow: 'hidden' },
  cardGap: { marginTop: 10 },
  cardGapTop: { marginTop: 20 },
  section: {
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
  },
  profileText: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  profileHandle: { fontSize: 14, marginTop: 2, fontWeight: '500' },
  profileBio: { fontSize: 13, marginTop: 4 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineLabel: { fontSize: 12, fontWeight: '500' },
  premiumCard: { padding: 14 },
  premiumTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 191, 168, 0.12)',
  },
  premiumText: { flex: 1 },
  premiumTitle: { fontSize: 16, fontWeight: '700' },
  premiumSub: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 168, 0.45)',
  },
  premiumBtnText: { fontSize: 13, fontWeight: '700' },
  perkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '48%',
  },
  perkLabel: { fontSize: 11, flexShrink: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 14,
    minHeight: 64,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 191, 168, 0.12)',
  },
  iconBoxDanger: { backgroundColor: 'rgba(255, 69, 58, 0.12)' },
  rowText: { flex: 1, paddingVertical: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rowTitle: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  badge: {
    backgroundColor: 'rgba(0, 191, 168, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  rowSub: { fontSize: 13, marginTop: 3, lineHeight: 18, fontWeight: '400' },
  trailing: { fontSize: 14, fontWeight: '500', maxWidth: 88 },
});
