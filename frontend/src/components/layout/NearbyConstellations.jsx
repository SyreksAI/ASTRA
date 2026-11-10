import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const THUMBS = {
    tech: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=160&h=160&fit=crop&sat=-100',
    design: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=160&h=160&fit=crop&sat=-100',
    games: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&h=160&fit=crop&sat=-100',
    music: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=160&h=160&fit=crop&sat=-100',
    art: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=160&h=160&fit=crop&sat=-100',
    science: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=160&h=160&fit=crop&sat=-100',
    sport: 'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?w=160&h=160&fit=crop&sat=-100',
    dev: 'https://images.unsplash.com/photo-1515879214611-6a9bd4f6e5b5?w=160&h=160&fit=crop&sat=-100',
};

const BLURBS = {
    design: 'Форма, пространство, интерфейсы',
    dev: 'Код, архитектура, инструменты',
    tech: 'AI, гаджеты, стартапы',
    science: 'Исследования и космос',
    music: 'Треки и звуковые сигналы',
    games: 'Игры и киберспорт',
    art: 'Визуал и творчество',
    sport: 'Движение и матчи',
};

const FACES = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop',
];

function authHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatCount(n) {
    const v = n || 0;
    if (v >= 1000) {
        const k = v / 1000;
        return `${k.toFixed(1).replace('.0', '')}K`;
    }
    return String(v);
}

export function NearbyConstellations() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/constellations/', { headers: authHeaders() })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (!cancelled) setItems(Array.isArray(data) ? data.slice(0, 3) : []);
            })
            .catch(() => {
                if (!cancelled) setItems([]);
            });
        return () => { cancelled = true; };
    }, []);

    if (items.length === 0) return null;

    return (
        <section className="orbit-panel nearby-constellations">
            <div className="orbit-panel__head">
                <h3 className="orbit-panel__title">Созвездия рядом</h3>
                <button
                    type="button"
                    className="orbit-panel__link"
                    onClick={() => navigate('/constellations')}
                >
                    Все →
                </button>
            </div>
            <div className="nearby-constellations__list">
                {items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className="nearby-row"
                        onClick={() => navigate(`/constellation/${encodeURIComponent(item.id)}`)}
                    >
                        <img
                            className="nearby-row__thumb"
                            src={THUMBS[item.id] || THUMBS.tech}
                            alt=""
                        />
                        <span className="nearby-row__body">
                            <span className="nearby-row__name">{item.label}</span>
                            <span className="nearby-row__people">
                                <span className="nearby-row__faces" aria-hidden>
                                    {FACES.map((src, i) => (
                                        <img key={src} src={src} alt="" style={{ zIndex: FACES.length - i }} />
                                    ))}
                                </span>
                                <span className="nearby-row__count">
                                    {formatCount(item.members_count)} участников
                                </span>
                            </span>
                            <span className="nearby-row__meta">
                                {BLURBS[item.id] || item.description || 'Созвездие Elara'}
                            </span>
                        </span>
                        <span className="nearby-row__chev" aria-hidden>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M9 5.5 15 12l-6 6.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}
