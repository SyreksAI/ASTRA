import React, { useEffect, useMemo, useState } from 'react';

import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';

import { Image } from 'expo-image';

import { avatarImageUri } from '../../config/api';

import { talkBrand } from '../../theme/talkTheme';



export type AvatarRing = {

  color: string;

  width?: number;

  padding?: number;

};



type Props = {

  avatarPath?: string | null;

  name?: string;

  size: number;

  style?: StyleProp<ViewStyle>;

  borderRadius?: number;

  fallbackBg?: string;

  letterColor?: string;

  /** Круглая рамка — и с фото, и с буквой-заглушкой */

  ring?: AvatarRing;

};



export default function UserAvatar({

  avatarPath,

  name,

  size,

  style,

  borderRadius,

  fallbackBg = talkBrand.accentSoft,

  letterColor = talkBrand.accent,

  ring,

}: Props) {

  const uri = useMemo(() => avatarImageUri(avatarPath), [avatarPath]);

  const [failed, setFailed] = useState(false);



  useEffect(() => {

    setFailed(false);

  }, [uri]);



  const radius = borderRadius ?? size / 2;

  const letter = (name?.trim()?.[0] ?? '?').toUpperCase();



  const core =

    !uri || failed ? (

      <View

        style={[

          styles.fallback,

          { width: size, height: size, borderRadius: radius, backgroundColor: fallbackBg },

        ]}

      >

        <Text style={[styles.letter, { fontSize: size * 0.38, color: letterColor }]}>{letter}</Text>

      </View>

    ) : (

      <Image

        source={{ uri }}

        style={{ width: size, height: size, borderRadius: radius }}

        contentFit="cover"

        recyclingKey={uri}

        onError={() => setFailed(true)}

      />

    );



  if (!ring) {

    return <View style={style}>{core}</View>;

  }



  const ringWidth = ring.width ?? 2;
  const ringPad = ring.padding ?? 2;

  return (
    <View
      style={[
        styles.ringWrap,
        {
          borderRadius: 999,
          borderWidth: ringWidth,
          borderColor: ring.color,
          padding: ringPad,
        },
        style,
      ]}
    >
      {core}
    </View>
  );

}



const styles = StyleSheet.create({

  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  fallback: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

  letter: { fontWeight: '700' },

});


