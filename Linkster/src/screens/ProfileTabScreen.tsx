import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTalkTheme } from '../hooks/useTalkTheme';
import { talkBrand } from '../theme/talkTheme';
import UserProfileScreen from './UserProfileScreen';

/** Свой профиль во вкладке «Профиль» */
export default function ProfileTabScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const { colors: c } = useTalkTheme();

  if (!user?.username) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color={talkBrand.accent} />
      </View>
    );
  }

  return (
    <UserProfileScreen
      navigation={navigation}
      route={{ params: { username: String(user.username), hideBack: true } }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
