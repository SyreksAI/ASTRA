import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function RightTopBar() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/explore?tab=search&q=${encodeURIComponent(q)}` : '/explore?tab=search');
    };

    return (
        <form className="right-search" onSubmit={handleSubmit} role="search">
            <svg className="right-search__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16.5 16.5 21 21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
                className="right-search__input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск"
                aria-label="Поиск"
            />
        </form>
    );
}
