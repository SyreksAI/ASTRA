import React from "react";
import { useNavigate } from 'react-router-dom';

export function ModalComments(isOpen, nonIsOpen) {

    return (
        <>
            <div className="home-page-feed">
                {posts.map(post => <PostCard key={post.id} post={post} onCommentCountChange={onCommentCountChange} />)}
            </div>
        </>
    )
}