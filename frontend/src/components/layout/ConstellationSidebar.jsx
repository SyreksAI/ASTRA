import React from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_TAGS = ['Программирование', 'Технологии', 'Инструменты', 'Архитектура', 'Open Source'];

const DEFAULT_MODS = [
    {
        id: 1,
        name: 'Станислав',
        role: 'Владелец',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
    },
    {
        id: 2,
        name: 'Мария Л.',
        role: 'Модератор',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
    },
    {
        id: 3,
        name: 'Игорь Н.',
        role: 'Модератор',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
    },
];

const DEFAULT_THEMES = [
    { id: 1, title: 'React', count: 842 },
    { id: 2, title: 'Python', count: 631 },
    { id: 3, title: 'Веб-разработка', count: 518 },
    { id: 4, title: 'Архитектура', count: 294 },
    { id: 5, title: 'DevOps', count: 187 },
];

const DEFAULT_SIMILAR = [
    {
        id: 'design',
        label: 'Дизайн',
        members: '12.4K',
        img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=120&h=120&fit=crop',
    },
    {
        id: 'science',
        label: 'Научные идеи',
        members: '9.1K',
        img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&h=120&fit=crop',
    },
    {
        id: 'tech',
        label: 'Технологии',
        members: '21.3K',
        img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=120&h=120&fit=crop',
    },
];

export function ConstellationSidebar({
    constellation,
    about,
    membersLabel = '18,7K',
    onlineLabel = '256',
    createdAt = '12 марта 2024',
    tags = DEFAULT_TAGS,
    moderators = DEFAULT_MODS,
    themes = DEFAULT_THEMES,
    similar = DEFAULT_SIMILAR,
}) {
    const navigate = useNavigate();
    const title = constellation?.label || 'Созвездие';
    const aboutText = about
        || `Сообщество для разработчиков: код, архитектура, инструменты и обмен опытом. Добро пожаловать в «${title}».`;

    return (
        <aside className="constellation-sidebar">
            <section className="orbit-panel c-side-about">
                <div className="orbit-panel__head">
                    <h3 className="orbit-panel__title">О созвездии</h3>
                    <button type="button" className="orbit-panel__link">Изменить</button>
                </div>
                <p className="c-side-about__text">{aboutText}</p>
                <div className="c-side-about__stats">
                    <div>
                        <strong>{membersLabel}</strong>
                        <span>участников</span>
                    </div>
                    <div>
                        <strong>{onlineLabel}</strong>
                        <span>в сети</span>
                    </div>
                </div>
                <p className="c-side-about__created">Создано {createdAt}</p>
                <div className="c-side-about__tags">
                    {tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                    ))}
                </div>
            </section>

            <section className="orbit-panel c-side-mods">
                <div className="orbit-panel__head">
                    <h3 className="orbit-panel__title">Модераторы</h3>
                </div>
                <ul className="c-side-mods__list">
                    {moderators.map((m) => (
                        <li key={m.id}>
                            <img src={m.avatar} alt="" />
                            <span>
                                <strong>{m.name}</strong>
                                <em>{m.role}</em>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="orbit-panel c-side-themes">
                <div className="orbit-panel__head">
                    <h3 className="orbit-panel__title">Популярные темы</h3>
                </div>
                <ol className="c-side-themes__list">
                    {themes.map((t, i) => (
                        <li key={t.id}>
                            <button type="button" className="c-side-themes__row">
                                <span className="c-side-themes__num">{i + 1}</span>
                                <span className="c-side-themes__body">
                                    <strong>{t.title}</strong>
                                    <em>{t.count} публикаций</em>
                                </span>
                                <span className="c-side-themes__chev" aria-hidden>›</span>
                            </button>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="orbit-panel c-side-similar">
                <div className="orbit-panel__head">
                    <h3 className="orbit-panel__title">Похожие созвездия</h3>
                </div>
                <ul className="c-side-similar__list">
                    {similar.map((s) => (
                        <li key={s.id}>
                            <button
                                type="button"
                                className="c-side-similar__row"
                                onClick={() => navigate(`/constellation/${s.id}`)}
                            >
                                <img src={s.img} alt="" />
                                <span>
                                    <strong>{s.label}</strong>
                                    <em>{s.members} участников</em>
                                </span>
                            </button>
                            <button
                                type="button"
                                className="c-side-similar__join"
                                aria-label={`Вступить в ${s.label}`}
                            >
                                +
                            </button>
                        </li>
                    ))}
                </ul>
            </section>
        </aside>
    );
}
