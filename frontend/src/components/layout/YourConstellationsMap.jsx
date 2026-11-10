import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONSTELLATIONS, resolveConstellation } from '../../utils/constellations';

const NODE_LAYOUT = [
    { id: 'dev', x: 22, y: 28 },
    { id: 'design', x: 72, y: 22 },
    { id: 'games', x: 78, y: 62 },
    { id: 'art', x: 48, y: 78 },
    { id: 'music', x: 18, y: 68 },
    { id: 'tech', x: 52, y: 48 },
];

export function YourConstellationsMap({ posts = [] }) {
    const navigate = useNavigate();

    const active = useMemo(() => {
        const set = new Set();
        for (const post of posts) {
            const c = resolveConstellation(post);
            if (c) set.add(c.id);
        }
        return set;
    }, [posts]);

    const nodes = NODE_LAYOUT.map((n) => {
        const c = CONSTELLATIONS.find((x) => x.id === n.id);
        return { ...n, label: c?.label || n.id, on: active.has(n.id) || n.id === 'tech' };
    });

    return (
        <div className="constellation-map">
            <div className="constellation-map__header">
                <h3 className="constellation-map__title">Твои созвездия</h3>
            </div>

            <div className="constellation-map__sky" aria-hidden>
                <svg className="constellation-map__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {nodes.map((n) => {
                        const hub = nodes.find((x) => x.id === 'tech') || nodes[0];
                        if (n.id === hub.id) return null;
                        return (
                            <line
                                key={`l-${n.id}`}
                                x1={hub.x}
                                y1={hub.y}
                                x2={n.x}
                                y2={n.y}
                                className={n.on ? 'is-on' : ''}
                            />
                        );
                    })}
                </svg>

                {nodes.map((n) => (
                    <button
                        key={n.id}
                        type="button"
                        className={`constellation-map__node ${n.on ? 'is-on' : ''}`}
                        style={{ left: `${n.x}%`, top: `${n.y}%` }}
                        title={n.label}
                        onClick={() => navigate(`/constellation/${encodeURIComponent(n.id)}`)}
                    >
                        <span className="constellation-map__dot" />
                        <span className="constellation-map__label">{n.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
