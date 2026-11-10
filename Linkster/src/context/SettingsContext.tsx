import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPath } from '../config/api';
import {
  DEFAULT_APP_SETTINGS,
  mergeAppSettings,
  normalizeAppSettings,
  type AppSettings,
} from '../settings/appSettings';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'app_settings_v1';

type SettingsContextValue = {
  settings: AppSettings;
  ready: boolean;
  patchSettings: (patch: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

async function postAppSettings(token: string, patch: Partial<AppSettings>) {
  const response = await fetch(apiPath('/api/theme'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ app_settings: patch }),
  });
  if (!response.ok) throw new Error('settings sync failed');
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          setSettings(normalizeAppSettings(JSON.parse(raw)));
        }
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token || !ready) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiPath('/api/theme'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { app_settings?: unknown };
        if (data.app_settings) {
          const merged = normalizeAppSettings(data.app_settings);
          setSettings(merged);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
        }
      } catch {
        /* offline */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, ready]);

  const persistLocal = useCallback(async (next: AppSettings) => {
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const patchSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      let next = settings;
      setSettings((prev) => {
        next = mergeAppSettings(prev, patch);
        return next;
      });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      if (token) {
        try {
          await postAppSettings(token, patch);
        } catch {
          /* local save kept */
        }
      }
    },
    [settings, token]
  );

  const resetSettings = useCallback(async () => {
    await persistLocal(DEFAULT_APP_SETTINGS);
    if (token) {
      try {
        await postAppSettings(token, DEFAULT_APP_SETTINGS);
      } catch {
        /* ignore */
      }
    }
  }, [persistLocal, token]);

  const value = useMemo(
    () => ({ settings, ready, patchSettings, resetSettings }),
    [settings, ready, patchSettings, resetSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
