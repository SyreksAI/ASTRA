import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export const API_BASE_STORAGE_KEY = 'astra_api_base_url';

/** IP ПК из Expo Go (тот же, что у Metro), чтобы телефон не ходил на localhost */
function inferDevLanHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
  if (!hostUri) return null;
  const host = String(hostUri).split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

function isLocalOnlyApiHost(base: string): boolean {
  try {
    const host = new URL(base).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2';
  } catch {
    return false;
  }
}

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new Error('Адрес сервера не может быть пустым');
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return trimmed;
}

function defaultFromEnv(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return normalizeBaseUrl(fromEnv);
  }
  const lan = inferDevLanHost();
  if (lan) {
    // nginx на :80 — с телефона чаще проходит firewall, чем прямой :8000
    return `http://${lan}`;
  }
  // Эмулятор Android: nginx на хосте или backend напрямую
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2';
  }
  return 'http://localhost';
}

let runtimeBaseUrl = defaultFromEnv();

export function getApiBaseUrl(): string {
  return runtimeBaseUrl;
}

export async function loadApiBaseUrl(): Promise<string> {
  const devDefault = defaultFromEnv();
  try {
    const saved = await AsyncStorage.getItem(API_BASE_STORAGE_KEY);
    if (saved?.trim()) {
      const normalized = normalizeBaseUrl(saved);
      if (isLocalOnlyApiHost(normalized) && !isLocalOnlyApiHost(devDefault)) {
        runtimeBaseUrl = devDefault;
        await AsyncStorage.setItem(API_BASE_STORAGE_KEY, runtimeBaseUrl).catch(() => {});
        return runtimeBaseUrl;
      }
      // Раньше был :8000 — с телефона часто не проходит; пробуем nginx :80
      if (normalized.includes(':8000') && devDefault && !devDefault.includes(':8000')) {
        runtimeBaseUrl = devDefault;
        await AsyncStorage.setItem(API_BASE_STORAGE_KEY, runtimeBaseUrl).catch(() => {});
        return runtimeBaseUrl;
      }
      runtimeBaseUrl = normalized;
      return runtimeBaseUrl;
    }
  } catch {
    /* ignore */
  }
  runtimeBaseUrl = devDefault;
  return runtimeBaseUrl;
}

export async function saveApiBaseUrl(raw: string): Promise<string> {
  runtimeBaseUrl = normalizeBaseUrl(raw);
  await AsyncStorage.setItem(API_BASE_STORAGE_KEY, runtimeBaseUrl);
  return runtimeBaseUrl;
}

/** Путь с бэкенда (/uploads/...) → полный URL для Image */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = String(path).trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = getApiBaseUrl().replace(/\/+$/, '');
  return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

/** Дефолтный аватар в БД — не реальный файл на CDN/nginx */
export function isPlaceholderAvatar(path: string | null | undefined): boolean {
  if (!path) return true;
  const p = String(path).trim().toLowerCase();
  if (!p || p === 'null' || p === 'undefined') return true;
  return p.includes('default-avatar');
}

/** URL аватара пользователя для Image (null → показать букву) */
export function avatarImageUri(path: string | null | undefined): string | null {
  if (isPlaceholderAvatar(path)) return null;
  return mediaUrl(path);
}

