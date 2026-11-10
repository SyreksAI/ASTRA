import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONSTELLATIONS, resolveConstellation } from '../../utils/constellations';

const SHOW = [
    { id: 'tech', count: '128K', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=240&h=240&fit=crop' },
    { id: 'design', count: '84K', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=240&h=240&fit=crop' },
    { id: 'games', count: '56K', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=240&h=240&fit=crop' },
    { id: 'art', count: '41K', image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=240&h=240&fit=crop' },
    { id: 'music', count: '97K', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=240&h=240&fit=crop' },
    { id: 'science', count: '33K', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=240&h=240&fit=crop' },
];

function buildItems(posts = []) {
    const active = new Set();
    for (const post of posts) {
        const c = resolveConstellation(post);
        if (c) active.add(c.id);
    }

    return SHOW.map((row) => {
        const c = CONSTELLATIONS.find((x) => x.id === row.id);
        return {
            ...row,
            label: c?.label || row.id,
            on: active.has(row.id) || row.id === 'tech',
        };
    });
}

export function HomeHero({ posts = [] }) {
    const navigate = useNavigate();
    const trackRef = useRef(null);
    const items = useMemo(() => buildItems(posts), [posts]);

    return (
        <section className="your-constellations">
            <div className="your-constellations__head">
                <h2 className="your-constellations__title">Твои Созвездия</h2>
                <button
                    type="button"
                    className="your-constellations__all"
                    onClick={() => navigate('/explore')}
                >
                    Смотреть все →
                </button>
            </div>

            <div className="your-constellations__row">
                <div className="your-constellations__track" ref={trackRef}>
                    <button
                        type="button"
                        className="your-constellations__item your-constellations__item--create"
                        onClick={() => navigate('/explore')}
                    >
                        <span className="your-constellations__ring your-constellations__ring--create">
                            <span className="your-constellations__core">+</span>
                        </span>
                        <span className="your-constellations__label">Открыть</span>
                        <span className="your-constellations__count">созвездие</span>
                    </button>

                    {items.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`your-constellations__item ${item.on ? 'is-on' : ''}`}
                            onClick={() => navigate(`/constellation/${encodeURIComponent(item.id)}`)}
                        >
                            <span className="your-constellations__ring">
                                <img src={item.image} alt="" className="your-constellations__photo" />
                            </span>
                            <span className="your-constellations__label">{item.label}</span>
                            <span className="your-constellations__count">{item.count}</span>
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    className="your-constellations__next"
                    aria-label="Дальше"
                    onClick={() => trackRef.current?.scrollBy({ left: 180, behavior: 'smooth' })}
                >
                    ›
                </button>
            </div>
        </section>
    );
}
