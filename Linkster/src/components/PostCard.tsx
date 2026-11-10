import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { timeAgo } from '../utils/dateUtils';
import { apiPath, mediaUrl } from '../config/api';
import { useAuth } from '../context/AuthContext';

export type PostAuthor = {
  username?: string;
  full_name?: string;
  avatar?: string;
};

export type PostItem = {
  id: number;
  content?: string;
  image?: string;
  created_at?: string;
  author?: PostAuthor;
  likes_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
  reposts_count?: number;
  views_count?: number;
};

type Props = {
  post: PostItem;
  isDark: boolean;
  onPressComments: (post: PostItem) => void;
  onPressAuthor?: (username: string) => void;
  onCommentCountChange?: (postId: number, delta: number) => void;
};

export default function PostCard({
  post,
  isDark,
  onPressComments,
  onPressAuthor,
}: Props) {
  const { token } = useAuth();
  const [liked, setLiked] = useState(!!post.liked_by_me);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);

  const author = post.author || {};
  const username = author.username || 'user';

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    try {
      const res = await fetch(apiPath(`/api/posts/${post.id}/like`), {
        method: next ? 'POST' : 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('like failed');
      const data = await res.json();
      setLiked(!!data.liked_by_me);
      setLikesCount(data.likes_count ?? 0);
    } catch {
      setLiked(!next);
      setLikesCount((c) => (next ? Math.max(0, c - 1) : c + 1));
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${author.full_name || username}: ${post.content || ''}`.trim(),
      });
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={[styles.postItem, isDark && styles.postItemDark]}>
      <TouchableOpacity
        style={styles.postHeader}
        activeOpacity={0.7}
        onPress={() => author.username && onPressAuthor?.(author.username)}
      >
        <View style={[styles.avatar, isDark && styles.avatarDark]}>
          {author.avatar ? (
            <Image source={{ uri: mediaUrl(author.avatar) ?? undefined }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarFallback}>{username[0]?.toUpperCase() || 'U'}</Text>
          )}
        </View>
        <View style={styles.postInfo}>
          <Text style={[styles.authorName, isDark && styles.textDark]}>
            {author.full_name || author.username || 'Пользователь'}
          </Text>
          <Text style={[styles.authorHandle, isDark && styles.textMutedDark]}>
            @{username} · {timeAgo(post.created_at)}
          </Text>
        </View>
      </TouchableOpacity>

      {!!post.content && (
        <Text style={[styles.postContent, isDark && styles.textDark]}>{post.content}</Text>
      )}

      {post.image ? (
        <Image source={{ uri: mediaUrl(post.image) ?? undefined }} style={styles.postImage} />
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onPressComments(post)}>
          <Ionicons name="chatbubble-outline" size={18} color={isDark ? '#71767b' : '#536471'} />
          <Text style={[styles.actionText, isDark && styles.textMutedDark]}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="paper-plane-outline" size={18} color={isDark ? '#71767b' : '#536471'} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? '#f91880' : isDark ? '#71767b' : '#536471'}
          />
          <Text style={[styles.actionText, liked && styles.likedText]}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => Alert.alert('Astra', 'Статистика просмотров скоро')}
        >
          <Ionicons name="stats-chart-outline" size={18} color={isDark ? '#71767b' : '#536471'} />
          <Text style={[styles.actionText, isDark && styles.textMutedDark]}>
            {post.views_count || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postItem: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)' },
  postItemDark: { borderBottomColor: '#2f3336' },
  postHeader: { flexDirection: 'row', marginBottom: 8 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1d9bf0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarDark: { backgroundColor: '#7856ff' },
  avatarImage: { width: '100%', height: '100%' },
  avatarFallback: { color: '#fff', fontWeight: '700', fontSize: 17 },
  postInfo: { flex: 1, justifyContent: 'center' },
  authorName: { fontSize: 15, fontWeight: '800', color: '#0f1419' },
  authorHandle: { fontSize: 14, color: '#536471', marginTop: 2 },
  postContent: { fontSize: 16, lineHeight: 22, color: '#0f1419', marginBottom: 12 },
  postImage: { width: '100%', height: 220, borderRadius: 16, marginBottom: 12, backgroundColor: '#eee' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  actionText: { fontSize: 14, color: '#536471' },
  likedText: { color: '#f91880' },
  textDark: { color: '#e7e9ea' },
  textMutedDark: { color: '#71767b' },
});
