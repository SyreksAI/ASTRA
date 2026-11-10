import type { ChatMessage } from '../types';

export function dedupeMessagesById(msgs: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  const out: ChatMessage[] = [];
  for (let i = msgs.length - 1; i >= 0; i -= 1) {
    const m = msgs[i];
    const key = String(m.id);
    if (seen.has(key)) continue;
    seen.add(key);
    out.unshift(m);
  }
  return out;
}

export function mergeChatMessage(
  prev: ChatMessage[],
  saved: ChatMessage,
  pendingId?: string | null
): ChatMessage[] {
  const next = pendingId
    ? prev.filter((m) => String(m.id) !== String(pendingId))
    : [...prev];
  if (next.some((m) => String(m.id) === String(saved.id))) return dedupeMessagesById(next);
  return dedupeMessagesById([...next, saved]);
}

export function appendWsMessage(prev: ChatMessage[], msg: ChatMessage, myUserId?: number): ChatMessage[] {
  let next = prev;
  if (myUserId != null && msg.sender_id === myUserId) {
    next = next.filter((m) => !String(m.id).startsWith('pending-'));
  }
  if (next.some((m) => String(m.id) === String(msg.id))) return next;
  return dedupeMessagesById([...next, msg]);
}

type MediaHint = {
  mime_type?: string;
  file_name?: string;
  file_url?: string;
  local_preview_uri?: string;
};

export function isVideoMediaHint(item: MediaHint): boolean {
  const mime = String(item.mime_type || '').toLowerCase();
  if (mime.startsWith('video/')) return true;
  const blob = [
    String(item.file_name || ''),
    String(item.file_url || ''),
    String(item.local_preview_uri || ''),
  ].join(' ');
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(blob) || /\/chat\/[a-f0-9]+\.mp4/i.test(blob);
}

export function normalizeChatMessage(raw: Record<string, unknown>): ChatMessage {
  const m = { ...raw } as ChatMessage;
  const type = String(m.type ?? '');
  if ((!type || type === 'file') && isVideoMediaHint(m as MediaHint)) {
    m.type = 'video_note';
  }
  return m;
}

export function isChatImageMessage(item: {
  file_url?: string;
  type?: string;
  mime_type?: string;
  file_name?: string;
  local_preview_uri?: string;
  media_duration?: number | null;
}): boolean {
  const type = String(item.type || '');
  if (type === 'video_note' || type === 'video' || type === 'voice') return false;
  if (isVideoMediaHint(item)) return false;
  const local = String(item.local_preview_uri || '');
  if (local && isVideoMediaHint({ local_preview_uri: local })) return false;
  return (
    (Boolean(item.local_preview_uri) &&
      !isVideoMediaHint({ local_preview_uri: item.local_preview_uri })) ||
    Boolean(
      item.file_url &&
        (item.type === 'image' ||
          String(item.mime_type || '').startsWith('image/') ||
          /\.(jpe?g|png|gif|webp|heic)$/i.test(String(item.file_name || '')))
    )
  );
}

export function isChatVideoNoteMessage(item: {
  file_url?: string;
  type?: string;
  mime_type?: string;
  file_name?: string;
  media_width?: number | null;
  media_height?: number | null;
  media_duration?: number | null;
  pending?: boolean;
  local_preview_uri?: string;
  text?: string;
}): boolean {
  const type = String(item.type || '');
  if (type === 'video_note') return true;
  if (item.pending && (type === 'video_note' || isVideoMediaHint(item))) return true;
  if (item.local_preview_uri && (type === 'video_note' || isVideoMediaHint(item))) return true;

  const hasFile = Boolean(item.file_url || item.local_preview_uri);
  if (hasFile && isVideoMediaHint(item)) return true;

  if (
    item.media_duration != null &&
    item.media_duration > 0 &&
    hasFile &&
    !String(item.mime_type || '').startsWith('audio/') &&
    type !== 'voice' &&
    type !== 'image'
  ) {
    return true;
  }

  if ((type === 'video' || type === 'file') && (isVideoMediaHint(item) || item.media_duration)) {
    return true;
  }

  if (/video-note|vnote-/i.test(String(item.file_name || ''))) return true;

  const w = Number(item.media_width);
  const h = Number(item.media_height);
  if (
    String(item.mime_type || '').startsWith('video/') &&
    Number.isFinite(w) &&
    Number.isFinite(h) &&
    w > 0 &&
    Math.abs(w - h) <= Math.max(w, h) * 0.12
  ) {
    return true;
  }
  if (
    type === 'video' &&
    Number.isFinite(w) &&
    Number.isFinite(h) &&
    w > 0 &&
    Math.abs(w - h) <= Math.max(w, h) * 0.12
  ) {
    return true;
  }

  if (
    item.media_duration != null &&
    item.media_duration > 0 &&
    !String(item.text || '').trim() &&
    type !== 'voice' &&
    type !== 'image'
  ) {
    return true;
  }

  return false;
}

export function isChatAudioMessage(item: {
  file_url?: string;
  type?: string;
  mime_type?: string;
  file_name?: string;
  text?: string;
  pending?: boolean;
}): boolean {
  if (item.type === 'video_note') return false;
  if (item.type === 'voice') return true;
  const mime = String(item.mime_type || '');
  if (mime.startsWith('audio/')) return true;
  const name = String(item.file_name || '');
  if (item.file_url && /\.(m4a|mp3|aac|ogg|wav|caf)$/i.test(name)) return true;
  if (item.pending && item.type === 'voice') return true;
  return false;
}
