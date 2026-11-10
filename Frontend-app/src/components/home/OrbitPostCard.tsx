import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { feed } from '@/src/theme/tokens';
import { resolveMediaUrl } from '@/src/api/client';

export type PostMediaItem = {
  url: string;
  type?: 'image' | 'video';
};

export type OrbitPost = {
  id: number;
  content: string;
  image?: string | null;
  media?: PostMediaItem[];
  likes_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
  created_at?: string;
  constellation?: { id?: string; label?: string } | null;
  constellation_id?: string | null;
  author?: {
    username?: string;
    full_name?: string;
    avatar?: string | null;
  };
};

type Props = {
  post: OrbitPost;
  onLike?: () => void;
};

function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'сейчас';
  if (mins < 60) return `${mins} м`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч`;
  const days = Math.floor(hours / 24);
  return `${days} д`;
}

export function OrbitPostCard({ post, onLike }: Props) {
  const { width } = useWindowDimensions();
  const avatar = resolveMediaUrl(post.author?.avatar);
  const mediaItems: PostMediaItem[] =
    post.media?.length
      ? post.media
      : post.image
        ? [{ url: post.image, type: 'image' }]
        : [];
  const name = post.author?.full_name || post.author?.username || 'Участник';
  const constellation =
    post.constellation?.label ||
    (post.constellation_id ? post.constellation_id : null);
  const when = timeAgo(post.created_at);

  return (
    <View style={styles.card}>
      <View style={styles.pad}>
        <View style={styles.head}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              <FontAwesome name="check-circle" size={13} color={feed.teal} />
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {constellation ? `в Созвездии ${constellation}` : 'в орбите Elara'}
              {when ? ` · ${when}` : ''}
            </Text>
          </View>
          <FontAwesome name="ellipsis-h" size={14} color="#9AA3AF" />
        </View>

        {post.content ? <Text style={styles.content}>{post.content}</Text> : null}
      </View>

      {mediaItems.length > 0 ? (
        <View style={styles.mediaStack}>
          {mediaItems.slice(0, 4).map((item, index) => {
            if (item.type === 'video') {
              return (
                <View
                  key={`${item.url}-${index}`}
                  style={[styles.videoStub, { width, height: Math.round(width * 0.45) }]}
                >
                  <FontAwesome name="play-circle" size={36} color="#fff" />
                  <Text style={styles.videoStubText}>Видео</Text>
                </View>
              );
            }
            const uri = resolveMediaUrl(item.url);
            if (!uri) return null;
            return (
              <Image
                key={`${item.url}-${index}`}
                source={{ uri }}
                style={[
                  styles.image,
                  {
                    width,
                    height: Math.round(width * (mediaItems.length > 1 ? 0.55 : 0.72)),
                  },
                ]}
              />
            );
          })}
        </View>
      ) : null}

      <View style={styles.pad}>
        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={onLike}>
            <FontAwesome
              name={post.liked_by_me ? 'heart' : 'heart-o'}
              size={18}
              color={post.liked_by_me ? '#ef4444' : '#6B7285'}
            />
            <Text style={styles.count}>{post.likes_count ?? 0}</Text>
          </Pressable>
          <View style={styles.action}>
            <FontAwesome name="comment-o" size={17} color="#6B7285" />
            <Text style={styles.count}>{post.comments_count ?? 0}</Text>
          </View>
          <FontAwesome name="bookmark-o" size={17} color="#6B7285" />
          <View style={{ flex: 1 }} />
          <FontAwesome name="paper-plane-o" size={16} color="#6B7285" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(15, 23, 42, 0.22)',
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
  },
  pad: {
    paddingHorizontal: 14,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    color: feed.text,
    fontWeight: '700',
    fontSize: 14,
  },
  meta: {
    color: '#8B95A5',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    color: feed.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  mediaStack: {
    gap: 2,
  },
  image: {
    backgroundColor: '#d1d5db',
  },
  videoStub: {
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  videoStubText: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingTop: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  count: {
    color: '#6B7285',
    fontSize: 12,
    fontWeight: '600',
  },
});
