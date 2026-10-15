// src/utils/searchHistory.js
const KEY = 'astra_search_history';
const MAX = 10;

export function getSearchHistory() {
    try {
        return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
        return [];
    }
}

export function pushSearchHistory(query) {
    const q = (query || '').trim();
    if (!q) return;
    const list = getSearchHistory().filter((x) => x !== q);
    list.unshift(q);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function clearSearchHistory() {
    localStorage.removeItem(KEY);
}