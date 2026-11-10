export type ChatUser = {
  id: number;
  username?: string;
  full_name?: string;
  avatar?: string | null;
  last_seen_at?: string | null;
};

export type Conversation = {
  id: number | string;
  type?: 'direct' | 'group' | string;
  title?: string;
  user?: ChatUser;
  display_name?: string;
  display_avatar?: string;
  last_message?: string;
  last_message_at?: string;
  has_unread?: boolean;
  unread_count?: number;
};

export type ChatMessage = Record<string, unknown> & {
  id: string | number;
  sender_id?: number;
  sender_name?: string;
  text?: string;
  type?: string;
  created_at?: string;
  file_url?: string;
  mime_type?: string;
  file_name?: string;
  pending?: boolean;
  local_preview_uri?: string;
};
