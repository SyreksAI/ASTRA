const EXACT: Record<string, string> = {
  'Email already registered': 'Этот email уже зарегистрирован. Войдите или укажите другой.',
  'Username already taken': 'Это имя пользователя занято. Выберите другое.',
  'Password too short (min 6 characters)': 'Пароль не короче 6 символов.',
  'Invalid email or password': 'Неверный email или пароль.',
};

export function localizeApiError(message: string): string {
  const trimmed = message.trim();
  if (EXACT[trimmed]) return EXACT[trimmed];
  const lower = trimmed.toLowerCase();
  if (lower.includes('valid email') || lower.includes('@-sign')) {
    return 'Некорректный email. Пример: name@gmail.com';
  }
  if (lower.includes('already registered')) return EXACT['Email already registered'];
  if (lower.includes('username already')) return EXACT['Username already taken'];
  return trimmed;
}

export function parseApiErrorBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string') return localizeApiError(detail);
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return localizeApiError(String((item as { msg: unknown }).msg));
        }
        return null;
      })
      .filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  return fallback;
}
