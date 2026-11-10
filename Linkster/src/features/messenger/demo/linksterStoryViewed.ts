import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'linkster_viewed_story_users_v1';

export async function loadViewedStoryUserIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}

export async function persistViewedStoryUserIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify([...ids])).catch(() => {});
}

export function markStoryUserViewed(ids: Set<string>, userId: string): Set<string> {
  if (ids.has(userId)) return ids;
  const next = new Set(ids);
  next.add(userId);
  return next;
}