export function apiPath(path: string): string {
  const base = getApiBaseUrl();
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * URL для multipart upload. По умолчанию тот же хост, что и API (nginx :80).
 * EXPO_PUBLIC_UPLOAD_API_URL — только если отдельный upload-endpoint реально доступен с телефона.
 */
export function apiUploadPath(path: string): string {
  const fromEnv = process.env.EXPO_PUBLIC_UPLOAD_API_URL?.trim();
  if (fromEnv) {
    const base = normalizeBaseUrl(fromEnv);
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return apiPath(path);
}

/** Превью вложений чата через Bearer (не истекает как access_token в query) */
export function chatFileUploadId(fileUrl: string): number | null {
  const uploadRef = fileUrl.match(/^upload:(\d+)$/);
  if (uploadRef) return Number(uploadRef[1]);
  const apiRef = fileUrl.match(/\/api\/chat\/files\/(\d+)/);
  if (apiRef) return Number(apiRef[1]);
  return null;
}

/** Подписанная ссылка из API — грузится в Image без Authorization */
/** URL картинки в чате — как на вебе: mediaUrl(file_url) с access_token в query */
export function chatMessageImageUri(
  fileUrl: string | null | undefined,
  localPreview?: string | null
): string | null {
  if (localPreview) return localPreview;
  if (!fileUrl) return null;
  return mediaUrl(String(fileUrl));
}

export function chatImageSignedUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  const raw = String(fileUrl);
  if (raw.includes('access_token=')) {
    return mediaUrl(raw);
  }
  return null;
}

/** Абсолютный URL видеокружка (для превью / expo-video-thumbnails). */
export function chatVideoNoteMediaUri(
  fileUrl: string | null | undefined,
  localPreview?: string | null,
  authToken?: string | null
): string | null {
  if (localPreview) {
    const p = localPreview.trim();
    if (p.startsWith('file://') || p.startsWith('content://')) return p;
    return `file://${p.replace(/^\/+/, '/')}`;
  }
  const src = chatAudioPlaySource(fileUrl, authToken ?? null);
  return src?.uri ?? null;
}

/** Источник для expo-audio (Bearer на /view или подписанный URL). */
export function chatAudioPlaySource(
  fileUrl: string | null | undefined,
  authToken: string | null | undefined
): { uri: string; headers?: Record<string, string> } | null {
  if (!fileUrl) return null;
  const signed = chatImageSignedUrl(fileUrl);
  if (signed) {
    return { uri: signed };
  }
  const uploadId = chatFileUploadId(String(fileUrl));
  if (uploadId != null && authToken) {
    return {
      uri: apiPath(`/api/chat/files/${uploadId}/view`),
      headers: { Authorization: `Bearer ${authToken}` },
    };
  }
  const absolute = mediaUrl(String(fileUrl));
  return absolute ? { uri: absolute } : null;
}

export function chatImageViewUrl(
  fileUrl: string | null | undefined,
  authToken: string | null | undefined
): string | null {
  if (!fileUrl) return null;
  const signed = chatImageSignedUrl(fileUrl);
  if (signed) return signed;
  if (!authToken) return null;
  const uploadId = chatFileUploadId(String(fileUrl));
  if (uploadId != null) {
    return apiPath(`/api/chat/files/${uploadId}/view`);
  }
  const path = String(fileUrl);
  if (path.includes('/uploads/chat/')) {
    return null;
  }
  return mediaUrl(fileUrl);
}

export async function fetchChatFileAccessUrl(
  uploadId: number,
  authToken: string
): Promise<string> {
  const res = await fetchWithTimeout(
    apiPath(`/api/chat/files/${uploadId}/access-url`),
    { headers: { Authorization: `Bearer ${authToken}` } },
    15000
  );
  if (!res.ok) throw new Error(`access_url_${res.status}`);
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error('access_url_empty');
  return data.url;
}

const DEFAULT_FETCH_TIMEOUT_MS = 25000;

function isFetchCanceled(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return err.name === 'AbortError' || msg.includes('cancel') || msg.includes('abort');
}

function isNetworkUnreachable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes('network request failed') || msg.includes('failed to connect');
}

function buildFetchError(err: unknown, base: string, timeoutMs: number): Error {
  if (isFetchCanceled(err)) {
    return new Error(
      `Запрос прерван (${base}). Подождите без перезагрузки Expo, проверьте Wi‑Fi или укажите http://IP_ПК без :8000.`
    );
  }
  if (isNetworkUnreachable(err)) {
    return new Error(
      `Не удалось подключиться к ${base}. Тот же Wi‑Fi? В браузере телефона: ${base}/health`
    );
  }
  const detail = err instanceof Error ? err.message : String(err);
  return new Error(`Нет связи с ${base}. ${detail}`);
}

/** Не даёт запросу висеть минутами при недоступном сервере */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    throw buildFetchError(err, getApiBaseUrl(), timeoutMs);
  } finally {
    clearTimeout(timer);
  }
}

/** Повтор при обрыве (Metro reload, краткий сбой Wi‑Fi) */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
  retries = 1
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchWithTimeout(url, init, timeoutMs);
    } catch (err) {
      lastError = err;
      if (attempt < retries && (isFetchCanceled(err) || isNetworkUnreachable(err))) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export function chatWebSocketUrl(token: string): string {
  const base = getApiBaseUrl();
  const wsProtocol = base.startsWith('https') ? 'wss' : 'ws';
  const wsHost = base.replace(/^https?:\/\//i, '');
  return `${wsProtocol}://${wsHost}/api/chat/ws?token=${encodeURIComponent(token)}`;
}
