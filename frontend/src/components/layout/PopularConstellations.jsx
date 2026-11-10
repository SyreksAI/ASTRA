import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONSTELLATIONS, resolveConstellation } from '../../utils/constellations';

const PREVIEW_COUNT = 5;

function buildPopular(posts = []) {
    const stats = Object.fromEntries(
        CONSTELLATIONS.map((c) => [c.id, { constellation: c, members: new Set(), posts: 0 }]),
    );

    for (const post of posts) {
        const c = resolveConstellation(post);
        if (!c || !stats[c.id]) continue;
        stats[c.id].posts += 1;
        const key = post.author?.username || post.author?.id || post.author?.full_name;
        if (key) stats[c.id].members.add(String(key));
    }

    return Object.values(stats)
        .map((row) => ({
            id: row.constellation.id,
            label: row.constellation.label,
            members: row.members.size,
            posts: row.posts,
        }))
        .filter((row) => row.members > 0 || row.posts > 0)
        .sort((a, b) => (b.members * 3 + b.posts) - (a.members * 3 + a.posts));
}

function formatMembers(n) {
    if (n === 1) return '1 участник';
    if (n >= 2 && n <= 4) return `${n} участника`;
    return `${n} участников`;
}

export function PopularConstellations({ posts = [] }) {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);
    const items = useMemo(() => buildPopular(posts), [posts]);
    const visible = expanded ? items : items.slice(0, PREVIEW_COUNT);
    const canShowMore = items.length > PREVIEW_COUNT;

    return (
        <div className="popular-constellations">
            <div className="popular-constellations__header">
                <h3 className="popular-constellations__title">Популярные созвездия</h3>
            </div>

            {items.length === 0 ? (
                <p className="popular-constellations__empty">Пока нет активных созвездий</p>
            ) : (
                <>
                    <ul className="popular-constellations__list">
                        {visible.map((item) => (
                            <li key={item.id} className="popular-constellations__row">
                                <button
                                    type="button"
                                    className="popular-constellations__main"
                                    onClick={() => navigate(`/constellation/${encodeURIComponent(item.id)}`)}
                                >
                                    <span className="popular-constellations__mark">
                                        {item.label.slice(0, 1)}
                                    </span>
                                    <span className="popular-constellations__text">
                                        <span className="popular-constellations__name">{item.label}</span>
                                        <span className="popular-constellations__meta">
                                            {formatMembers(item.members)}
                                            {item.posts > 0 ? ` · ${item.posts} постов` : ''}
                                        </span>
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="popular-constellations__join"
                                    aria-label={`Присоединиться к ${item.label}`}
                                    onClick={() => navigate(`/constellation/${encodeURIComponent(item.id)}`)}
                                >
                                    +
                                </button>
                            </li>
                        ))}
                    </ul>

                    {canShowMore && (
                        <button
                            type="button"
                            className="popular-constellations__more"
                            onClick={() => setExpanded((v) => !v)}
                        >
                            {expanded ? 'Свернуть' : 'Показать ещё'}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
