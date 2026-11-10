import React from 'react';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScreenHeader from '../../components/ui/ScreenHeader';

import { useTalkTheme } from '../../hooks/useTalkTheme';

import { talkBrand } from '../../theme/talkTheme';

import { useAuth } from '../../context/AuthContext';

import { useI18n } from '../../i18n/useI18n';

import { navigateRoot } from '../../navigation/rootNavigation';

import {

  SettingsSectionTitle,

  SettingsCard,

  SettingsNavRow,

  useSettingsChrome,

} from './settingsLayout';



function line(label: string, value: string | undefined, c: { text: string; textSecondary: string }) {

  if (!value) return null;

  return (

    <View style={styles.line}>

      <Text style={[styles.lineLabel, { color: c.textSecondary }]}>{label}</Text>

      <Text style={[styles.lineValue, { color: c.text }]}>{value}</Text>

    </View>

  );

}



export default function SettingsAccountScreen() {

  const navigation = useNavigation<any>();

  const insets = useSafeAreaInsets();

  const { user, logout } = useAuth();

  const { t } = useI18n();

  const { colors: c, sectionAccent } = useSettingsChrome();



  const fullName = typeof user?.full_name === 'string' ? user.full_name : undefined;

  const username = typeof user?.username === 'string' ? user.username : undefined;

  const email = typeof user?.email === 'string' ? user.email : undefined;



  const confirmLogout = () => {

    Alert.alert(t('deck.logoutTitle'), t('deck.logoutMsg'), [

      { text: t('common.cancel'), style: 'cancel' },

      { text: t('common.logout'), style: 'destructive', onPress: () => logout() },

    ]);

  };



  const passwordSoon = () => {

    Alert.alert(t('settingsAccount.passwordTitle'), t('settingsAccount.passwordSoon'));

  };



  return (

    <View style={[styles.page, { backgroundColor: c.bg }]}>

      <ScreenHeader title={t('settingsAccount.title')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>

        <SettingsSectionTitle color={sectionAccent}>{t('settingsAccount.sectionProfile')}</SettingsSectionTitle>

        <SettingsCard style={styles.infoCard}>

          {line(t('settingsAccount.labelName'), fullName ?? username, c)}

          {line(t('settingsAccount.labelUsername'), username ? `@${username}` : undefined, c)}

          {line(t('settingsAccount.labelEmail'), email, c)}

        </SettingsCard>



        <SettingsSectionTitle color={sectionAccent}>{t('settingsAccount.sectionSecurity')}</SettingsSectionTitle>

        <SettingsCard>

          <SettingsNavRow

            label={t('settingsAccount.editProfile')}

            hint={t('deck.rowAccountSub')}

            onPress={() => navigateRoot(navigation, 'SettingsProfile')}

          />

          <SettingsNavRow

            label={t('settingsAccount.passwordTitle')}

            hint={t('settingsAccount.passwordSub')}

            onPress={passwordSoon}

          />

          <SettingsNavRow

            label={t('deck.rowPrivacy')}

            onPress={() => navigateRoot(navigation, 'SettingsPrivacy')}

          />

          <SettingsNavRow

            label={t('deck.rowDevices')}

            onPress={() => navigateRoot(navigation, 'SettingsDevices')}

            isLast

          />

        </SettingsCard>



        <TouchableOpacity

          style={[styles.logoutBtn, { backgroundColor: c.surface2 }]}

          onPress={confirmLogout}

          activeOpacity={0.7}

        >

          <Text style={styles.logoutText}>{t('settingsAccount.logout')}</Text>

        </TouchableOpacity>

      </ScrollView>

    </View>

  );

}



const styles = StyleSheet.create({

  page: { flex: 1 },

  content: { paddingHorizontal: 16, paddingTop: 8 },

  infoCard: { padding: 16, gap: 16 },

  line: { gap: 4 },

  lineLabel: { fontSize: 13 },

  lineValue: { fontSize: 16, fontWeight: '500' },

  logoutBtn: {

    marginTop: 24,

    borderRadius: 12,

    paddingVertical: 14,

    alignItems: 'center',

  },

  logoutText: { color: talkBrand.danger, fontSize: 16, fontWeight: '600' },

});


