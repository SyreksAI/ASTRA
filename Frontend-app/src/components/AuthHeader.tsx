import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme/tokens';

const NAV = ['Люди', 'Идеи', 'Созвездия', 'Ты'] as const;

export function AuthHeader() {
  return (
    <View style={styles.row}>
      <Image
        source={require('../../assets/images/elara-logo-dark.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.nav} accessibilityRole="header">
        {NAV.map((item, i) => (
          <React.Fragment key={item}>
            {i > 0 ? <Text style={styles.dot}>·</Text> : null}
            <Text style={styles.navItem}>{item}</Text>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginLeft: -14,
  },
  logo: {
    width: 118,
    height: 32,
    flexShrink: 0,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    flexWrap: 'nowrap',
  },
  navItem: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
    opacity: 0.45,
  },
  dot: {
    color: colors.text,
    fontSize: 11,
    opacity: 0.3,
    marginHorizontal: 4,
  },
});
