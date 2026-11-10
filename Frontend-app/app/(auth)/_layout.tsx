import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/src/theme/tokens';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
  );
}
