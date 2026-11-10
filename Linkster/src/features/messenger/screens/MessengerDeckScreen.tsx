import React, { useCallback } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTalkTheme } from '../../../hooks/useTalkTheme';

import { useAuth } from '../../../context/AuthContext';

import { talkBrand } from '../../../theme/talkTheme';

import { linksterDarkHub } from '../theme/linksterDarkHub';

import OrbitScreenScaffold from '../ui/OrbitScreenScaffold';

import OrbitPageHeader from '../ui/OrbitPageHeader';

import LinksterInstrumentsDeck from '../ui/LinksterInstrumentsDeck';



/** Вкладка «Инструменты» */

export default function MessengerDeckScreen() {

  const navigation = useNavigation<any>();

  const insets = useSafeAreaInsets();

  const { isDark } = useTalkTheme();

  const { updateTheme, refreshUser } = useAuth();

  useFocusEffect(
    useCallback(() => {
      refreshUser().catch(() => {});
    }, [refreshUser])
  );



  const themeToggle = (

    <TouchableOpacity

      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}

      onPress={() => updateTheme(isDark ? 'light' : 'dark').catch(() => {})}

    >

      <Ionicons

        name={isDark ? 'moon-outline' : 'sunny-outline'}

        size={24}

        color={isDark ? linksterDarkHub.textPrimary : talkBrand.accent}

      />

    </TouchableOpacity>

  );



  return (

    <OrbitScreenScaffold isDark={isDark}>

      <OrbitPageHeader isDark={isDark} hubOnly right={themeToggle} />

      <ScrollView

        showsVerticalScrollIndicator={false}

        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}

      >

        <LinksterInstrumentsDeck navigation={navigation} paddingBottom={insets.bottom + 8} />

      </ScrollView>

    </OrbitScreenScaffold>

  );

}


