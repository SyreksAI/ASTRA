export const SHOW_LINKSTER_DEMO_CALLS = true;

export type CallDirection = 'incoming' | 'outgoing' | 'missed';
export type CallKind = 'audio' | 'video';

export type DemoCallRecord = {
  id: string;
  name: string;
  avatarSeed: string;
  direction: CallDirection;
  kind: CallKind;
  at: string;
  /** Длительность ответа; для пропущенных — нет */
  durationSec?: number;
};

export type DemoQuickContact = {
  id: string;
  name: string;
  avatarSeed: string;
};

const avatar = (seed: string) => `https://i.pravatar.cc/150?u=linkster-${seed}`;

export function demoCallAvatarUri(seed: string): string {
  return avatar(seed);
}

function hoursAgo(h: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - Math.round(h * 60));
  return d.toISOString();
}

function daysAgo(days: number, hour = 14, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const LINKSTER_DEMO_QUICK_CONTACTS: DemoQuickContact[] = [
  { id: 'qc-ksyusha', name: 'Ксюша', avatarSeed: 'ksyusha' },
  { id: 'qc-max', name: 'Макс', avatarSeed: 'max' },
  { id: 'qc-alexey', name: 'Алексей', avatarSeed: 'alexey' },
  { id: 'qc-darya', name: 'Дарья', avatarSeed: 'darya' },
  { id: 'qc-ilya', name: 'Илья', avatarSeed: 'ilya' },
];

export const LINKSTER_DEMO_CALLS: DemoCallRecord[] = [
  {
    id: 'call-1',
    name: 'Ксюша',
    avatarSeed: 'ksyusha',
    direction: 'incoming',
    kind: 'video',
    at: hoursAgo(0.4),
    durationSec: 272,
  },
  {
    id: 'call-2',
    name: 'Макс',
    avatarSeed: 'max',
    direction: 'outgoing',
    kind: 'audio',
    at: hoursAgo(2.1),
    durationSec: 65,
  },
  {
    id: 'call-3',
    name: 'Алексей',
    avatarSeed: 'alexey',
    direction: 'missed',
    kind: 'audio',
    at: hoursAgo(5.5),
  },
  {
    id: 'call-4',
    name: 'Дарья',
    avatarSeed: 'darya',
    direction: 'incoming',
    kind: 'audio',
    at: hoursAgo(8),
    durationSec: 184,
  },
  {
    id: 'call-5',
    name: 'Илья',
    avatarSeed: 'ilya',
    direction: 'outgoing',
    kind: 'video',
    at: daysAgo(1, 19, 15),
    durationSec: 901,
  },
  {
    id: 'call-6',
    name: 'Станислав',
    avatarSeed: 'stanislav',
    direction: 'incoming',
    kind: 'audio',
    at: daysAgo(1, 11, 40),
    durationSec: 42,
  },
  {
    id: 'call-7',
    name: 'Ксюша',
    avatarSeed: 'ksyusha',
    direction: 'missed',
    kind: 'video',
    at: daysAgo(2, 21, 0),
  },
  {
    id: 'call-8',
    name: 'Макс',
    avatarSeed: 'max',
    direction: 'outgoing',
    kind: 'audio',
    at: daysAgo(3, 16, 30),
    durationSec: 128,
  },
  {
    id: 'call-9',
    name: 'Linkster Support',
    avatarSeed: 'support',
    direction: 'incoming',
    kind: 'audio',
    at: daysAgo(5, 10, 0),
    durationSec: 356,
  },
];

export function formatCallDuration(seconds?: number): string {
  if (seconds == null || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export type CallHistorySection = {
  key: string;
  title: string;
  data: DemoCallRecord[];
};

function sectionTitleForDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startToday.getTime() - startThat.getTime()) / 86400000);
  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'long' });
  }
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function groupDemoCalls(calls: DemoCallRecord[]): CallHistorySection[] {
  const sorted = [...calls].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const map = new Map<string, DemoCallRecord[]>();
  for (const item of sorted) {
    const title = sectionTitleForDate(item.at);
    const list = map.get(title) ?? [];
    list.push(item);
    map.set(title, list);
  }
  return Array.from(map.entries()).map(([title, data], i) => ({
    key: `sec-${i}-${title}`,
    title,
    data,
  }));
}

export function demoCallsForUi(): DemoCallRecord[] {
  return SHOW_LINKSTER_DEMO_CALLS ? LINKSTER_DEMO_CALLS : [];
}

export function demoQuickContactsForUi(): DemoQuickContact[] {
  return SHOW_LINKSTER_DEMO_CALLS ? LINKSTER_DEMO_QUICK_CONTACTS : [];
}
