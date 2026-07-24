// src/pages/ExplorePage.jsx
import React, { useState } from 'react';
import { ForYou } from '../explore/ForYou';
import { Trending } from '../explore/Trending';
import { News } from '../explore/News';
import { Sport } from '../explore/Sport';
import { Video } from '../explore/Video';

export function ExplorePage({ suggestedUsers }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Для тебя');

    const categories = [
        { id: 'Для тебя', label: 'Для тебя' },
        { id: 'В тренде', label: 'В тренде' },
        { id: 'Новости', label: 'Новости' },
        { id: 'Спорт', label: 'Спорт' },
        { id: 'Видео', label: 'Видео' },
    ];

    const renderContentSearch = () => {
        switch(activeCategory) {
            case 'Для тебя':
                return <ForYou suggestedUsers={suggestedUsers} />;
            case 'В тренде':
                return <Trending suggestedUsers={suggestedUsers} />;
            case 'Новости':
                return <News suggestedUsers={suggestedUsers} />;
            case 'Спорт':
                return <Sport suggestedUsers={suggestedUsers} />;
            case 'Видео':
                return <Video suggestedUsers={suggestedUsers} />;
        }
    }

    return (
        <div className="explore-page">
            <div className="explore-page-header">
                <input type="text" 
                       placeholder="Поиск..." 
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="explore-page-search-input" />
                
                <div className="explore-page-categories">
                    {categories.map(category => (
                        <p key={category.id}
                           className={`explore-page-category-item ${activeCategory === category.id ? 'explore-page-category-active' : ''}`}
                           onClick={() => setActiveCategory(category.id)}>
                           {category.label}
                        </p>
                    ))}
                </div>
            </div>

            <div className="explore-page-content">
                <div className="explore-page-main">
                    {renderContentSearch()}
                </div>
            </div>
        </div>
    );
}