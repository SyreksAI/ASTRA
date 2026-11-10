import { API_BASE_URL } from './config';

export type ApiUser = {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  bio?: string | null;
  avatar?: string | null;
  cover_image?: string | null;
  created_at?: string;
  preferences?: Record<string, unknown> | null;
};

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  if (Array.isArray(body?.detail)) {
    return body.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join('. ') || fallback;
  }
  if (typeof body?.detail === 'string') return body.detail;
  return fallback;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await fetch(url, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(await readError(res, `Request failed (${res.status})`));
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function resolveMediaUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
