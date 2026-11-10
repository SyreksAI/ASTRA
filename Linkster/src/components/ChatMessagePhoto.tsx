import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { talkBrand } from '../theme/talkTheme';

type Props = {
  uri: string;
  maxWidth: number;
  borderColor: string;
  isMe: boolean;
  isRead: boolean;
  timeLabel: string;
};

const MAX_HEIGHT_RATIO = 1.85;
const MIN_HEIGHT = 72;

function scaleHeight(maxWidth: number, srcW: number, srcH: number): number {
  const scaled = Math.round(maxWidth * (srcH / srcW));
  const cap = Math.round(maxWidth * MAX_HEIGHT_RATIO);
  return Math.min(cap, Math.max(MIN_HEIGHT, scaled));
}

function ChatMessagePhoto({
  uri,
  maxWidth,
  borderColor,
  isMe,
  isRead,
  timeLabel,
}: Props) {
  const [height, setHeight] = useState(Math.round(maxWidth * 0.75));
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const applySize = useCallback(
    (srcW: number, srcH: number) => {
      if (srcW <= 0 || srcH <= 0) return;
      setHeight(scaleHeight(maxWidth, srcW, srcH));
    },
    [maxWidth]
  );

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    Image.getSize(
      uri,
      (w, h) => applySize(w, h),
      () => {}
    );
  }, [uri, applySize]);

  return (
    <View
      style={[
        styles.border,
        { width: maxWidth, height, borderColor },
        isMe ? styles.borderMe : styles.borderOther,
      ]}
    >
      <View style={[styles.inner, isMe ? styles.innerMe : styles.innerOther]}>
        {loading && !failed ? (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color={talkBrand.accent} />
          </View>
        ) : null}
        {failed ? (
          <View style={styles.loader}>
            <Ionicons name="image-outline" size={28} color="#8b98a5" />
            <Text style={styles.failText}>Не удалось загрузить</Text>
          </View>
        ) : (
          <Image
            source={{ uri }}
            style={{ width: maxWidth - 4, height: height - 4, borderRadius: 14 }}
            resizeMode="cover"
            onLoad={(e) => {
              setLoading(false);
              const src = e.nativeEvent.source;
              if (src?.width && src?.height) applySize(src.width, src.height);
            }}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
            accessibilityLabel="Фото в сообщении"
          />
        )}
        <View style={styles.meta}>
          <Text style={styles.metaTime}>{timeLabel}</Text>
          {isMe ? (
            <Ionicons name={isRead ? 'checkmark-done' : 'checkmark'} size={13} color="#fff" />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  border: {
    borderWidth: 2,
    borderRadius: 16,
  },
  borderMe: { borderBottomRightRadius: 4 },
  borderOther: { borderBottomLeftRadius: 4 },
  inner: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerMe: { borderBottomRightRadius: 2 },
  innerOther: { borderBottomLeftRadius: 2 },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  failText: { fontSize: 11, color: '#8b98a5' },
  meta: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  metaTime: { color: '#fff', fontSize: 10, fontWeight: '500' },
});

export default memo(ChatMessagePhoto);
