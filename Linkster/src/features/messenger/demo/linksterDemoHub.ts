import type { Conversation } from '../../chat/types';

/** Показывать демо-чаты и истории на главном экране (поверх реальных) */
export const SHOW_LINKSTER_DEMO_HUB = true;

export function isDemoConversation(item: Pick<Conversation, 'id'>): boolean {
  return String(item.id).startsWith('demo-');
}

function hoursAgo(h: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - Math.round(h * 60));
  return d.toISOString();
}

function daysAgo(days: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const avatar = (seed: string) => `https://i.pravatar.cc/150?u=linkster-${seed}`;

/** Как на макете Linkster */
export const LINKSTER_DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'demo-astra-team',
    type: 'group',
    display_name: 'Astra Team',
    last_message: 'Станислав: Готовый дизайн для новой страницы. Посмотрите, пожалуйста!',
    last_message_at: hoursAgo(0.5),
    has_unread: true,
    unread_count: 3,
  },
  {
    id: 'demo-ksyusha',
    type: 'direct',
    display_name: 'Ксюша',
    display_avatar: avatar('ksyusha'),
    user: { id: -101, full_name: 'Ксюша', username: 'ksyusha' },
    last_message: 'Конечно, давай вечером обсудим!',
    last_message_at: hoursAgo(1.2),
    has_unread: true,
    unread_count: 1,
  },
  {
    id: 'demo-linkster-updates',
    type: 'direct',
    display_name: 'Linkster Updates',
    last_message: 'Новая функция уже доступна! 🚀',
    last_message_at: hoursAgo(2.5),
    has_unread: false,
  },
  {
    id: 'demo-max',
    type: 'direct',
    display_name: 'Макс',
    display_avatar: avatar('max'),
    user: { id: -102, full_name: 'Макс', username: 'max' },
    last_message: 'Голосовое сообщение • 0:12',
    last_message_at: hoursAgo(3.5),
    has_unread: true,
    unread_count: 2,
  },
  {
    id: 'demo-it',
    type: 'group',
    display_name: 'IT | Обсуждение',
    display_avatar: avatar('it-cat'),
    last_message: 'Илья: Скинул файлы в общий чат',
    last_message_at: hoursAgo(5),
    has_unread: true,
    unread_count: 5,
  },
  {
    id: 'demo-darya',
    type: 'direct',
    display_name: 'Дарья',
    display_avatar: avatar('darya'),
    user: { id: -103, full_name: 'Дарья', username: 'darya' },
    last_message: 'Фотография',
    last_message_at: hoursAgo(6.2),
    has_unread: false,
  },
  {
    id: 'demo-project-astra',
    type: 'group',
    display_name: 'Проект Astra',
    last_message: 'Вы: Обновил макет главной страницы',
    last_message_at: hoursAgo(7.5),
    has_unread: false,
  },
  {
    id: 'demo-ilya',
    type: 'direct',
    display_name: 'Илья',
    display_avatar: avatar('ilya'),
    user: { id: -104, full_name: 'Илья', username: 'ilya' },
    last_message: 'Окей, сделаем так',
    last_message_at: daysAgo(1, 18, 30),
    has_unread: false,
  },
];

/** Доп. контакты только для ряда историй (если мало чатов) */
export const LINKSTER_DEMO_STORY_ONLY: Conversation[] = [
  {
    id: 'demo-alexey',
    type: 'direct',
    display_name: 'Алексей',
    display_avatar: avatar('alexey'),
    user: { id: -105, full_name: 'Алексей', username: 'alexey' },
    last_message: '',
    has_unread: false,
  },
];

export function mergeHubConversations(real: Conversation[]): Conversation[] {
  if (!SHOW_LINKSTER_DEMO_HUB) return real;

  const live = real.filter((c) => !isDemoConversation(c));
  const storyExtras = LINKSTER_DEMO_STORY_ONLY.filter(
    (d) => !live.some((r) => r.display_name === d.display_name)
  );

  return [...LINKSTER_DEMO_CONVERSATIONS, ...storyExtras, ...live];
}

const STORY_NAMES = ['Алексей', 'Ксюша', 'Макс', 'Дарья', 'Илья'] as const;

/** Порядок аватаров в ряду «историй» как на макете */
export function pickStoryConversations(source: Conversation[]): Conversation[] {
  const pool = SHOW_LINKSTER_DEMO_HUB
    ? [...LINKSTER_DEMO_STORY_ONLY, ...LINKSTER_DEMO_CONVERSATIONS, ...source]
    : source;

  const picked = STORY_NAMES.map((name) =>
    pool.find((c) => c.display_name === name || c.display_name?.startsWith(name))
  ).filter((c): c is Conversation => !!c);

  if (picked.length >= 3) return picked;

  return pool.filter((c) => c.type !== 'group').slice(0, 6);
}
