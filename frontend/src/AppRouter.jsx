// src/AppRouter.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { HomePage } from './components/pages/HomePage';
import { ExplorePage } from './components/pages/ExplorePage';
import { ProfilePage } from './components/pages/ProfilePage';
import { ChatPage } from './components/pages/ChatPage';
import { NotificationsPage } from './components/pages/NotificationsPage';
import { UnderDevelopmentPage } from './components/pages/UnderDevelopmentPage';

function AppRouter({ posts, suggestedUsers, activeTab, setActiveTab }) {
    return (
        <Routes>
            <Route path="/" element={
                <HomePage posts={posts} activeTab={activeTab} setActiveTab={setActiveTab} />
            } />
            <Route path="/explore" element={<ExplorePage suggestedUsers={suggestedUsers} />} />
            <Route path="/profile" element={<ProfilePage suggestedUsers={suggestedUsers} />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="*" element={<UnderDevelopmentPage pageName="Страница не найдена" />} />
        </Routes>
    );
}

export default AppRouter;