// src/utils/dateUtils.js
export function timeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) {
        return 'только что';
    }
    
    const intervals = [
        { unit: 'год', seconds: 31536000, words: ['год', 'года', 'лет'] },
        { unit: 'месяц', seconds: 2592000, words: ['месяц', 'месяца', 'месяцев'] },
        { unit: 'неделя', seconds: 604800, words: ['неделю', 'недели', 'недель'] },
        { unit: 'день', seconds: 86400, words: ['день', 'дня', 'дней'] },
        { unit: 'час', seconds: 3600, words: ['час', 'часа', 'часов'] },
        { unit: 'минута', seconds: 60, words: ['минуту', 'минуты', 'минут'] }
    ];
    
    for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds);
        if (count >= 1) {
            const word = getWordForm(count, interval.words);
            return `${count} ${word} назад`;
        }
    }
    
    return 'только что';
}

function getWordForm(n, words) {
    const lastDigit = n % 10;
    const lastTwoDigits = n % 100;
    
    // Исключение для 11-19
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return words[2];
    }
    
    if (lastDigit === 1) {
        return words[0];
    }
    
    if (lastDigit >= 2 && lastDigit <= 4) {
        return words[1];
    }
    
    return words[2];
}