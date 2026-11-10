import React from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_CONSTELLATIONS = [
    { id: 'dev', label: 'Разработка', count: '18.7K', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=200&fit=crop' },
    { id: 'design', label: 'Дизайн', count: '12.4K', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&h=200&fit=crop' },
    { id: 'science', label: 'Наука', count: '9.1K', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop' },
    { id: 'tech', label: 'Технологии', count: '21.3K', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop' },
];

const DEFAULT_ACHIEVEMENTS = [
    { id: 'early', title: 'Ранний участник', detail: 'С 2010 года', tone: 'amber' },
    { id: 'creator', title: 'Создатель', detail: '1 созвездие', tone: 'violet' },
    { id: 'author', title: 'Активный автор', detail: '24 публикации', tone: 'teal' },
    { id: 'popular', title: 'Популярный контент', detail: '2.4K просмотров', tone: 'rose' },
];

const DEFAULT_INTERESTS = [
    'React', 'Python', 'Веб-разработка', 'Дизайн', 'Космос',
    'Технологии', 'Искусственный интеллект', 'UI/UX', 'Стартапы',
];

function BadgeIcon({ tone }) {
    return (
        <span className={`profile-side-ach__icon profile-side-ach__icon--${tone}`} aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                    d="M12 3.2 14.1 8.4 19.8 9l-4.2 3.8 1.2 5.5L12 15.8 7.2 18.3l1.2-5.5L4.2 9l5.7-.6L12 3.2Z"
                    fill="currentColor"
                />
            </svg>
        </span>
    );
}

export function ProfileSidebar({
    user,
    aboutText,
    location = 'Краснодар',
    age = 15,
    role = 'Developer',
    org = 'Elara',
    github,
    interests = DEFAULT_INTERESTS,
    constellations = DEFAULT_CONSTELLATIONS,
    achievements = DEFAULT_ACHIEVEMENTS,
}) {
    const navigate = useNavigate();
    const name = user?.full_name || user?.username || 'Пользователь';
    const about = aboutText
        || `${name} — студент 1 курса. Интересуюсь ИИ, разработкой и дизайном. Строю Elara — социальную сеть созвездий.`;
    const links = user?.preferences?.links || {};
    const githubLink = github || links.github || '';
    const websiteLink = links.website || '';
    const telegramLink = links.telegram || '';
    const linkItems = [
        githubLink && {
            key: 'github',
            label: githubLink.replace(/^https?:\/\//i, ''),
            href: /^https?:\/\//i.test(githubLink) ? githubLink : `https://${githubLink}`,
        },
        websiteLink && {
            key: 'website',
            label: websiteLink.replace(/^https?:\/\//i, ''),
            href: /^https?:\/\//i.test(websiteLink) ? websiteLink : `https://${websiteLink}`,
        },
        telegramLink && {
            key: 'telegram',
            label: telegramLink.startsWith('@') || telegramLink.includes('t.me')
                ? telegramLink.replace(/^https?:\/\//i, '')
                : `@${telegramLink.replace(/^@/, '')}`,
            href: /^https?:\/\//i.test(telegramLink)
                ? telegramLink
                : `https://t.me/${telegramLink.replace(/^@/, '').replace(/^t\.me\//i, '')}`,
        },
    ].filter(Boolean);

    return (
        <aside className="profile-sidebar">
            <section className="orbit-panel profile-side-about">
                <div className="orbit-panel__head">
                    <h3 className="orbit-panel__title">О себе</h3>
                </div>
                <p className="profile-side-about__text">{about}</p>
                <ul className="profile-side-about__meta">
                    <li>
                        <span>Локация</span>
                        <strong>{location}</strong>
                    </li>
                    <li>
                        <span>Возраст</span>
                        <strong>{age} лет</strong>
                    </li>
                    <li>
                        <span>Деятельность</span>
                        <strong>{role}</strong>
                    </li>
                    <li>
                        <span>Организация</span>
                        <strong>{org}</strong>
                    </li>
                    {linkItems.length > 0 && (
                        <li>
                            <span>Ссылки</span>
                            <div className="profile-side-about__links">
                                {linkItems.map((link) => (
                                    <a key={link.key} href={link.href} target="_blank" rel="noreferrer">
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </li>
                    )}
                </ul>
            </section>

            <section className="orbit-panel profile-side-constellations">
                <div className="orbit-panel__head">
                    <h3 className="orbit-panel__title">Мои созвездия</h3>
                    <button
                        type="button"
                        className="orbit-panel__link"
                        onClick={() => navigate('/explore')}
                    >
                        Все →
                    </button>
                </div>
                <div className="profile-side-constellations__grid">
                    {constellations.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            className="profile-side-constellations__item"
                            onClick={() => navigate('/explore')}
                        >
                            <img src={c.img} alt="" />
                            <span className="profile-side-constellations__label">{c.label}</span>
                            <span className="profile-side-constellations__count">{c.count}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="orbit-panel profile-side-ach">
                <div className="orbit-panel__head">
                    <h3 className="orbit-panel__title">Достижения</h3>
                </div>
                <ul className="profile-side-ach__list">
                    {achievements.map((a) => (
                        <li key={a.id} className="profile-side-ach__row">
                            <BadgeIcon tone={a.tone} />
                            <span>
                                <strong>{a.title}</strong>
                                <em>{a.detail}</em>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="orbit-panel profile-side-interests">
                <div className="orbit-panel__head">
                    <h3 className="orbit-panel__title">Интересы</h3>
                </div>
                <div className="profile-side-interests__cloud">
                    {interests.map((tag) => (
                        <span key={tag} className="profile-side-interests__tag">{tag}</span>
                    ))}
                    <button type="button" className="profile-side-interests__add" aria-label="Добавить интерес">
                        +
                    </button>
                </div>
            </section>
        </aside>
    );
}
