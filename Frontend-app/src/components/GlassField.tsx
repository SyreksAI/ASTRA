import React from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors } from '../theme/tokens';

type Props = TextInputProps & {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  rightIcon?: React.ComponentProps<typeof FontAwesome>['name'];
  onRightPress?: () => void;
};

export function GlassField({ icon, rightIcon, onRightPress, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.row}>
        <FontAwesome name={icon} size={16} color={colors.muted} style={styles.leftIcon} />
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.input, style]}
          autoCapitalize="none"
          {...rest}
        />
        {rightIcon ? (
          <Pressable onPress={onRightPress} hitSlop={10} style={styles.rightIcon}>
            <FontAwesome name={rightIcon} size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 8,
    padding: 4,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 0,
  },
});
