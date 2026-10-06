import React from 'react';
import { PostCard } from "../post/PostCard";
// import { ModalPost } from './components/modal/Modal';

export function HomePage({ posts, activeTab, setActiveTab, onCommentCountChange }) {
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
                {posts.map(post => <PostCard key={post.id} post={post} onCommentCountChange={onCommentCountChange} />)}
            </div>
        </div>
    );
}

export default HomePage;
