import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function CosmosBackground({ children }: { children: React.ReactNode }) {
  return (
    <ImageBackground
      source={require('../../assets/images/cosmos-bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(5,7,12,0.55)', 'rgba(5,7,12,0.72)', 'rgba(5,7,12,0.9)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#05070c',
  },
  content: {
    flex: 1,
  },
});
