import React, { useState } from 'react';

export function PostCard({ post }) {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes);

    const handleLike = (e) => {
        e.stopPropagation();
        const newLiked = !liked
        setLiked(newLiked);
        setLikesCount(prev => newLiked ? prev - 1 : prev + 1);
    };

    return (
        <div className="post-item">
            <div className="post-item-header">
                <img src={post.avatar} alt={post.name} className="post-item-avatar" />
                <div className="post-item-user-info">
                    <div className="post-item-user-name">{post.name}</div>
                    <div className="post-item-user-handle">{post.handle}</div>
                </div>
                <div className="post-item-time">{post.time}</div>
            </div>
            
            <div className="post-item-content">{post.content}</div>
            {post.image && <img src={post.image} alt="Post" className="post-item-image" />}
            
            <div className="post-item-actions">
                <button className="post-item-action-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/>
                    </svg>
                    {post.comments}
                </button>
                
                <button className="post-item-action-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/>
                    </svg>
                    {post.retweets}
                </button>
                
                <button className={`post-item-action-btn ${liked ? 'post-item-liked' : ''}`} onClick={handleLike}>
                    <svg viewBox="0 0 24 24" fill={liked ? '#f91880' : 'currentColor'}>
                        <path d={liked 
                            ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            : "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        }/>
                    </svg>
                    {likesCount}
                </button>
                
                <button className="post-item-action-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3C7.03 3 3 7.03 3 12c0 2.5 1.27 4.85 3.37 6.25l.65.37-.26.72c-.5 1.4-1.42 3.03-2.71 4.87l.12.12c1.5-.38 3.13-1.22 4.75-2.27l.5-.32c.94.2 1.91.3 2.9.3 4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}