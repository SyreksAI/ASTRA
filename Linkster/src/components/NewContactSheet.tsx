import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTalkTheme } from '../hooks/useTalkTheme';
import { talkBrand } from '../theme/talkTheme';
import { addLocalContact } from '../utils/localContacts';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function NewContactSheet({ visible, onClose, onCreated }: Props) {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTalkTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFirstName('');
    setLastName('');
    setPhone('');
    setError('');
  }, [visible]);

  const submit = async () => {
    setError('');
    setSaving(true);
    try {
      await addLocalContact({ firstName, lastName, phone });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: c.bgElevated, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: c.textMuted }]} />
          <Text style={[styles.title, { color: c.text }]}>Новый контакт</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={[styles.label, { color: c.textSecondary }]}>
            Имя <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.surface2, color: c.text, borderColor: c.border }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Имя"
            placeholderTextColor={c.textMuted}
          />

          <Text style={[styles.label, { color: c.textSecondary }]}>Фамилия</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.surface2, color: c.text, borderColor: c.border }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Необязательно"
            placeholderTextColor={c.textMuted}
          />

          <Text style={[styles.label, { color: c.textSecondary }]}>Номер телефона</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.surface2, color: c.text, borderColor: c.border }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+7 …"
            placeholderTextColor={c.textMuted}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.createBtn, saving && { opacity: 0.65 }]}
            onPress={submit}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving ? (
              <ActivityIndicator color={talkBrand.onAccent} />
            ) : (
              <Text style={styles.createBtnText}>Создать контакт</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
    opacity: 0.45,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 6, marginTop: 4 },
  required: { color: talkBrand.danger },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  error: { color: talkBrand.danger, marginBottom: 8, fontSize: 14 },
  createBtn: {
    marginTop: 18,
    backgroundColor: talkBrand.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createBtnText: { color: talkBrand.onAccent, fontWeight: '700', fontSize: 16 },
});
