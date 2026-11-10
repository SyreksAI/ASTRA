import React from 'react';

const TABS = [
    { id: 'Для тебя', label: 'Для тебя' },
    { id: 'Следующий', label: 'Подписки' },
];

export function FeedTabs({ activeTab, setActiveTab, variant = 'default' }) {
    return (
        <div className={`feed-tabs feed-tabs--${variant}`} role="tablist" aria-label="Лента">
            <div className="feed-tabs__list">
                {TABS.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`feed-tabs__btn ${active ? 'is-active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="feed-tabs__label">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
