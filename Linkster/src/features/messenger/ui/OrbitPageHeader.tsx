import React from 'react';

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LinksterHubTopBar from './LinksterHubTopBar';

import { getTalkColors } from '../../../theme/talkTheme';

import { linksterSectionLabel, linksterSubtitle } from '../theme/linksterPro';



type Props = {

  isDark: boolean;

  kicker?: string;

  title?: string;

  subtitle?: string;

  onBack?: () => void;

  right?: React.ReactNode;

  /** Только верхняя строка с логотипом — как вкладка «Чаты» */

  hubOnly?: boolean;

};



export default function OrbitPageHeader({

  isDark,

  kicker = 'Linkster',

  title = '',

  subtitle,

  onBack,

  right,

  hubOnly = false,

}: Props) {

  const insets = useSafeAreaInsets();

  const c = getTalkColors(isDark);

  const showWordmark = kicker === 'Linkster';



  if (showWordmark && !onBack) {

    const showTitleBlock = !hubOnly && !!title;

    return (

      <View style={styles.wrapHub}>

        <LinksterHubTopBar isDark={isDark} right={right} />

        {showTitleBlock ? (

          <View style={styles.titleBlock}>

            <Text style={[styles.title, { color: c.text }]}>{title}</Text>

            {subtitle ? (

              <Text style={[linksterSubtitle(isDark), styles.subBlock]}>{subtitle}</Text>

            ) : null}

          </View>

        ) : null}

      </View>

    );

  }



  return (

    <View style={[styles.wrapStack, { paddingTop: insets.top + 8 }]}>

      <View style={styles.row}>

        {onBack ? (

          <TouchableOpacity onPress={onBack} style={styles.back}>

            <Ionicons name="chevron-back" size={26} color={c.text} />

          </TouchableOpacity>

        ) : (

          <View style={styles.backPlaceholder} />

        )}

        {right ?? <View style={styles.backPlaceholder} />}

      </View>

      {showWordmark ? (

        <LinksterHubTopBar isDark={isDark} />

      ) : (

        <Text style={linksterSectionLabel(isDark)}>{kicker}</Text>

      )}

      {title ? <Text style={[styles.title, { color: c.text }]}>{title}</Text> : null}

      {subtitle ? (

        <Text style={[linksterSubtitle(isDark), styles.subBlock]}>{subtitle}</Text>

      ) : null}

    </View>

  );

}



const styles = StyleSheet.create({

  wrapHub: { paddingBottom: 0 },

  wrapStack: { paddingHorizontal: 16, paddingBottom: 16, zIndex: 2 },

  titleBlock: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  back: { width: 40, height: 40, justifyContent: 'center', marginLeft: -4 },

  backPlaceholder: { width: 40, height: 40 },

  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginTop: 4 },

  subBlock: { marginTop: 8, fontSize: 15, lineHeight: 22 },

});


