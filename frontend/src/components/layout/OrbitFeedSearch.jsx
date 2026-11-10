import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function OrbitFeedSearch({ className = '' }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/explore?tab=search&q=${encodeURIComponent(q)}` : '/explore?tab=search');
    };

    return (
        <form
            className={`orbit-feed-search ${className}`.trim()}
            onSubmit={handleSubmit}
            role="search"
        >
            <svg className="orbit-feed-search__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="M16.2 16.2 20.5 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск людей, созвездий, идей…"
                aria-label="Поиск"
            />
        </form>
    );
}
