import type { ChatMessage } from '../../chat/types';

import { isDemoConversation } from './linksterDemoHub';



function minutesAgo(m: number): string {

  const d = new Date();

  d.setMinutes(d.getMinutes() - m);

  return d.toISOString();

}



function msg(

  id: string,

  senderId: number,

  text: string,

  minutesBack: number,

  extra?: Partial<ChatMessage>

): ChatMessage {

  return {

    id,

    sender_id: senderId,

    text,

    type: 'text',

    created_at: minutesAgo(minutesBack),

    ...extra,

  };

}



const KSYUSHA = -101;

const MAX = -102;

const DARYA = -103;

const STANISLAV = -201;

const ILYA = -104;



function threadKsyusha(meId: number): ChatMessage[] {

  return [

    msg('demo-k-1', KSYUSHA, 'Привет! Ты уже смотрел новый макет?', 180),

    msg('demo-k-2', meId, 'Да, только что — выглядит очень чисто', 175),

    msg('demo-k-3', KSYUSHA, 'Супер. Можем вечером соз созвониться?', 120),

    msg('demo-k-4', meId, 'Конечно, давай вечером обсудим!', 90),

    msg('demo-k-5', KSYUSHA, 'Отлично, напишу ближе к 19:00 🙂', 45),

  ];

}



function threadMax(meId: number): ChatMessage[] {

  return [

    msg('demo-m-1', MAX, 'Скинул правки по экрану звонков', 240),

    msg('demo-m-2', meId, 'Вижу, сейчас посмотрю', 230),

    msg('demo-m-3', MAX, 'Голосовое сообщение • 0:12', 200, {

      type: 'voice',

      text: '',

    }),

    msg('demo-m-4', meId, 'Ок, после созвона отпишусь', 190),

  ];

}



function threadAstraTeam(meId: number): ChatMessage[] {

  return [

    msg('demo-a-1', STANISLAV, 'Коллеги, обновил макет главной', 300, {

      sender_name: 'Станислав',

    }),

    msg('demo-a-2', ILYA, 'Посмотрел — огонь 🔥', 280, { sender_name: 'Илья' }),

    msg('demo-a-3', meId, 'Готовый дизайн для новой страницы. Посмотрите, пожалуйста!', 260, {

      sender_name: 'Вы',

    }),

    msg('demo-a-4', STANISLAV, 'Станислав: Готовый дизайн для новой страницы. Посмотрите, пожалуйста!', 60, {

      sender_name: 'Станислав',

    }),

  ];

}



function threadDarya(meId: number): ChatMessage[] {

  return [

    msg('demo-d-1', DARYA, 'Привет! Как тебе эта фотка?', 400),

    msg('demo-d-2', meId, 'Классная композиция', 390),

    msg('demo-d-3', DARYA, 'Фотография', 380, { type: 'image', text: 'Фотография' }),

  ];

}



function threadGeneric(meId: number, title: string): ChatMessage[] {

  return [

    msg('demo-g-1', -999, `Добро пожаловать в демо-чат «${title}».`, 120),

    msg('demo-g-2', meId, 'Это превью переписки без сервера.', 100),

    msg('demo-g-3', -999, 'Напишите сообщение — оно останется только на устройстве.', 80),

  ];

}



const THREAD_BUILDERS: Record<string, (meId: number) => ChatMessage[]> = {

  'demo-ksyusha': threadKsyusha,

  'demo-max': threadMax,

  'demo-astra-team': threadAstraTeam,

  'demo-darya': threadDarya,

  'demo-ilya': (meId) => [

    msg('demo-i-1', ILYA, 'Окей, сделаем так', 1440),

    msg('demo-i-2', meId, 'Договорились', 1430),

  ],

  'demo-it': (meId) => [

    msg('demo-it-1', ILYA, 'Скинул файлы в общий чат', 300, { sender_name: 'Илья' }),

    msg('demo-it-2', meId, 'Спасибо, смотрю', 290, { sender_name: 'Вы' }),

  ],

};



export function getDemoThreadMessages(

  conversation: { id: string | number; display_name?: string },

  myUserId: number

): ChatMessage[] {

  const key = String(conversation.id);

  const build = THREAD_BUILDERS[key];

  const meId = myUserId || 1;

  if (build) return build(meId);

  return threadGeneric(meId, conversation.display_name || 'Чат');

}



export function isDemoChatOpen(chat: { id?: string | number } | null): boolean {

  return chat != null && isDemoConversation(chat as { id: string | number });

}


