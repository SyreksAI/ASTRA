import React from 'react';
import { FeedTabs } from './FeedTabs';

export function OrbitHero({ activeTab, setActiveTab }) {
    return (
        <header className="orbit-head orbit-head--rexon">
            <div className="orbit-head__copy">
                <h1 className="orbit-head__title">Твоя орбита</h1>
                <p className="orbit-head__text">
                    Люди и идеи, к которым ты ближе сегодня
                </p>
                <FeedTabs activeTab={activeTab} setActiveTab={setActiveTab} variant="orbit" />
            </div>
        </header>
    );
}
