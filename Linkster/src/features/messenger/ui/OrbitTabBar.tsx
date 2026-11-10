import React from 'react';

import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../../context/AuthContext';

import UserAvatar from '../../../components/ui/UserAvatar';

import { linksterCanvas, talkBrand } from '../../../theme/talkTheme';

import { linksterDarkHub } from '../theme/linksterDarkHub';

import { useI18n } from '../../../i18n/useI18n';

import type { TranslationKey } from '../../../i18n/translations';



/** Высота ряда вкладок без safe area и без footer-отступов (мини-плеер и т.п.) */

export const ORBIT_TAB_BAR_CORE = 56;

/** Доп. зона под подписями вкладок (footer над системной полосой) */
export const ORBIT_TAB_FOOTER_PAD = 3;



const ICON_SIZE = 26;

const ICON_SLOT = 28;

const LABEL_LINE = 12;

const TAB_COUNT = 4;

const TAB_TOP_PAD = 9;



const TAB_META: Record<
  string,
  { labelKey: TranslationKey; icon: keyof typeof Ionicons.glyphMap; iconFocused: keyof typeof Ionicons.glyphMap }
> = {
  Orbit: { labelKey: 'tabs.chats', icon: 'chatbubbles-outline', iconFocused: 'chatbubbles' },
  Calls: { labelKey: 'tabs.calls', icon: 'call-outline', iconFocused: 'call' },
  Deck: { labelKey: 'tabs.deck', icon: 'apps-outline', iconFocused: 'apps' },
  Self: { labelKey: 'tabs.profile', icon: 'person-outline', iconFocused: 'person' },
};



export default function OrbitTabBar({ state, navigation }: BottomTabBarProps) {

  const insets = useSafeAreaInsets();

  const { user } = useAuth();
  const { t, isDark, accentPreset } = useI18n();

  const barBg = isDark ? linksterDarkHub.bg : linksterCanvas.light;

  const inactive = isDark ? linksterDarkHub.tabInactive : '#9CA3AF';

  const active = talkBrand.accentBright;



  const profileAvatarPath =
    typeof user?.avatar === 'string' ? user.avatar : null;

  const visibleRoutes = state.routes.filter((r) => TAB_META[r.name]);



  return (

    <View

      style={[

        styles.wrap,

        {

          backgroundColor: barBg,

          borderTopColor: isDark ? linksterDarkHub.tabBarBorder : talkBrand.accentBorder,

          paddingBottom: Math.max(insets.bottom, 10) + ORBIT_TAB_FOOTER_PAD,

        },

      ]}

    >

      <View style={styles.tabsRow}>

        {visibleRoutes.map((route) => {

          const index = state.routes.indexOf(route);

          const focused = state.index === index;

          const meta = TAB_META[route.name] ?? TAB_META.Orbit;

          const isProfile = route.name === 'Self';

          const iconColor = focused ? active : inactive;

          const labelColor = focused ? active : inactive;

          const iconName = focused ? meta.iconFocused : meta.icon;



          return (

            <TouchableOpacity

              key={route.name}

              style={styles.tab}

              activeOpacity={0.75}

              onPress={() => {

                const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });

                if (!focused && !e.defaultPrevented) navigation.navigate(route.name);

              }}

            >

              <View style={styles.tabInner}>

                <View style={styles.iconSlot}>

                  {isProfile ? (
                      <UserAvatar
                        avatarPath={profileAvatarPath}
                        name={
                          typeof user?.full_name === 'string'
                            ? user.full_name
                            : typeof user?.username === 'string'
                              ? user.username
                              : undefined
                        }
                        size={24}
                        ring={{
                          color: focused
                            ? talkBrand.accentBright
                            : isDark
                              ? 'rgba(255,255,255,0.22)'
                              : 'rgba(0,0,0,0.12)',
                          width: 1.5,
                          padding: 1,
                        }}
                      />
                  ) : (

                    <Ionicons name={iconName} size={ICON_SIZE} color={iconColor} />

                  )}

                </View>

                <Text

                  style={[styles.label, { color: labelColor }, focused && styles.labelFocused]}

                  numberOfLines={1}

                  ellipsizeMode="tail"

                >

                  {t(meta.labelKey)}

                </Text>

              </View>

            </TouchableOpacity>

          );

        })}

      </View>

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: {

    borderTopWidth: StyleSheet.hairlineWidth,

  },

  tabsRow: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingTop: TAB_TOP_PAD,

    paddingHorizontal: 8,

    minHeight: ORBIT_TAB_BAR_CORE,

  },

  tab: {

    flex: 1,

    flexBasis: 0,

    maxWidth: `${100 / TAB_COUNT}%`,

    alignItems: 'stretch',

  },

  tabInner: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 4,

    paddingBottom: 2,

  },

  iconSlot: {

    width: ICON_SLOT,

    height: ICON_SLOT,

    alignItems: 'center',

    justifyContent: 'center',

  },

  label: {

    marginTop: 4,

    width: '100%',

    fontSize: 10,

    fontWeight: '500',

    lineHeight: LABEL_LINE,

    height: LABEL_LINE,

    textAlign: 'center',

    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),

  },

  labelFocused: { fontWeight: '600' },

  profileRing: {

    width: 24,

    height: 24,

    borderRadius: 12,

    borderWidth: 1.5,

    overflow: 'hidden',

  },

  profileImg: { width: '100%', height: '100%' },

});


