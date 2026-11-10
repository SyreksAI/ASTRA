import React, { useMemo, useState } from 'react';

import {

  View,

  Text,

  StyleSheet,

  SectionList,

  TouchableOpacity,

  Alert,

} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../../context/AuthContext';

import { getTalkColors } from '../../../theme/talkTheme';

import { linksterDarkHub } from '../theme/linksterDarkHub';

import OrbitScreenScaffold from '../ui/OrbitScreenScaffold';

import OrbitPageHeader from '../ui/OrbitPageHeader';

import LinksterCallHistoryRow from '../ui/LinksterCallHistoryRow';

import LinksterQuickDialRow from '../ui/LinksterQuickDialRow';

import LinksterEmptyState from '../ui/LinksterEmptyState';
import LinksterPhoneKeypadModal from '../ui/LinksterPhoneKeypadModal';

import {

  demoCallsForUi,

  demoQuickContactsForUi,

  groupDemoCalls,

  type DemoCallRecord,

} from '../demo/linksterDemoCalls';



type Filter = 'all' | 'missed';



export default function MessengerCallsScreen() {

  const insets = useSafeAreaInsets();

  const { theme } = useAuth();

  const isDark = theme === 'dark';

  const c = getTalkColors(isDark);

  const [filter, setFilter] = useState<Filter>('all');
  const [keypadOpen, setKeypadOpen] = useState(false);

  const allCalls = useMemo(() => demoCallsForUi(), []);

  const quickContacts = useMemo(() => demoQuickContactsForUi(), []);



  const filteredCalls = useMemo(() => {

    if (filter === 'missed') {

      return allCalls.filter((x) => x.direction === 'missed');

    }

    return allCalls;

  }, [allCalls, filter]);



  const sections = useMemo(() => groupDemoCalls(filteredCalls), [filteredCalls]);



  const onCallRowPress = (item: DemoCallRecord) => {

    Alert.alert('Linkster', `История звонка с ${item.name} — демо-превью.`);

  };



  const headerRight = (

    <TouchableOpacity

      style={styles.headerBtn}

      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}

      onPress={() => setKeypadOpen(true)}

    >

      <Ionicons

        name="keypad-outline"

        size={24}

        color={isDark ? linksterDarkHub.textPrimary : c.text}

      />

    </TouchableOpacity>

  );



  if (allCalls.length === 0) {

    return (

      <OrbitScreenScaffold isDark={isDark}>

        <OrbitPageHeader isDark={isDark} hubOnly right={headerRight} />

        <View style={[styles.emptyWrap, { paddingBottom: insets.bottom + 80 }]}>

          <LinksterEmptyState

            isDark={isDark}

            title="Звонков пока нет"

            subtitle="Аудио и видео доступны из чата — здесь появится история."

          />

        </View>

        <LinksterPhoneKeypadModal
          visible={keypadOpen}
          isDark={isDark}
          onClose={() => setKeypadOpen(false)}
        />

      </OrbitScreenScaffold>

    );

  }



  return (

    <OrbitScreenScaffold isDark={isDark}>

      <OrbitPageHeader isDark={isDark} hubOnly right={headerRight} />

      <SectionList

        sections={sections}

        keyExtractor={(item) => item.id}

        stickySectionHeadersEnabled={false}

        showsVerticalScrollIndicator={false}

        style={styles.list}

        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}

        ListHeaderComponent={

          <View>

            <LinksterQuickDialRow isDark={isDark} contacts={quickContacts} />

            <View style={styles.filters}>

              {(['all', 'missed'] as const).map((key) => {

                const active = filter === key;

                const label = key === 'all' ? 'Все' : 'Пропущенные';

                return (

                  <TouchableOpacity

                    key={key}

                    activeOpacity={0.8}

                    onPress={() => setFilter(key)}

                    style={[

                      styles.chip,

                      isDark ? styles.chipDark : styles.chipLight,

                      active && (isDark ? styles.chipActiveDark : styles.chipActiveLight),

                    ]}

                  >

                    <Text

                      style={[

                        styles.chipText,

                        {

                          color: active

                            ? isDark

                              ? linksterDarkHub.textPrimary

                              : '#111827'

                            : isDark

                              ? linksterDarkHub.textSecondary

                              : c.textSecondary,

                        },

                      ]}

                    >

                      {label}

                    </Text>

                  </TouchableOpacity>

                );

              })}

            </View>

          </View>

        }

        renderSectionHeader={({ section: { title } }) => (

          <Text

            style={[

              styles.sectionTitle,

              { color: isDark ? linksterDarkHub.textMuted : c.textMuted },

            ]}

          >

            {title}

          </Text>

        )}

        renderItem={({ item }) => (

          <LinksterCallHistoryRow

            item={item}

            isDark={isDark}

            onPress={() => onCallRowPress(item)}

          />

        )}

        ListEmptyComponent={

          <View style={styles.filteredEmpty}>

            <Text style={[styles.filteredEmptyText, { color: c.textSecondary }]}>

              Пропущенных звонков нет

            </Text>

          </View>

        }

        ItemSeparatorComponent={() => (

          <View

            style={[

              styles.sep,

              { backgroundColor: isDark ? linksterDarkHub.separator : c.border },

            ]}

          />

        )}

      />

      <LinksterPhoneKeypadModal
        visible={keypadOpen}
        isDark={isDark}
        onClose={() => setKeypadOpen(false)}
      />

    </OrbitScreenScaffold>

  );

}



const styles = StyleSheet.create({

  list: { flex: 1 },

  emptyWrap: { flex: 1, justifyContent: 'center' },

  headerBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filters: {

    flexDirection: 'row',

    gap: 8,

    paddingHorizontal: 16,

    marginBottom: 8,

  },

  chip: {

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 999,

  },

  chipDark: { backgroundColor: 'rgba(255,255,255,0.06)' },

  chipLight: { backgroundColor: '#F3F4F6' },

  chipActiveDark: { backgroundColor: 'rgba(255,255,255,0.14)' },

  chipActiveLight: { backgroundColor: '#E5E7EB' },

  chipText: { fontSize: 14, fontWeight: '600' },

  sectionTitle: {

    fontSize: 13,

    fontWeight: '600',

    letterSpacing: 0.3,

    paddingHorizontal: 16,

    paddingTop: 16,

    paddingBottom: 6,

    textTransform: 'capitalize',

  },

  sep: {

    height: StyleSheet.hairlineWidth,

    marginLeft: 76,

    marginRight: 16,

  },

  filteredEmpty: { padding: 40, alignItems: 'center' },

  filteredEmptyText: { fontSize: 15, textAlign: 'center' },

});


