import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MAP_ITEMS = [
    {
        id: 'dev',
        label: 'Разработка',
        members: '28,1K',
        weekly: '1,2K',
        status: 'Активно',
        icon: '</>',
        angle: -38,
        radius: 38,
        cover: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=360&fit=crop',
        planet: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=160&h=160&fit=crop',
        about: 'Код, архитектура, технологии, инструменты и всё, что связано с разработкой. Делитесь опытом, проектами и находите команду.',
        tags: ['#Программирование', '#Web-dev', '#Backend', '#OpenSource'],
        topics: [
            { id: 1, title: 'React 19 — что нового?', meta: '842 ответа · сегодня', img: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=80&h=80&fit=crop' },
            { id: 2, title: 'Микросервисы без боли', meta: '312 ответа · вчера', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=80&h=80&fit=crop' },
            { id: 3, title: 'Python для AI-пайплайнов', meta: '198 ответов · 2д', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=80&h=80&fit=crop' },
        ],
        faces: [
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop',
        ],
    },
    {
        id: 'games',
        label: 'Игры',
        members: '19,4K',
        weekly: '860',
        status: 'Активно',
        icon: '▶',
        angle: 8,
        radius: 42,
        cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=360&fit=crop',
        planet: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&h=160&fit=crop',
        about: 'Новинки, прохождения, киберспорт и свои игровые миры.',
        tags: ['#Games', '#Esports', '#Indie'],
        topics: [
            { id: 1, title: 'Лучшие инди 2026', meta: '420 ответов', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=80&h=80&fit=crop' },
        ],
        faces: [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop',
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=48&h=48&fit=crop',
        ],
    },
    {
        id: 'tech',
        label: 'Технологии',
        members: '31,2K',
        weekly: '1,5K',
        status: 'В тренде',
        icon: '⚙',
        angle: 48,
        radius: 36,
        cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=360&fit=crop',
        planet: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=160&h=160&fit=crop',
        about: 'AI, гаджеты, стартапы и технологии будущего.',
        tags: ['#AI', '#Gadgets', '#Startup'],
        topics: [
            { id: 1, title: 'Локальные LLM на ноутбуке', meta: '510 ответов', img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=80&h=80&fit=crop' },
        ],
        faces: [
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=48&h=48&fit=crop',
        ],
    },
    {
        id: 'business',
        label: 'Бизнес',
        members: '14,8K',
        weekly: '420',
        status: 'Активно',
        icon: '◆',
        angle: 112,
        radius: 40,
        cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=360&fit=crop',
        planet: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=160&h=160&fit=crop',
        about: 'Продукты, рост, монетизация и команды.',
        tags: ['#Startup', '#Product', '#Growth'],
        topics: [
            { id: 1, title: 'Как валидировать идею за неделю', meta: '204 ответа', img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=80&h=80&fit=crop' },
        ],
        faces: [
            'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=48&h=48&fit=crop',
        ],
    },
    {
        id: 'education',
        label: 'Образование',
        members: '11,6K',
        weekly: '390',
        status: 'Активно',
        icon: '✎',
        angle: 158,
        radius: 37,
        cover: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=360&fit=crop',
        planet: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=160&h=160&fit=crop',
        about: 'Обучение, курсы, менторство и обмен знаниями.',
        tags: ['#Learn', '#Courses', '#Mentoring'],
        topics: [
            { id: 1, title: 'Roadmap frontend 2026', meta: '670 ответов', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=80&h=80&fit=crop' },
        ],
        faces: [
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop',
        ],
    },
    {
        id: 'music',
        label: 'Музыка',
        members: '22,0K',
        weekly: '980',
        status: 'Активно',
        icon: '♪',
        angle: 200,
        radius: 41,
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=360&fit=crop',
        planet: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=160&h=160&fit=crop',
        about: 'Треки, плейлисты, живые сеты и обсуждения звука.',
        tags: ['#Music', '#Playlists', '#Live'],
        topics: [
            { id: 1, title: 'Лучшие альбомы месяца', meta: '301 ответ', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop' },
        ],
        faces: [
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop',
        ],
    },
    {
        id: 'art',
        label: 'Искусство',
        members: '9,7K',
        weekly: '250',
        status: 'Спокойно',
        icon: '◈',
        angle: 248,
        radius: 39,
        cover: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=360&fit=crop',
        planet: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=160&h=160&fit=crop',
        about: 'Визуал, фото, живопись и цифровое искусство.',
        tags: ['#Art', '#Photo', '#Digital'],
        topics: [
            { id: 1, title: 'Цвет в тёмных интерфейсах', meta: '144 ответа', img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=80&h=80&fit=crop' },
        ],
        faces: [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=48&h=48&fit=crop',
        ],
    },
    {
        id: 'design',
        label: 'Дизайн',
        members: '17,3K',
        weekly: '640',
        status: 'Активно',
        icon: '✦',
        angle: 300,
        radius: 35,
        cover: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=360&fit=crop',
        planet: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=160&h=160&fit=crop',
        about: 'UI/UX, системы, типографика и продуктовый дизайн.',
        tags: ['#UI', '#UX', '#Figma'],
        topics: [
            { id: 1, title: 'Design systems без боли', meta: '388 ответов', img: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=80&h=80&fit=crop' },
        ],
        faces: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop',
        ],
    },
];

const PANEL_TABS = ['Главная', 'Обсуждения', 'Проекты', 'Участники'];

function polarToStyle(angleDeg, radiusPct) {
    const rad = (angleDeg * Math.PI) / 180;
    const x = 50 + radiusPct * Math.cos(rad);
    const y = 50 + radiusPct * Math.sin(rad);
    return { left: `${x}%`, top: `${y}%` };
}

function Verified() {
    return (
        <svg className="cm-verified" viewBox="0 0 22 22" width="18" height="18" aria-label="Подтверждено">
            <circle cx="11" cy="11" r="11" fill="#16B8A6" />
            <path d="M6.8 11.2 9.6 14l5.6-6.2" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ConstellationsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [view, setView] = useState('map');
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState('dev');
    const [panelTab, setPanelTab] = useState('Главная');
    const [joined, setJoined] = useState({});

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return MAP_ITEMS;
        return MAP_ITEMS.filter((c) =>
            c.label.toLowerCase().includes(q)
            || c.tags.some((t) => t.toLowerCase().includes(q))
            || c.about.toLowerCase().includes(q),
        );
    }, [query]);

    const selected = MAP_ITEMS.find((c) => c.id === selectedId) || MAP_ITEMS[0];
    const isJoined = Boolean(joined[selected.id]);
    const userInitial = String(user?.full_name || user?.username || 'A').charAt(0).toUpperCase();

    return (
        <div className="cm-page">
            <div className="cm-main">
                <header className="cm-top">
                    <label className="cm-search">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                            <circle cx="11" cy="11" r="6.5" />
                            <path d="m16.2 16.2 3.3 3.3" strokeLinecap="round" />
                        </svg>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Поиск созвездий, тем, людей..."
                        />
                    </label>
                    <div className="cm-top-actions">
                        <button type="button" className="cm-icon-btn" aria-label="Уведомления" onClick={() => navigate('/notifications')}>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                                <path d="M8 18h8M9.5 18a5.5 5.5 0 1 1 5 0" />
                                <path d="M12 3.5v1.2" strokeLinecap="round" />
                            </svg>
                            <i className="cm-dot" />
                        </button>
                        <button type="button" className="cm-avatar" aria-label="Профиль" onClick={() => navigate('/profile')}>
                            {user?.avatar ? <img src={user.avatar} alt="" /> : <span>{userInitial}</span>}
                        </button>
                    </div>
                </header>

                <div className="cm-head">
                    <div>
                        <h1>Созвездия</h1>
                        <p>Исследуй интересы, находи своих и создавай миры.</p>
                    </div>
                    <div className="cm-head-actions">
                        <div className="cm-view-toggle" role="group" aria-label="Вид">
                            <button
                                type="button"
                                className={view === 'map' ? 'is-active' : ''}
                                onClick={() => setView('map')}
                            >
                                Карта
                            </button>
                            <button
                                type="button"
                                className={view === 'list' ? 'is-active' : ''}
                                onClick={() => setView('list')}
                            >
                                Список
                            </button>
                        </div>
                        <button type="button" className="cm-create-btn">
                            <span aria-hidden>+</span>
                            Создать созвездие
                        </button>
                    </div>
                </div>

                {view === 'map' ? (
                    <section className="cm-map-wrap">
                        <aside className="cm-rail" aria-label="Категории">
                            {MAP_ITEMS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`cm-rail__item${selectedId === item.id ? ' is-active' : ''}`}
                                    onClick={() => setSelectedId(item.id)}
                                    title={item.label}
                                >
                                    <span className="cm-rail__icon">{item.icon}</span>
                                    <span className="cm-rail__label">{item.label}</span>
                                </button>
                            ))}
                        </aside>

                        <div className="cm-orbit" aria-label="Карта созвездий">
                            <div className="cm-orbit__ring cm-orbit__ring--a" aria-hidden />
                            <div className="cm-orbit__ring cm-orbit__ring--b" aria-hidden />
                            <div className="cm-orbit__ring cm-orbit__ring--c" aria-hidden />

                            <div className="cm-orbit__hub">
                                <img src="/home/orbit-planet.png" alt="" />
                                <strong>Elara</strong>
                            </div>

                            {filtered.map((item) => {
                                const style = polarToStyle(item.angle, item.radius);
                                const active = selectedId === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`cm-planet${active ? ' is-active' : ''}`}
                                        style={style}
                                        onClick={() => setSelectedId(item.id)}
                                    >
                                        <span className="cm-planet__orb">
                                            <img src={item.planet} alt="" />
                                        </span>
                                        <span className="cm-planet__meta">
                                            <strong>{item.label}</strong>
                                            <em>{item.members} участников</em>
                                            <span className="cm-planet__faces">
                                                {item.faces.slice(0, 3).map((src) => (
                                                    <img key={src} src={src} alt="" />
                                                ))}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ) : (
                    <section className="cm-list">
                        {filtered.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`cm-list__card${selectedId === item.id ? ' is-active' : ''}`}
                                onClick={() => setSelectedId(item.id)}
                            >
                                <img src={item.cover} alt="" />
                                <span>
                                    <strong>{item.label}</strong>
                                    <em>{item.members} участников · {item.weekly}/нед</em>
                                </span>
                            </button>
                        ))}
                    </section>
                )}

                <section className="cm-popular">
                    <div className="cm-popular__head">
                        <h2>Популярные созвездия</h2>
                    </div>
                    <div className="cm-popular__row">
                        {MAP_ITEMS.slice(0, 4).map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className="cm-popular__card"
                                onClick={() => setSelectedId(item.id)}
                            >
                                <img src={item.cover} alt="" />
                                <span>
                                    <strong>{item.label}</strong>
                                    <em>{item.members} участников</em>
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            <aside className="cm-panel">
                <div className="cm-panel__hero">
                    <img src={selected.cover} alt="" />
                    <div className="cm-panel__hero-scrim" aria-hidden />
                    <div className="cm-panel__hero-content">
                        <div className="cm-panel__badge">{selected.icon}</div>
                        <div className="cm-panel__title-row">
                            <h2>{selected.label}</h2>
                            <Verified />
                        </div>
                        <p>{selected.members} участников · открытое созвездие</p>
                        <div className="cm-panel__cta">
                            <button
                                type="button"
                                className={`cm-panel__join${isJoined ? ' is-joined' : ''}`}
                                onClick={() => setJoined((prev) => ({ ...prev, [selected.id]: !prev[selected.id] }))}
                            >
                                {isJoined ? 'Вы участник' : 'Присоединиться'}
                            </button>
                            <button
                                type="button"
                                className="cm-panel__open"
                                onClick={() => navigate(`/constellation/${selected.id}`)}
                            >
                                Открыть
                            </button>
                            <button type="button" className="cm-panel__bookmark" aria-label="В закладки">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                                    <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <nav className="cm-panel__tabs" aria-label="Разделы созвездия">
                    {PANEL_TABS.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            className={panelTab === tab ? 'is-active' : ''}
                            onClick={() => setPanelTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="cm-panel__body">
                    {panelTab === 'Главная' ? (
                        <>
                            <section className="cm-panel__about">
                                <h3>О созвездии</h3>
                                <p>{selected.about}</p>
                                <div className="cm-panel__tags">
                                    {selected.tags.map((tag) => (
                                        <span key={tag}>{tag}</span>
                                    ))}
                                </div>
                            </section>

                            <section className="cm-panel__stats">
                                <div>
                                    <strong>{selected.members}</strong>
                                    <span>участников</span>
                                </div>
                                <div>
                                    <strong>{selected.weekly}</strong>
                                    <span>публикаций / нед</span>
                                </div>
                                <div>
                                    <strong>{selected.status}</strong>
                                    <span>статус</span>
                                </div>
                            </section>

                            <section className="cm-panel__topics">
                                <h3>Популярные темы</h3>
                                <ul>
                                    {selected.topics.map((topic) => (
                                        <li key={topic.id}>
                                            <img src={topic.img} alt="" />
                                            <span>
                                                <strong>{topic.title}</strong>
                                                <em>{topic.meta}</em>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </>
                    ) : (
                        <div className="cm-panel__empty">
                            Раздел «{panelTab}» скоро появится
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
