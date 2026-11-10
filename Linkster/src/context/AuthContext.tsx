// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import {
  apiPath,
  apiUploadPath,
  fetchWithRetry,
  fetchWithTimeout,
  getApiBaseUrl,
  loadApiBaseUrl,
  saveApiBaseUrl,
} from '../config/api';
import { parseApiErrorBody } from '../utils/apiErrors';
import { isUploadTransportError, prepareChatImageForUpload } from '../utils/chatMedia';
import SystemChromeTheme from '../components/SystemChromeTheme';
import { isAppLanguage, type AppLanguage } from '../i18n/appLanguage';
import { isAccentPresetId, type AccentPresetId } from '../theme/accentPresets';
import { applyAccentPreset } from '../theme/talkTheme';

export type AuthUser = Record<string, unknown> & {
  username?: string;
  avatar?: string;
  cover_image?: string;
  preferences?: { theme?: string; language?: string; accent?: string };
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  token: string | null;
  theme: string;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Record<string, unknown>) => Promise<unknown>;
  logout: () => Promise<void>;
  updateProfile: (profile: Record<string, unknown>) => Promise<AuthUser>;
  uploadProfileImage: (
    file: { uri: string; mimeType?: string; width?: number; height?: number },
    imageKind: string
  ) => Promise<boolean>;
  updateTheme: (theme: 'light' | 'dark') => Promise<void>;
  language: AppLanguage;
  accentPreset: AccentPresetId;
  updateLanguage: (language: AppLanguage) => Promise<void>;
  updateAccentPreset: (preset: AccentPresetId) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
};

const THEME_KEY = 'theme';
const LANGUAGE_KEY = 'app_language';
const ACCENT_KEY = 'app_accent';
const USER_CACHE_KEY = 'auth_user_cache';

function appearanceFromPreferences(
  prefs: Record<string, unknown> | undefined
): { language: AppLanguage; accent: AccentPresetId } {
  const language = isAppLanguage(prefs?.language) ? prefs.language : 'ru';
  const accent = isAccentPresetId(prefs?.accent) ? prefs.accent : 'linkster';
  return { language, accent };
}

function applyLocalAppearance(language: AppLanguage, accent: AccentPresetId) {
  applyAccentPreset(accent);
}
const AUTH_ME_TIMEOUT_MS = 4000;
const AUTH_ME_TIMEOUT_CACHED_MS = 8000;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const persistUserCache = async (profile: AuthUser | null) => {
  if (!profile) {
    await AsyncStorage.removeItem(USER_CACHE_KEY).catch(() => {});
    return;
  }
  await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(profile)).catch(() => {});
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

