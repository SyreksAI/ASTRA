import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPostMedia } from '../../utils/postMedia';

function MediaTile({ item }) {
    if (item.type === 'video') {
        return (
            <video
                src={item.url}
                muted
                playsInline
                preload="metadata"
            />
        );
    }
    return (
        <img
            src={item.url}
            alt=""
            loading="lazy"
            draggable={false}
        />
    );
}

function PostMediaLightbox({ items, index, onClose, onIndexChange }) {
    const item = items[index];

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
            if (e.key === 'ArrowRight' && index < items.length - 1) onIndexChange(index + 1);
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener('keydown', onKey);
        };
    }, [index, items.length, onClose, onIndexChange]);

    if (!item) return null;

    return createPortal(
        <div
            className="chat-image-viewer post-media-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Просмотр медиа"
            onClick={onClose}
        >
            <button
                type="button"
                className="chat-image-viewer-close"
                aria-label="Закрыть"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            >
                ✕
            </button>

            {items.length > 1 && (
                <>
                    <div className="chat-image-viewer-counter">
                        {index + 1} / {items.length}
                    </div>
                    {index > 0 && (
                        <button
                            type="button"
                            className="chat-image-viewer-nav chat-image-viewer-nav-prev"
                            aria-label="Предыдущее"
                            onClick={(e) => {
                                e.stopPropagation();
                                onIndexChange(index - 1);
                            }}
                        >
                            ‹
                        </button>
                    )}
                    {index < items.length - 1 && (
                        <button
                            type="button"
                            className="chat-image-viewer-nav chat-image-viewer-nav-next"
                            aria-label="Следующее"
                            onClick={(e) => {
                                e.stopPropagation();
                                onIndexChange(index + 1);
                            }}
                        >
                            ›
                        </button>
                    )}
                </>
            )}

            <div
                className="post-media-lightbox__stage"
                onClick={(e) => e.stopPropagation()}
            >
                {item.type === 'video' ? (
                    <video
                        key={item.url}
                        className="post-media-lightbox__video"
                        src={item.url}
                        controls
                        playsInline
                        autoPlay
                    />
                ) : (
                    <img
                        key={item.url}
                        src={item.url}
                        alt=""
                        className="chat-image-viewer-img"
                        draggable={false}
                    />
                )}
            </div>
        </div>,
        document.body
    );
}

export function PostMedia({ post, className = '' }) {
    const items = getPostMedia(post);
    const [viewerIndex, setViewerIndex] = useState(null);

    const closeViewer = useCallback(() => setViewerIndex(null), []);
    const changeIndex = useCallback((next) => setViewerIndex(next), []);

    if (!items.length) return null;

    const total = items.length;
    const layoutKey = total >= 4 ? 4 : total;
    const visible = total > 4 ? items.slice(0, 4) : items;
    const extra = total > 4 ? total - 4 : 0;

    const openViewer = (index, e) => {
        e.stopPropagation();
        setViewerIndex(index);
    };

    return (
        <>
            <div
                className={[
                    'feed-post__media',
                    `feed-post__media--n-${layoutKey}`,
                    className,
                ].filter(Boolean).join(' ')}
            >
                <div className="feed-post__media-grid">
                    {visible.map((item, index) => {
                        const isZoomable = true;
                        const openIndex = index;

                        return (
                            <div
                                key={`${item.url}-${index}`}
                                className={[
                                    'feed-post__media-cell',
                                    `feed-post__media-cell--${index + 1}`,
                                    isZoomable ? 'feed-post__media-cell--zoomable' : '',
                                ].filter(Boolean).join(' ')}
                                role={isZoomable ? 'button' : undefined}
                                tabIndex={isZoomable ? 0 : undefined}
                                onClick={isZoomable ? (e) => openViewer(openIndex, e) : undefined}
                                onKeyDown={
                                    isZoomable
                                        ? (e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                openViewer(openIndex, e);
                                            }
                                        }
                                        : undefined
                                }
                            >
                                <MediaTile item={item} />
                                {extra > 0 && index === 3 && (
                                    <span className="feed-post__media-more">+{extra}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {viewerIndex !== null && (
                <PostMediaLightbox
                    items={items}
                    index={viewerIndex}
                    onClose={closeViewer}
                    onIndexChange={changeIndex}
                />
            )}
        </>
    );
}

export default PostMedia;
