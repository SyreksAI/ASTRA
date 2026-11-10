import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { apiPath, apiUploadPath } from '../config/api';

export async function downloadChatImageToCache(
  uri: string,
  authToken?: string | null
): Promise<string> {
  const local = `${FileSystem.cacheDirectory}chat-dl-${Date.now()}.jpg`;
  const needsAuth = uri.includes('/view') && authToken;
  const result = await FileSystem.downloadAsync(
    uri,
    local,
    needsAuth ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
  );
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`download_${result.status}`);
  }
  return result.uri || local;
}

export async function saveChatImageToGallery(
  uri: string,
  authToken?: string | null
): Promise<void> {
  const MediaLibrary = await import('expo-media-library');
  const perm = await MediaLibrary.requestPermissionsAsync(true);
  if (!perm.granted) {
    throw new Error('permission_denied');
  }
  let localUri = uri;
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    localUri = await downloadChatImageToCache(uri, authToken);
  }
  try {
    await MediaLibrary.createAssetAsync(localUri);
  } catch {
    await MediaLibrary.saveToLibraryAsync(localUri);
  }
}

const MAX_SIDE = 1280;
const JPEG_QUALITY = 0.72;

export function normalizeLocalUploadUri(uri: string): string {
  if (!uri) return uri;
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  return `file://${uri.replace(/^\/+/, '/')}`;
}

export function resolveUploadMimeType(uri: string, mimeType: string): string {
  const mime = (mimeType || '').trim().toLowerCase();
  if (mime && mime !== 'application/octet-stream') return mimeType;
  const path = uri.split('?')[0].toLowerCase();
  if (path.endsWith('.mov')) return 'video/quicktime';
  if (path.endsWith('.mp4') || path.endsWith('.m4v')) return 'video/mp4';
  if (path.endsWith('.m4a')) return 'audio/mp4';
  if (path.endsWith('.aac')) return 'audio/aac';
  if (path.endsWith('.mp3')) return 'audio/mpeg';
  if (path.endsWith('.caf')) return 'audio/x-caf';
  if (path.endsWith('.3gp')) return 'audio/3gpp';
  return mimeType || 'application/octet-stream';
}

/** Копирует запись в cache с расширением .m4a для корректного upload/sniff на сервере. */
export async function prepareChatVoiceForUpload(
  uri: string
): Promise<{ uri: string; mimeType: string }> {
  const normalized = normalizeLocalUploadUri(uri);
  const lower = normalized.split('?')[0].toLowerCase();
  if (/\.(m4a|mp4|aac|mp3)$/.test(lower)) {
    return {
      uri: normalized,
      mimeType: resolveUploadMimeType(normalized, 'audio/mp4'),
    };
  }
  const dest = `${FileSystem.cacheDirectory}voice-${Date.now()}.m4a`;
  await FileSystem.copyAsync({ from: normalized, to: dest });
  return { uri: dest, mimeType: 'audio/mp4' };
}

/** Ждём, пока файл записи стабилизируется (камера дописывает на диск). */
export async function waitUntilLocalFileReady(
  uri: string,
  minBytes = 512,
  attempts = 12,
  pauseMs = 100
): Promise<void> {
  const normalized = normalizeLocalUploadUri(uri);
  let lastSize = -1;
  for (let i = 0; i < attempts; i += 1) {
    const info = await FileSystem.getInfoAsync(normalized);
    const size =
      info.exists && typeof info.size === 'number' && Number.isFinite(info.size)
        ? info.size
        : 0;
    if (size >= minBytes && size === lastSize) return;
    lastSize = size;
    await new Promise((resolve) => setTimeout(resolve, pauseMs));
  }
  const info = await FileSystem.getInfoAsync(normalized);
  const size =
    info.exists && typeof info.size === 'number' && Number.isFinite(info.size)
      ? info.size
      : 0;
  if (!info.exists || size < minBytes) {
    throw new Error('video_not_ready');
  }
}

/** Копия видеокружка в cache с .mp4 и MIME для upload/sniff на сервере. */
export async function prepareChatVideoNoteForUpload(
  uri: string
): Promise<{ uri: string; mimeType: string }> {
  const normalized = normalizeLocalUploadUri(uri);
  await waitUntilLocalFileReady(normalized, 512, 8, 80);
  const lower = normalized.split('?')[0].toLowerCase();
  const hasVideoExt = /\.(mp4|mov|m4v|webm)$/.test(lower);
  const dest = `${FileSystem.cacheDirectory}vnote-${Date.now()}.mp4`;
  if (hasVideoExt && lower.endsWith('.mp4')) {
    const info = await FileSystem.getInfoAsync(normalized);
    if (info.exists && (info.size ?? 0) >= 512) {
      if ((info.size ?? 0) > 24 * 1024 * 1024) {
        throw new Error('video_too_large');
      }
      return {
        uri: normalized,
        mimeType: 'video/mp4',
      };
    }
  }
  await FileSystem.copyAsync({ from: normalized, to: dest });
  const copied = await FileSystem.getInfoAsync(dest);
  if (!copied.exists || (copied.size ?? 0) < 512) {
    throw new Error('empty_video');
  }
  if ((copied.size ?? 0) > 24 * 1024 * 1024) {
    throw new Error('video_too_large');
  }
  const guessed = resolveUploadMimeType(dest, 'video/mp4');
  return {
    uri: dest,
    mimeType: guessed.startsWith('video/') ? guessed : 'video/mp4',
  };
}

export async function prepareChatImageForUpload(
  uri: string,
  width?: number,
  height?: number
): Promise<{ uri: string; mimeType: string }> {
  const w = width ?? 0;
  const h = height ?? 0;
  const actions: ImageManipulator.Action[] = [];
  if (w > MAX_SIDE || h > MAX_SIDE) {
    if (w >= h) actions.push({ resize: { width: MAX_SIDE } });
    else actions.push({ resize: { height: MAX_SIDE } });
  }
  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return { uri: result.uri, mimeType: 'image/jpeg' };
}

export function isUploadTransportError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /failed to connect|ECONNREFUSED|Network request failed|timeout|timed out/i.test(msg);
}

/** Multipart upload; при недоступном UPLOAD URL повтор через основной API (nginx :80). */
export async function uploadChatAttachment(
  conversationId: string | number,
  localUri: string,
  token: string,
  mimeType: string
) {
  const rel = `/api/chat/conversations/${conversationId}/upload`;
  const primaryUrl = apiUploadPath(rel);
  const fallbackUrl = apiPath(rel);
  const options: FileSystem.FileSystemUploadOptions = {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    headers: { Authorization: `Bearer ${token}` },
    mimeType,
  };

  const run = (url: string) => FileSystem.uploadAsync(url, localUri, options);

  const parseResult = (res: FileSystem.FileSystemUploadResult) => {
    if (res.status >= 200 && res.status < 300) return res;
    throw new Error(`upload_${res.status}:${res.body?.slice?.(0, 200) || ''}`);
  };

  try {
    return parseResult(await run(primaryUrl));
  } catch (err) {
    const canFallback = primaryUrl !== fallbackUrl;
    if (canFallback && isUploadTransportError(err)) {
      return parseResult(await run(fallbackUrl));
    }
    throw err;
  }
}
