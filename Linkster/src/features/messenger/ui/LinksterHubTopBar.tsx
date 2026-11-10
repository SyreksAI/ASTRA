import React from 'react';

import { View, StyleSheet } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TalkWordmark from '../../../components/TalkWordmark';



type Props = {

  isDark: boolean;

  right?: React.ReactNode;

};



/** Отступ сверху под safe area — единый для всех экранов с wordmark */

export function linksterHubTopPadding(insetsTop: number): number {

  return insetsTop + 4;

}



/** Верхняя строка: wordmark hub + действия справа (как на «Чаты») */

export default function LinksterHubTopBar({ isDark, right }: Props) {

  const insets = useSafeAreaInsets();



  return (

    <View style={[styles.bar, { paddingTop: linksterHubTopPadding(insets.top) }]}>

      <View style={styles.logoWrap}>

        <TalkWordmark onLightBackground={!isDark} size="hub" />

      </View>

      <View style={styles.actions}>{right ?? null}</View>

    </View>

  );

}



export const linksterHubTopBarStyles = styles;



const styles = StyleSheet.create({

  bar: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingLeft: 6,

    paddingRight: 16,

    paddingBottom: 6,

    minHeight: 56,

    zIndex: 2,

  },

  logoWrap: {

    flex: 1,

    alignItems: 'flex-start',

    justifyContent: 'center',

    overflow: 'visible',

  },

  actions: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,

    flexShrink: 0,

    paddingTop: 4,

    minHeight: 36,

    justifyContent: 'flex-end',

  },

});


