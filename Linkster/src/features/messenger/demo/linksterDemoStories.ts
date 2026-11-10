import { mediaUrl } from '../../../config/api';

import type { Conversation } from '../../chat/types';



export type StorySlide = {

  id: string;

  type: 'image' | 'text';

  imageUri?: string;

  backgroundColor?: string;

  caption?: string;

  createdAt: string;

};



export type StoryUser = {
  id: string;
  name: string;
  avatarUri?: string;
  slides: StorySlide[];
  /** Статус «в сети» в шапке просмотра */
  isOnline?: boolean;
  statusLabel?: string;
};



function minutesAgo(m: number): string {

  const d = new Date();

  d.setMinutes(d.getMinutes() - m);

  return d.toISOString();

}



const storyImage = (seed: string) => `https://picsum.photos/seed/linkster-${seed}/1080/1920`;



function slidesFor(seed: string, captions: string[]): StorySlide[] {

  return captions.map((caption, i) => ({

    id: `${seed}-${i}`,

    type: 'image' as const,

    imageUri: storyImage(`${seed}-${i}`),

    caption,

    createdAt: minutesAgo(60 - i * 8),

  }));

}



const STORY_BY_CONV_ID: Record<string, { seed: string; captions: string[] }> = {

  'demo-alexey': {

    seed: 'alexey',

    captions: ['Утро в городе ☕', 'Новый маршрут на выходные'],

  },

  'demo-ksyusha': {

    seed: 'ksyusha',

    captions: ['Сегодня тестируем макет Linkster', 'Как вам тёмная тема?', 'Пишите в личку 💬'],

  },

  'demo-max': {

    seed: 'max',

    captions: ['На созвоне', 'Скоро пушим билд'],

  },

  'demo-darya': {

    seed: 'darya',

    captions: ['Фото дня', 'Свет и тени'],

  },

  'demo-ilya': {

    seed: 'ilya',

    captions: ['Код ревью прошёл ✅'],

  },

};



export function conversationHasStoryRing(indexInRow: number): boolean {

  return indexInRow < 5;

}



function resolveAvatarUri(c: Conversation): string | undefined {

  const avatarPath = c.display_avatar || c.user?.avatar;

  if (!avatarPath) return undefined;

  if (String(avatarPath).startsWith('http')) return String(avatarPath);

  return mediaUrl(String(avatarPath));

}



export function buildStoryUsersFromConversations(conversations: Conversation[]): StoryUser[] {

  const users: StoryUser[] = [];

  conversations.slice(0, 6).forEach((c, i) => {

    if (!conversationHasStoryRing(i)) return;

    const id = String(c.id);

    const meta = STORY_BY_CONV_ID[id];

    if (!meta) return;

    const title = c.display_name || c.user?.full_name || c.user?.username || 'История';

    users.push({
      id,
      name: title.split(' ')[0],
      avatarUri: resolveAvatarUri(c),
      slides: slidesFor(meta.seed, meta.captions),
      isOnline: i % 2 === 0,
      statusLabel: i % 2 === 0 ? 'в сети' : 'был(а) недавно',
    });

  });

  return users;

}



export function findStoryUserIndex(users: StoryUser[], conversationId: string | number): number {

  return users.findIndex((u) => u.id === String(conversationId));

}


