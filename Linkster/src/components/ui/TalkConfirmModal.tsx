import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { getTalkColors, talkAccentAlpha, talkBrand } from '../../theme/talkTheme';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function TalkConfirmModal({
  visible,
  title,
  message,
  cancelLabel = 'Отмена',
  confirmLabel = 'Удалить',
  destructive = true,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, destructive && styles.confirmBtnDanger]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmText, destructive && styles.confirmTextDanger]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 14, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: getTalkColors(true).surface2,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: talkAccentAlpha(0.22),
  },
  title: {
    color: '#e8eef2',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  message: {
    marginTop: 10,
    color: '#8b98a5',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  cancelText: {
    color: '#e8eef2',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: talkBrand.accentSoft,
    borderWidth: 1,
    borderColor: talkBrand.accentBorder,
    alignItems: 'center',
  },
  confirmBtnDanger: {
    backgroundColor: 'rgba(224, 21, 112, 0.14)',
    borderColor: 'rgba(224, 21, 112, 0.45)',
  },
  confirmText: {
    color: talkBrand.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  confirmTextDanger: {
    color: talkBrand.danger,
  },
});
