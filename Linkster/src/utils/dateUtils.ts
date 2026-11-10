export function timeAgo(date: string | null | undefined): string {
  if (!date) return '';

  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(date);
  const isoString = hasTimezone ? date : `${date}Z`;

  const diffInSeconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffInSeconds < 60) return 'только что';

  const intervals = [
    { seconds: 31536000, words: ['год', 'года', 'лет'] as const },
    { seconds: 2592000, words: ['месяц', 'месяца', 'месяцев'] as const },
    { seconds: 604800, words: ['неделю', 'недели', 'недель'] as const },
    { seconds: 86400, words: ['день', 'дня', 'дней'] as const },
    { seconds: 3600, words: ['час', 'часа', 'часов'] as const },
    { seconds: 60, words: ['минуту', 'минуты', 'минут'] as const },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${wordForm(count, interval.words)} назад`;
    }
  }
  return 'только что';
}

function wordForm(n: number, words: readonly [string, string, string]): string {
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return words[2];
  if (lastDigit === 1) return words[0];
  if (lastDigit >= 2 && lastDigit <= 4) return words[1];
  return words[2];
}
