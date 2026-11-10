import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

import { useAuth } from '../../../context/AuthContext';
import { useI18n } from '../../../i18n/useI18n';

import { useTalkTheme } from '../../../hooks/useTalkTheme';

import { talkBrand } from '../../../theme/talkTheme';

import UserProfileScreen from '../../../screens/UserProfileScreen';

import OrbitScreenScaffold from '../ui/OrbitScreenScaffold';
import { navigateMessengerTab } from '../../../navigation/rootNavigation';



/** Профиль во вкладке «Профиль» */

export default function MessengerProfileScreen({ navigation }: { navigation: any }) {

  const { user, loading: authLoading, token, refreshUser } = useAuth();
  const { t } = useI18n();

  useFocusEffect(
    useCallback(() => {
      refreshUser().catch(() => {});
    }, [refreshUser])
  );

  const { isDark, colors: c } = useTalkTheme();



  const username = typeof user?.username === 'string' ? user.username : '';



  if (authLoading || (token && !user)) {

    return (

      <OrbitScreenScaffold isDark={isDark}>

        <View style={styles.center}>

          <ActivityIndicator size="large" color={talkBrand.accent} />

        </View>

      </OrbitScreenScaffold>

    );

  }



  if (!username) {

    return (

      <OrbitScreenScaffold isDark={isDark}>

        <View style={styles.center}>

          <Text style={[styles.hint, { color: c.textSecondary }]}>

            {t('profile.loadError')}

          </Text>

          <TouchableOpacity
            onPress={() => navigateMessengerTab(navigation, 'Deck')}
            style={styles.linkBtn}
          >

            <Text style={{ color: talkBrand.accentBright, fontWeight: '600' }}>{t('profile.openDeck')}</Text>

          </TouchableOpacity>

        </View>

      </OrbitScreenScaffold>

    );

  }



  return (

    <OrbitScreenScaffold isDark={isDark}>

      <View style={styles.fill}>

        <UserProfileScreen

          key={username}

          navigation={navigation}

          route={{ params: { username, hideBack: true, orbitShell: true } }}

        />

      </View>

    </OrbitScreenScaffold>

  );

}



const styles = StyleSheet.create({

  fill: { flex: 1, backgroundColor: 'transparent' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  hint: { fontSize: 15, textAlign: 'center', marginBottom: 12 },

  linkBtn: { padding: 8 },

});


