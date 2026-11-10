import React, { useMemo } from 'react';

const FALLBACK = [
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1464802686167-b33436c77b2a?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=200&h=200&fit=crop',
];

export function ActualStrip({ posts = [] }) {
    const thumbs = useMemo(() => {
        const fromPosts = (posts || [])
            .map((p) => p.image || p.image_url)
            .filter(Boolean)
            .slice(0, 5);
        if (fromPosts.length >= 3) return fromPosts;
        return [...fromPosts, ...FALLBACK].slice(0, 5);
    }, [posts]);

    return (
        <div className="actual-strip">
            <div className="actual-strip__head">
                <h3 className="actual-strip__title">Актуальное</h3>
            </div>
            <div className="actual-strip__row">
                {thumbs.map((src, i) => (
                    <div key={`${src}-${i}`} className="actual-strip__thumb">
                        <img src={src} alt="" loading="lazy" />
                    </div>
                ))}
            </div>
        </div>
    );
}
