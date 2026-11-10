import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import UserAvatar from '../../components/ui/UserAvatar';
import { useTalkTheme } from '../../hooks/useTalkTheme';
import { talkBrand } from '../../theme/talkTheme';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/useI18n';
import type { AppLanguage } from '../../i18n/appLanguage';
import OrbitScreenScaffold from '../../features/messenger/ui/OrbitScreenScaffold';
import { linksterLayout, linksterMatteCard } from '../../features/messenger/theme/linksterPro';
import { linksterDarkHub } from '../../features/messenger/theme/linksterDarkHub';

const BIO_MAX = 500;

type IonIcon = keyof typeof Ionicons.glyphMap;

function splitFullName(full: string): { first: string; last: string } {
  const trimmed = full.trim();
  if (!trimmed) return { first: '', last: '' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function joinFullName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(' ');
}

function formatJoined(iso: unknown, language: AppLanguage): string | null {
  if (typeof iso !== 'string' || !iso) return null;
  try {
    return new Date(iso).toLocaleDateString(language === 'en' ? 'en-US' : 'ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

function SectionTitle({ children, color }: { children: string; color: string }) {
  return <Text style={[styles.sectionTitle, { color }]}>{children}</Text>;
}

function CardDivider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

function InfoRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  titleColor,
  subtitleColor,
  dividerColor,
  isLast,
  onPress,
  children,
}: {
  icon: IonIcon;
  iconBg: string;
  iconColor: string;
  title?: string;
  subtitle: string;
  titleColor: string;
  subtitleColor: string;
  dividerColor: string;
  isLast?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const body = (
    <>
      <View style={[styles.infoIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.infoText}>
        {children ?? (
          <Text style={[styles.infoTitle, { color: titleColor }]} numberOfLines={2}>
            {title}
          </Text>
        )}
        <Text style={[styles.infoSub, { color: subtitleColor }]}>{subtitle}</Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.72}
        onPress={onPress}
        style={[styles.infoRow, !isLast && { borderBottomColor: dividerColor, borderBottomWidth: StyleSheet.hairlineWidth }]}
      >
        {body}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[styles.infoRow, !isLast && { borderBottomColor: dividerColor, borderBottomWidth: StyleSheet.hairlineWidth }]}
    >
      {body}
    </View>
  );
}

export default function SettingsProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, updateProfile, uploadProfileImage, refreshUser, token, logout } = useAuth();
  const { t, language } = useI18n();
  const { isDark, colors: c } = useTalkTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const cardStyle = useMemo(() => linksterMatteCard(isDark), [isDark]);
  const sectionAccent = talkBrand.accentBright;
  const dividerColor = isDark ? linksterDarkHub.separator : c.border;
  const fieldColor = isDark ? linksterDarkHub.textPrimary : c.text;
  const placeholderColor = isDark ? linksterDarkHub.textMuted : c.textMuted;

  const syncFormFromUser = useCallback(() => {
    if (!user) return;
    const full = typeof user.full_name === 'string' ? user.full_name : '';
    const { first, last } = splitFullName(full);
    setFirstName(first);
    setLastName(last);
    setUsername(typeof user.username === 'string' ? user.username : '');
    setBio(typeof user.bio === 'string' ? user.bio : '');
  }, [user]);

  useEffect(() => {
    syncFormFromUser();
  }, [syncFormFromUser]);

  useFocusEffect(
    useCallback(() => {
      refreshUser().catch(() => {});
    }, [refreshUser])
  );

  const displayName = joinFullName(firstName, lastName) || username || 'Linkster';
  const avatarPath = typeof user?.avatar === 'string' ? user.avatar : undefined;
  const email = typeof user?.email === 'string' ? user.email : undefined;
  const joined = formatJoined(user?.created_at, language);
  const bioCount = bio.length;

  const uploadPickedAvatar = async (asset: {
    uri: string;
    mimeType?: string | null;
    width?: number;
    height?: number;
  }) => {
    setAvatarBusy(true);
    try {
      await uploadProfileImage(
        {
          uri: asset.uri,
          mimeType: asset.mimeType ?? 'image/jpeg',
          width: asset.width,
          height: asset.height,
        },
        'avatar'
      );
      await refreshUser();
    } catch (e) {
      Alert.alert(
        t('common.error'),
        e instanceof Error ? e.message : t('account.uploadPhotoFail')
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const pickAvatarFromSource = async (source: 'library' | 'camera') => {
    if (avatarBusy) return;
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t('common.permission'),
        source === 'camera' ? t('account.cameraPermission') : t('account.galleryPermission')
      );
      return;
    }
    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (picked.canceled || !picked.assets[0]) return;
    await uploadPickedAvatar(picked.assets[0]);
  };

  const onEditAvatar = () => {
    if (avatarBusy) return;
    Alert.alert(t('account.photoPickerTitle'), t('account.photoPickerMsg'), [
      { text: t('account.gallery'), onPress: () => pickAvatarFromSource('library') },
      { text: t('account.camera'), onPress: () => pickAvatarFromSource('camera') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const save = async () => {
    if (saving) return;
    if (!token) {
      Alert.alert('Linkster', t('account.signInRequiredMsg'));
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        username: username.trim(),
        full_name: joinFullName(firstName, lastName),
        bio: bio.trim(),
      });
      await refreshUser();
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(t('account.logoutConfirmTitle'), t('account.logoutConfirmMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  const headerFg = isDark ? linksterDarkHub.textPrimary : c.text;

  const renderHeader = (showActions: boolean) => (
    <View style={{ paddingTop: insets.top + 4 }}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={headerFg} />
        </TouchableOpacity>

        <Text
          style={[styles.topTitle, { color: headerFg }]}
          numberOfLines={1}
          pointerEvents="none"
        >
          {t('account.screenTitle')}
        </Text>

        {showActions ? (
          <View style={styles.topRight}>
            <TouchableOpacity onPress={onEditAvatar} disabled={avatarBusy} activeOpacity={0.85}>
              {avatarBusy ? (
                <View style={styles.headerAvatar}>
                  <ActivityIndicator size="small" color={talkBrand.accent} />
                </View>
              ) : (
                <UserAvatar avatarPath={avatarPath} name={displayName} size={36} style={styles.headerAvatar} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={saving} hitSlop={8} style={styles.doneBtn}>
              {saving ? (
                <ActivityIndicator size="small" color={talkBrand.accent} />
              ) : (
                <Text style={[styles.doneText, { color: talkBrand.accentBright }]}>{t('common.done')}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.topRightSlot} />
        )}
      </View>
    </View>
  );

  if (!token) {
    return (
      <OrbitScreenScaffold isDark={isDark} variant="page">
        <View style={styles.page}>
          {renderHeader(false)}
          <View style={styles.center}>
            <Text style={[styles.emptySub, { color: c.textSecondary }]}>{t('account.loginRequired')}</Text>
          </View>
        </View>
      </OrbitScreenScaffold>
    );
  }

  return (
    <OrbitScreenScaffold isDark={isDark} variant="page">
      <View style={styles.page}>
        {renderHeader(true)}

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <SectionTitle color={sectionAccent}>{t('account.photoSection')}</SectionTitle>
            <TouchableOpacity
              style={[styles.card, cardStyle, styles.photoRow]}
              onPress={onEditAvatar}
              disabled={avatarBusy}
              activeOpacity={0.75}
            >
              <View style={styles.photoAvatarWrap}>
                <UserAvatar
                  avatarPath={avatarPath}
                  name={displayName}
                  size={64}
                  style={styles.photoAvatar}
                  ring={{ color: talkBrand.accentBright, width: 2, padding: 2 }}
                />
                {avatarBusy ? (
                  <View style={styles.photoAvatarOverlay}>
                    <ActivityIndicator color="#fff" size="small" />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.photoEditBadge,
                      { backgroundColor: talkBrand.accent, borderColor: isDark ? '#000' : c.bg },
                    ]}
                  >
                    <Ionicons name="camera" size={14} color={talkBrand.onAccent} />
                  </View>
                )}
              </View>
              <View style={styles.photoText}>
                <Text style={[styles.photoTitle, { color: fieldColor }]}>{t('account.changePhoto')}</Text>
                <Text style={[styles.photoSub, { color: c.textSecondary }]}>
                  {t('account.changePhotoSub')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
            </TouchableOpacity>

            <SectionTitle color={sectionAccent}>{t('account.sectionName')}</SectionTitle>
            <View style={[styles.card, cardStyle]}>
              <TextInput
                style={[styles.nameInput, { color: fieldColor }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('account.firstName')}
                placeholderTextColor={placeholderColor}
              />
              <CardDivider color={dividerColor} />
              <TextInput
                style={[styles.nameInput, { color: fieldColor }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('account.lastName')}
                placeholderTextColor={placeholderColor}
              />
            </View>

            <View style={[styles.card, cardStyle, styles.bioCard, { marginTop: 10 }]}>
              <TextInput
                style={[styles.bioInput, { color: fieldColor }]}
                value={bio}
                onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
                placeholder={t('account.bioPlaceholder')}
                placeholderTextColor={placeholderColor}
                multiline
                maxLength={BIO_MAX}
                textAlignVertical="top"
              />
              <Text style={[styles.bioCount, { color: placeholderColor }]}>{bioCount}</Text>
            </View>
            <Text style={[styles.footnote, { color: placeholderColor }]}>{t('account.bioFootnote')}</Text>

            <SectionTitle color={sectionAccent}>{t('account.sectionInfo')}</SectionTitle>
            <View style={[styles.card, cardStyle]}>
              {email ? (
                <InfoRow
                  icon="mail-outline"
                  iconBg={talkBrand.accentSoft}
                  iconColor={talkBrand.accentBright}
                  title={email}
                  subtitle={t('account.emailSub')}
                  titleColor={fieldColor}
                  subtitleColor={c.textSecondary}
                  dividerColor={dividerColor}
                />
              ) : null}
              <InfoRow
                icon="at"
                iconBg="rgba(0, 168, 150, 0.2)"
                iconColor={talkBrand.accentPressed}
                subtitle={t('account.usernameSub')}
                titleColor={fieldColor}
                subtitleColor={c.textSecondary}
                dividerColor={dividerColor}
                isLast={!joined}
              >
                <TextInput
                  style={[styles.infoTitleInput, { color: fieldColor }]}
                  value={username ? `@${username.replace(/^@/, '')}` : ''}
                  onChangeText={(t) => setUsername(t.replace(/^@|\s/g, ''))}
                  placeholder="@username"
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </InfoRow>
              {joined ? (
                <InfoRow
                  icon="calendar-outline"
                  iconBg={linksterDarkHub.accentGlow}
                  iconColor={talkBrand.accentBright}
                  title={joined}
                  subtitle={t('account.joinedSub')}
                  titleColor={fieldColor}
                  subtitleColor={c.textSecondary}
                  dividerColor={dividerColor}
                  isLast
                />
              ) : null}
            </View>

            <View style={[styles.card, cardStyle, { marginTop: 22 }]}>
              <TouchableOpacity style={styles.logoutRow} onPress={confirmLogout} activeOpacity={0.72}>
                <View style={[styles.infoIcon, styles.logoutIcon]}>
                  <Ionicons name="log-out-outline" size={22} color={talkBrand.danger} />
                </View>
                <Text style={styles.logoutText}>{t('account.logout')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </OrbitScreenScaffold>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: linksterLayout.screenH,
    paddingTop: 6,
  },
  topBar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 8,
    height: 44,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  topTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 44,
    lineHeight: 44,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    zIndex: 1,
    ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' as const } : {}),
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    minWidth: 112,
    paddingRight: 8,
    zIndex: 2,
  },
  topRightSlot: { width: 112, height: 44 },
  doneBtn: {
    height: 44,
    paddingLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptySub: { fontSize: 15, textAlign: 'center' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 12,
  },
  card: { overflow: 'hidden' },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
  },
  photoAvatarWrap: {
    width: 68,
    height: 68,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAvatar: { width: 64, height: 64, borderRadius: 32 },
  photoAvatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  photoText: { flex: 1, gap: 3 },
  photoTitle: { fontSize: 17, fontWeight: '600' },
  photoSub: { fontSize: 14, lineHeight: 18 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  nameInput: {
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontWeight: '400',
  },
  bioCard: { minHeight: 88, paddingBottom: 28 },
  bioInput: {
    fontSize: 17,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 72,
  },
  bioCount: {
    position: 'absolute',
    right: 14,
    bottom: 10,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  footnote: {
    fontSize: 13,
    marginTop: 6,
    marginLeft: 12,
    marginBottom: 4,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1, gap: 2 },
  infoTitle: { fontSize: 17, fontWeight: '400' },
  infoTitleInput: {
    fontSize: 17,
    fontWeight: '400',
    padding: 0,
    margin: 0,
  },
  infoSub: { fontSize: 14 },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  logoutIcon: { backgroundColor: 'rgba(224, 21, 112, 0.12)' },
  logoutText: {
    fontSize: 17,
    fontWeight: '500',
    color: talkBrand.danger,
  },
  doneText: { fontSize: 17, fontWeight: '600' },
});
