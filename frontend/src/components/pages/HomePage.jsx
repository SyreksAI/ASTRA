import React from 'react';
import { PostCard } from "../post/PostCard";

export function HomePage({ posts, activeTab, setActiveTab }) {
    return (
        <div className="home-page">
            <div className="home-page-header">
                {['Для тебя', 'Следующий'].map(tab => (
                    <p key={tab} 
                       className={`home-page-header-link ${activeTab === tab ? 'home-page-header-link-active' : ''}`}
                       onClick={() => setActiveTab(tab)}>
                        {tab}
                    </p>
                ))}
            </div>
            <div className="home-page-feed">
                {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
        </div>
    );
}

export default HomePage;