import { chatAudioPlaySource } from '../config/api';
import { normalizeLocalUploadUri } from './chatMedia';
import type { VoicePlayMeta, VoiceTrack } from '../context/VoicePlaybackContext';

export function isPlayableVoiceMessage(item: {
  id?: string | number;
  type?: string;
  mime_type?: string;
  file_url?: string;
  file_name?: string;
  pending?: boolean;
}): boolean {
  if (item.pending) return false;
  if (String(item.id ?? '').startsWith('pending-')) return false;
  if (item.type === 'video_note') return false;
  if (item.type === 'voice') return Boolean(item.file_url || (item as { local_preview_uri?: string }).local_preview_uri);
  const mime = String(item.mime_type || '');
  if (mime.startsWith('audio/') && item.file_url) return true;
  const name = String(item.file_name || '');
  if (item.file_url && /\.(m4a|mp3|aac|ogg|wav|caf)$/i.test(name)) return true;
  return false;
}

export function buildVoiceTrackFromMessage(
  item: Record<string, unknown>,
  conversationId: number,
  token: string | null,
  opts: { userId?: number; userName?: string }
): VoiceTrack | null {
  if (!isPlayableVoiceMessage(item as Parameters<typeof isPlayableVoiceMessage>[0])) {
    return null;
  }
  const messageId = item.id as string | number;
  const fileUrl = item.file_url as string | undefined;
  const localPreviewUri = item.local_preview_uri as string | undefined;
  const source = localPreviewUri
    ? { uri: normalizeLocalUploadUri(localPreviewUri) }
    : chatAudioPlaySource(fileUrl, token);
  if (!source?.uri) return null;

  const isMe =
    opts.userId != null && item.sender_id != null && Number(item.sender_id) === Number(opts.userId);
  const senderName = (item.sender_name as string | undefined) || opts.userName;
  const createdAt = item.created_at as string | undefined;
  const timeLabel = createdAt
    ? new Date(createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : '';

  const meta: VoicePlayMeta = {
    senderLabel: isMe ? 'Вы' : (senderName?.trim() || 'Голосовое'),
    timeLabel,
  };

  return {
    messageId,
    conversationId,
    source,
    meta,
    fileUrl: fileUrl ?? null,
    localPreviewUri: localPreviewUri ?? null,
    createdAt: createdAt ?? null,
  };
}

export function compareMessageOrder(a: VoiceTrack, b: VoiceTrack): number {
  const idA = Number(a.messageId);
  const idB = Number(b.messageId);
  if (!Number.isNaN(idA) && !Number.isNaN(idB) && idA !== idB) return idA - idB;
  const tA = a.createdAt ? Date.parse(a.createdAt) : 0;
  const tB = b.createdAt ? Date.parse(b.createdAt) : 0;
  return tA - tB;
}
