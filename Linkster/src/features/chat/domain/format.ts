export function formatMessageTime(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export function formatChatRowTime(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Вчера';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export function formatLastSeen(iso?: string | null): string {
  if (!iso) return 'был(а) давно';
  const d = new Date(iso);
  const diffMin = (Date.now() - d.getTime()) / 60000;
  if (diffMin < 5) return 'был(а) только что';
  if (diffMin < 60) return 'был(а) недавно';
  if (diffMin < 60 * 24) return 'был(а) сегодня';
  if (diffMin < 60 * 24 * 7) return 'был(а) на этой неделе';
  return 'был(а) давно';
}
