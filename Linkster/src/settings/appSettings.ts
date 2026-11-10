export type ChatWallpaperId = 'solid' | 'outline' | 'dots';

export type ChatFontScale = 'small' | 'medium' | 'large';

export type AutoDownloadPolicy = 'wifi' | 'always' | 'never';

export type AppSettings = {
  notifications: {
    messages: boolean;
    calls: boolean;
    reactions: boolean;
    preview: boolean;
    sound: boolean;
  };
  privacy: {
    showOnline: boolean;
    showLastSeen: boolean;
    showReadReceipts: boolean;
    allowFindByUsername: boolean;
  };
  chats: {
    wallpaper: ChatWallpaperId;
    fontScale: ChatFontScale;
    sendOnEnter: boolean;
    swipeToReply: boolean;
  };
  calls: {
    autoAnswer: boolean;
    noiseSuppression: boolean;
    preferVideo: boolean;
  };
  data: {
    autoDownloadPhotos: AutoDownloadPolicy;
    autoDownloadVideos: AutoDownloadPolicy;
    autoDownloadFiles: AutoDownloadPolicy;
  };
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  notifications: {
    messages: true,
    calls: true,
    reactions: true,
    preview: true,
    sound: true,
  },
  privacy: {
    showOnline: true,
    showLastSeen: true,
    showReadReceipts: true,
    allowFindByUsername: true,
  },
  chats: {
    wallpaper: 'outline',
    fontScale: 'medium',
    sendOnEnter: false,
    swipeToReply: true,
  },
  calls: {
    autoAnswer: false,
    noiseSuppression: true,
    preferVideo: false,
  },
  data: {
    autoDownloadPhotos: 'wifi',
    autoDownloadVideos: 'wifi',
    autoDownloadFiles: 'never',
  },
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function mergeSection<T extends Record<string, unknown>>(defaults: T, patch: unknown): T {
  if (!isRecord(patch)) return { ...defaults };
  const out = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const val = patch[key as string];
    if (val !== undefined && val !== null) {
      out[key] = val as T[keyof T];
    }
  }
  return out;
}

export function normalizeAppSettings(raw: unknown): AppSettings {
  const base = DEFAULT_APP_SETTINGS;
  if (!isRecord(raw)) return { ...base };
  return {
    notifications: mergeSection(base.notifications, raw.notifications),
    privacy: mergeSection(base.privacy, raw.privacy),
    chats: mergeSection(base.chats, raw.chats),
    calls: mergeSection(base.calls, raw.calls),
    data: mergeSection(base.data, raw.data),
  };
}

export function mergeAppSettings(current: AppSettings, patch: Partial<AppSettings>): AppSettings {
  return normalizeAppSettings({
    notifications: patch.notifications ? { ...current.notifications, ...patch.notifications } : current.notifications,
    privacy: patch.privacy ? { ...current.privacy, ...patch.privacy } : current.privacy,
    chats: patch.chats ? { ...current.chats, ...patch.chats } : current.chats,
    calls: patch.calls ? { ...current.calls, ...patch.calls } : current.calls,
    data: patch.data ? { ...current.data, ...patch.data } : current.data,
  });
}

export function chatFontScaleMultiplier(scale: ChatFontScale): number {
  if (scale === 'small') return 0.92;
  if (scale === 'large') return 1.1;
  return 1;
}
