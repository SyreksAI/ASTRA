import React from 'react';

import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { getTalkColors, talkBrand } from '../../../theme/talkTheme';

import { linksterDarkHub } from '../theme/linksterDarkHub';

import {

  demoCallAvatarUri,

  type DemoQuickContact,

} from '../demo/linksterDemoCalls';



type Props = {

  isDark: boolean;

  contacts: DemoQuickContact[];

};



export default function LinksterQuickDialRow({ isDark, contacts }: Props) {

  const c = getTalkColors(isDark);

  const labelColor = isDark ? linksterDarkHub.textPrimary : c.text;

  const ringBg = isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6';

  const accent = talkBrand.accentBright;



  if (contacts.length === 0) return null;



  return (

    <View style={styles.root}>

      <Text style={[styles.heading, { color: isDark ? linksterDarkHub.textMuted : c.textMuted }]}>

        Быстрый набор

      </Text>

      <ScrollView

        horizontal

        showsHorizontalScrollIndicator={false}

        contentContainerStyle={styles.scroll}

      >

        {contacts.map((contact) => (

          <TouchableOpacity

            key={contact.id}

            style={styles.item}

            activeOpacity={0.85}

            onPress={() =>

              Alert.alert('Linkster', `Звонок ${contact.name} — демо-превью.`)

            }

          >

            <View style={[styles.avatarWrap, { backgroundColor: ringBg }]}>

              <Image

                source={{ uri: demoCallAvatarUri(contact.avatarSeed) }}

                style={styles.avatar}

              />

              <View style={[styles.callBadge, { backgroundColor: accent }]}>

                <Ionicons name="call" size={11} color={isDark ? '#0A0A0A' : '#FFFFFF'} />

              </View>

            </View>

            <Text style={[styles.name, { color: labelColor }]} numberOfLines={1}>

              {contact.name.split(' ')[0]}

            </Text>

          </TouchableOpacity>

        ))}

      </ScrollView>

    </View>

  );

}



const AVATAR = 56;



const styles = StyleSheet.create({

  root: { marginBottom: 8 },

  heading: {

    fontSize: 13,

    fontWeight: '600',

    letterSpacing: 0.2,

    marginBottom: 12,

    paddingHorizontal: 16,

  },

  scroll: { paddingHorizontal: 12, gap: 14, paddingBottom: 4 },

  item: { width: AVATAR + 8, alignItems: 'center' },

  avatarWrap: {

    width: AVATAR,

    height: AVATAR,

    borderRadius: AVATAR / 2,

    alignItems: 'center',

    justifyContent: 'center',

  },

  avatar: { width: AVATAR - 4, height: AVATAR - 4, borderRadius: (AVATAR - 4) / 2 },

  callBadge: {

    position: 'absolute',

    right: -2,

    bottom: -2,

    width: 22,

    height: 22,

    borderRadius: 11,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 2,

    borderColor: '#000000',

  },

  name: { marginTop: 8, fontSize: 12, fontWeight: '500', maxWidth: AVATAR + 12, textAlign: 'center' },

});


