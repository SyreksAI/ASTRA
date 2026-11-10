import React from 'react';

import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { formatChatRowTime } from '../../chat/domain/format';

import { getTalkColors, talkBrand } from '../../../theme/talkTheme';

import { linksterDarkHub } from '../theme/linksterDarkHub';

import {

  demoCallAvatarUri,

  formatCallDuration,

  type DemoCallRecord,

} from '../demo/linksterDemoCalls';



type Props = {

  item: DemoCallRecord;

  isDark: boolean;

  onPress: () => void;

};



function directionMeta(item: DemoCallRecord): {

  icon: keyof typeof Ionicons.glyphMap;

  label: string;

} {

  if (item.direction === 'missed') {

    return { icon: 'arrow-down-outline', label: 'Пропущенный' };

  }

  if (item.direction === 'outgoing') {

    return { icon: 'arrow-up-outline', label: 'Исходящий' };

  }

  return { icon: 'arrow-down-outline', label: 'Входящий' };

}



export default function LinksterCallHistoryRow({ item, isDark, onPress }: Props) {

  const c = getTalkColors(isDark);

  const missed = item.direction === 'missed';

  const meta = directionMeta(item);

  const duration = formatCallDuration(item.durationSec);

  const kindLabel = item.kind === 'video' ? 'видео' : 'аудио';

  const subtitleParts = [meta.label, kindLabel];

  if (duration) subtitleParts.push(duration);

  const subtitle = subtitleParts.join(' · ');



  const nameColor = missed

    ? isDark

      ? '#F87171'

      : '#DC2626'

    : isDark

      ? linksterDarkHub.textPrimary

      : c.text;

  const subColor = missed

    ? isDark

      ? 'rgba(248, 113, 113, 0.85)'

      : '#EF4444'

    : isDark

      ? linksterDarkHub.textSecondary

      : c.textSecondary;

  const timeColor = isDark ? linksterDarkHub.textMuted : c.textMuted;

  const iconColor = missed ? subColor : isDark ? linksterDarkHub.textMuted : c.textMuted;



  return (

    <TouchableOpacity activeOpacity={0.65} onPress={onPress} style={styles.row}>

      <Image source={{ uri: demoCallAvatarUri(item.avatarSeed) }} style={styles.avatar} />

      <View style={styles.body}>

        <Text style={[styles.name, { color: nameColor }]} numberOfLines={1}>

          {item.name}

        </Text>

        <View style={styles.subLine}>

          <Ionicons name={meta.icon} size={14} color={iconColor} style={styles.dirIcon} />

          {item.kind === 'video' ? (

            <Ionicons name="videocam-outline" size={14} color={iconColor} style={styles.kindIcon} />

          ) : (

            <Ionicons name="call-outline" size={13} color={iconColor} style={styles.kindIcon} />

          )}

          <Text style={[styles.sub, { color: subColor }]} numberOfLines={1}>

            {subtitle}

          </Text>

        </View>

      </View>

      <View style={styles.meta}>

        <Text style={[styles.time, { color: timeColor }]}>{formatChatRowTime(item.at)}</Text>

        <TouchableOpacity

          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}

          onPress={onPress}

          style={styles.callBtn}

        >

          <Ionicons

            name={item.kind === 'video' ? 'videocam' : 'call'}

            size={20}

            color={talkBrand.accentBright}

          />

        </TouchableOpacity>

      </View>

    </TouchableOpacity>

  );

}



const styles = StyleSheet.create({

  row: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 16,

    paddingVertical: 11,

    gap: 12,

  },

  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1A1A1A' },

  body: { flex: 1, minWidth: 0, gap: 3 },

  name: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },

  subLine: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },

  dirIcon: { marginRight: 2 },

  kindIcon: { marginRight: 4 },

  sub: { flex: 1, fontSize: 14, lineHeight: 18 },

  meta: { alignItems: 'flex-end', gap: 8, minWidth: 52 },

  time: { fontSize: 13, fontWeight: '500' },

  callBtn: {

    width: 36,

    height: 36,

    borderRadius: 18,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: 'rgba(128, 128, 128, 0.12)',

  },

});


