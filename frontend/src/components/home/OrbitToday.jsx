import React from 'react';
import { useNavigate } from 'react-router-dom';

export function OrbitToday({ items = [] }) {
    const navigate = useNavigate();
    if (!items.length) return null;

    const onClick = (item) => {
        if (item.type === 'person' && item.username) {
            navigate(`/user/${item.username}`);
            return;
        }
        if (item.type === 'constellation' && item.constellationId) {
            navigate(`/constellation/${encodeURIComponent(item.constellationId)}`);
            return;
        }
        if (item.postId) {
            const el = document.getElementById(`post-${item.postId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('post-item--pulse');
                window.setTimeout(() => el.classList.remove('post-item--pulse'), 1200);
            }
        }
    };

    return (
        <section className="orbit-today" aria-label="Твоя орбита сегодня">
            <div className="orbit-today__head">
                <h2 className="orbit-today__title">Твоя орбита сегодня</h2>
                <p className="orbit-today__sub">Куда можно заглянуть прямо сейчас</p>
            </div>
            <div className="orbit-today__track">
                {items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`orbit-today__chip orbit-today__chip--${item.type}`}
                        onClick={() => onClick(item)}
                    >
                        <span className="orbit-today__chip-kicker">
                            {item.type === 'discussion' && 'Обсуждение'}
                            {item.type === 'person' && 'Рядом'}
                            {item.type === 'constellation' && 'Созвездие'}
                        </span>
                        <span className="orbit-today__chip-title">{item.title}</span>
                        <span className="orbit-today__chip-meta">{item.meta}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
