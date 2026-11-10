import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function OrbitHeroBanner() {
  return (
    <View style={styles.wrap}>
      <ImageBackground
        source={require('../../../assets/images/orbit-planet.png')}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <LinearGradient
          colors={[
            'rgba(5,7,12,0.15)',
            'rgba(5,7,12,0.35)',
            'rgba(5,7,12,0.72)',
          ]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.copy}>
          <Text style={styles.title}>Твоя орбита</Text>
          <Text style={styles.subtitle}>
            Люди, идеи и события, к которым ты ближе сегодня
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  hero: {
    height: 190,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#05070c',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  heroImage: {
    borderRadius: 22,
    resizeMode: 'cover',
    transform: [{ scale: 1.12 }, { translateX: -16 }, { translateY: 8 }],
  },
  copy: {
    maxWidth: '86%',
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