const readApiError = async (response: Response, fallback: string): Promise<string> => {
  const body = await response.json().catch(() => null);
  return parseApiErrorBody(body, fallback);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState<AppLanguage>('ru');
  const [accentPreset, setAccentPreset] = useState<AccentPresetId>('linkster');
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBaseUrl());

  const setApiBaseUrl = useCallback(async (url: string) => {
    const saved = await saveApiBaseUrl(url);
    setApiBaseUrlState(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      let finishBootCalled = false;
      let hadCachedUser = false;
      const finishBoot = () => {
        if (!cancelled && !finishBootCalled) {
          finishBootCalled = true;
          setLoading(false);
        }
      };

      try {
        const [base, pairs] = await Promise.all([
          loadApiBaseUrl(),
          AsyncStorage.multiGet([THEME_KEY, LANGUAGE_KEY, ACCENT_KEY, 'token', USER_CACHE_KEY]),
        ]);
        if (cancelled) {
          finishBoot();
          return;
        }
        setApiBaseUrlState(base);

        const map = Object.fromEntries(pairs);
        const savedTheme = map[THEME_KEY];
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
        }

        const savedLanguage = map[LANGUAGE_KEY];
        const savedAccent = map[ACCENT_KEY];
        let bootLanguage: AppLanguage = 'ru';
        let bootAccent: AccentPresetId = 'linkster';
        if (isAppLanguage(savedLanguage)) {
          bootLanguage = savedLanguage;
          setLanguage(savedLanguage);
        }
        if (isAccentPresetId(savedAccent)) {
          bootAccent = savedAccent;
          setAccentPreset(savedAccent);
        }
        applyLocalAppearance(bootLanguage, bootAccent);

        const savedToken = map.token;
        if (!savedToken) {
          finishBoot();
          return;
        }

        setToken(savedToken);

        const cachedRaw = map[USER_CACHE_KEY];
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as AuthUser;
            hadCachedUser = true;
            setUser(cached);
            if (cached.preferences?.theme && savedTheme !== 'dark' && savedTheme !== 'light') {
              setTheme(cached.preferences.theme);
            }
            const fromCache = appearanceFromPreferences(
              cached.preferences as Record<string, unknown> | undefined
            );
            setLanguage(fromCache.language);
            setAccentPreset(fromCache.accent);
            applyLocalAppearance(fromCache.language, fromCache.accent);
            await AsyncStorage.multiSet([
              [LANGUAGE_KEY, fromCache.language],
              [ACCENT_KEY, fromCache.accent],
            ]).catch(() => {});
          } catch {
            await AsyncStorage.removeItem(USER_CACHE_KEY).catch(() => {});
          }
        }

        // UI сразу (спиннер / чаты из кэша), проверка /api/auth/me — в фоне
        finishBoot();

        const res = await fetchWithTimeout(
          apiPath('/api/auth/me'),
          { headers: { Authorization: `Bearer ${savedToken}` } },
          hadCachedUser ? AUTH_ME_TIMEOUT_CACHED_MS : AUTH_ME_TIMEOUT_MS
        );

        if (!res.ok) {
          await AsyncStorage.multiRemove(['token', USER_CACHE_KEY]).catch(() => {});
          if (!cancelled) {
            setToken(null);
            setUser(null);
          }
          return;
        }

        const data = (await res.json()) as AuthUser;
        if (!cancelled) {
          setUser(data);
          await persistUserCache(data);
          if (data.preferences?.theme) {
            setTheme(data.preferences.theme);
            await AsyncStorage.setItem(THEME_KEY, data.preferences.theme).catch(() => {});
          }
          const fromServer = appearanceFromPreferences(
            data.preferences as Record<string, unknown> | undefined
          );
          setLanguage(fromServer.language);
          setAccentPreset(fromServer.accent);
          applyLocalAppearance(fromServer.language, fromServer.accent);
          await AsyncStorage.multiSet([
            [LANGUAGE_KEY, fromServer.language],
            [ACCENT_KEY, fromServer.accent],
          ]).catch(() => {});
        }
      } catch {
        if (!hadCachedUser) {
          await AsyncStorage.multiRemove(['token', USER_CACHE_KEY]).catch(() => {});
          if (!cancelled) {
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        finishBoot();
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    let response: Response;
    try {
      response = await fetchWithRetry(apiPath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error('Не удалось подключиться к серверу. Проверьте адрес и сеть.');
    }

    if (!response.ok) {
      const msg = await readApiError(response, 'Неверный email или пароль');
      throw new Error(msg === 'Invalid email or password' ? 'Неверный email или пароль' : msg);
    }

    const data = await response.json();

    await AsyncStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    await persistUserCache(data.user as AuthUser);

    const savedTheme = await AsyncStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    } else if (data.user?.preferences?.theme) {
      setTheme(data.user.preferences.theme);
      await AsyncStorage.setItem(THEME_KEY, data.user.preferences.theme);
    }

    const fromUser = appearanceFromPreferences(
      data.user?.preferences as Record<string, unknown> | undefined
    );
    setLanguage(fromUser.language);
    setAccentPreset(fromUser.accent);
    applyLocalAppearance(fromUser.language, fromUser.accent);
    await AsyncStorage.multiSet([
      [LANGUAGE_KEY, fromUser.language],
      [ACCENT_KEY, fromUser.accent],
    ]).catch(() => {});
  };

  const register = async (userData: Record<string, unknown>) => {
    const payload = { ...userData };
    if (payload.full_name === undefined || payload.full_name === '') {
      delete payload.full_name;
    }

    let response: Response;
    try {
      response = await fetchWithRetry(apiPath('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error('Не удалось подключиться к серверу. Проверьте адрес и сеть.');
    }

    if (!response.ok) {
      throw new Error(await readApiError(response, 'Ошибка регистрации'));
    }

    const data = await response.json();

    await AsyncStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    await persistUserCache(data.user as AuthUser);

    const savedTheme = await AsyncStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    } else {
      setTheme('light');
      await AsyncStorage.setItem(THEME_KEY, 'light');
    }

    return data;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', USER_CACHE_KEY]);
    setToken(null);
    setUser(null);
    setTheme('light');
    await AsyncStorage.setItem(THEME_KEY, 'light');
  };

  const postAppearancePrefs = async (body: Record<string, string>) => {
    const currentToken = await AsyncStorage.getItem('token');
    if (!currentToken) return;
    const response = await fetch(apiPath('/api/theme'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('prefs save failed');
  };

  const updateTheme = async (next: 'light' | 'dark') => {
    const prev = theme;
    setTheme(next);
    await AsyncStorage.setItem(THEME_KEY, next);
    try {
      await postAppearancePrefs({ theme: next });
      setUser((u) =>
        u ? { ...u, preferences: { ...u.preferences, theme: next } } : u
      );
    } catch {
      setTheme(prev === 'dark' ? 'dark' : 'light');
      await AsyncStorage.setItem(THEME_KEY, prev);
      throw new Error('Не удалось сохранить тему');
    }
  };

  const updateLanguage = async (next: AppLanguage) => {
    const prev = language;
    setLanguage(next);
    await AsyncStorage.setItem(LANGUAGE_KEY, next);
    applyLocalAppearance(next, accentPreset);
    try {
      await postAppearancePrefs({ language: next });
      setUser((u) =>
        u ? { ...u, preferences: { ...u.preferences, language: next } } : u
      );
    } catch {
      setLanguage(prev);
      await AsyncStorage.setItem(LANGUAGE_KEY, prev);
      applyLocalAppearance(prev, accentPreset);
      throw new Error('Не удалось сохранить язык');
    }
  };

  const updateAccentPreset = async (next: AccentPresetId) => {
    const prev = accentPreset;
    setAccentPreset(next);
    await AsyncStorage.setItem(ACCENT_KEY, next);
    applyLocalAppearance(language, next);
    try {
      await postAppearancePrefs({ accent: next });
      setUser((u) =>
        u ? { ...u, preferences: { ...u.preferences, accent: next } } : u
      );
    } catch {
      setAccentPreset(prev);
      await AsyncStorage.setItem(ACCENT_KEY, prev);
      applyLocalAppearance(language, prev);
      throw new Error('Не удалось сохранить цвет');
    }
  };

  const updateProfile = async (profile: Record<string, unknown>) => {
    const currentToken = await AsyncStorage.getItem('token');
    const response = await fetch(apiPath('/api/auth/me'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, 'Не удалось сохранить профиль'));
    }

    const updatedUser = (await response.json()) as AuthUser;
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
    await persistUserCache(updatedUser);
    return updatedUser;
  };

  const refreshUser = useCallback(async () => {
    const currentToken = await AsyncStorage.getItem('token');
    if (!currentToken) return;
    try {
      const meRes = await fetch(apiPath('/api/auth/me'), {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (!meRes.ok) return;
      const freshUser = (await meRes.json()) as AuthUser;
      setUser(freshUser);
      await persistUserCache(freshUser);
    } catch {
      /* ignore */
    }
  }, []);

  const uploadProfileImage = async (
    file: { uri: string; mimeType?: string; width?: number; height?: number },
    imageKind: string
  ) => {
    if (!file?.uri) throw new Error('Файл не выбран');

    const currentToken = await AsyncStorage.getItem('token');
    if (!currentToken) throw new Error('Нет авторизации');

    const prepared = await prepareChatImageForUpload(file.uri, file.width, file.height);
    const rel = `/api/auth/me/${imageKind}`;
    const primaryUrl = apiUploadPath(rel);
    const fallbackUrl = apiPath(rel);

    const uploadOptions: FileSystem.FileSystemUploadOptions = {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
      mimeType: 'image/jpeg',
    };

    const parseUpload = (response: FileSystem.FileSystemUploadResult) => {
      if (response.status >= 200 && response.status < 300) return response;
      let detail = `Ошибка сервера: ${response.status}`;
      try {
        const body = response.body ? JSON.parse(response.body) : null;
        detail = parseApiErrorBody(body, detail);
      } catch {
        if (response.body) detail = response.body.slice(0, 200);
      }
      throw new Error(detail);
    };

    const runUpload = (url: string) =>
      FileSystem.uploadAsync(url, prepared.uri, uploadOptions).then(parseUpload);

    try {
      await runUpload(primaryUrl);
    } catch (err) {
      if (primaryUrl !== fallbackUrl && isUploadTransportError(err)) {
        await runUpload(fallbackUrl);
      } else {
        throw err;
      }
    }

    const meRes = await fetchWithTimeout(
      apiPath('/api/auth/me'),
      { headers: { Authorization: `Bearer ${currentToken}` } },
      10000
    );
    if (meRes.ok) {
      const freshUser = (await meRes.json()) as AuthUser;
      setUser(freshUser);
      await persistUserCache(freshUser);
    }

    return true;
  };

  const value: AuthContextValue = {
    user,
    loading,
    token,
    theme,
    apiBaseUrl,
    setApiBaseUrl,
    login,
    register,
    logout,
    updateProfile,
    uploadProfileImage,
    updateTheme,
    language,
    accentPreset,
    updateLanguage,
    updateAccentPreset,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      <SystemChromeTheme />
      {children}
    </AuthContext.Provider>
  );
};
