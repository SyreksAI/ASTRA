import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CONSTELLATIONS } from '../../utils/constellations';
import { MenuIcons } from '../layout/MenuIcons';
import { PostMedia } from '../post/PostMedia';

const META = {
    dev: {
        description: 'Код, архитектура, технологии, инструменты и всё, что связано с разработкой.',
        members: '18,7K',
        online: '256',
        avatar: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=240&h=240&fit=crop',
        cover: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1600&h=600&fit=crop',
    },
    design: {
        description: 'Форма, пространство, интерфейсы и визуальный язык продуктов.',
        members: '12,4K',
        online: '142',
        avatar: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=240&h=240&fit=crop',
        cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&h=600&fit=crop',
    },
    tech: {
        description: 'AI, гаджеты, стартапы и технологии будущего.',
        members: '21,3K',
        online: '318',
        avatar: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=240&h=240&fit=crop',
        cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&h=600&fit=crop',
    },
    science: {
        description: 'Исследования, космос и научные идеи.',
        members: '9,1K',
        online: '97',
        avatar: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=240&h=240&fit=crop',
        cover: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&h=600&fit=crop',
    },
};

const TABS = [
    { id: 'posts', label: 'Публикации' },
    { id: 'discussions', label: 'Обсуждения' },
    { id: 'people', label: 'Люди' },
    { id: 'media', label: 'Медиа' },
    { id: 'events', label: 'События' },
    { id: 'files', label: 'Файлы' },
    { id: 'about', label: 'О созвездии' },
];

const FILTERS = ['Все', 'Популярное', 'Новое', 'Вопросы', 'Проекты', 'Обсуждения'];

const FACES = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop',
];

const DEMO_POST = {
    id: 'demo-arch',
    author: 'Артём Ковалёв',
    handle: '@artem_k',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
    time: '2 ч. назад',
    title: 'Минималистичная архитектура для небольших проектов',
    text: 'Когда команда маленькая, лишние слои только мешают. Делюсь схемой, которая держит фокус на продукте, а не на инфраструктуре.',
    tags: ['Архитектура', 'Backend', 'Лучшие практики'],
    code: `// Структура проекта
src/
  app/          # точки входа
  domain/       # бизнес-логика
  adapters/     # API, БД, UI
  shared/       # утилиты

// Правило: domain не знает про фреймворк`,
    images: [
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=640&h=420&fit=crop',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&h=420&fit=crop',
        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&h=420&fit=crop',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=420&fit=crop',
    ],
    likes: 128,
    comments: 24,
    reposts: 12,
};

const INFO_CARDS = [
    {
        id: 'pinned',
        eyebrow: 'Закреплено',
        title: 'Правила созвездия',
        tone: 'amber',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path d="M12 3.2 14.1 8.4 19.8 9l-4.2 3.8 1.2 5.5L12 15.8 7.2 18.3l1.2-5.5L4.2 9l5.7-.6L12 3.2Z" fill="currentColor" />
            </svg>
        ),
    },
    {
        id: 'links',
        eyebrow: 'Полезные ссылки',
        title: 'Материалы, доки, инструменты',
        tone: 'teal',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M10 13a5 5 0 0 0 7.1 0l2.1-2.1a5 5 0 0 0-7.1-7.1L11 5" strokeLinecap="round" />
                <path d="M14 11a5 5 0 0 0-7.1 0L4.8 13.1a5 5 0 0 0 7.1 7.1L13 19" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: 'ideas',
        eyebrow: 'Идеи недели',
        title: 'Интересные проекты',
        tone: 'violet',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M9 18h6M10 21h4" strokeLinecap="round" />
                <path d="M12 3a6 6 0 0 1 3.5 10.8c-.7.5-1.1 1.2-1.2 2H9.7c-.1-.8-.5-1.5-1.2-2A6 6 0 0 1 12 3Z" strokeLinejoin="round" />
            </svg>
        ),
    },
];

const COMPOSER_CHIPS = [
    {
        id: 'photo',
        label: 'Фото',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
                <circle cx="9" cy="9" r="1.4" />
                <path d="M3.8 16.2 9.2 11.5l3.4 3.2 3.2-3.8 4.4 5.3" />
            </svg>
        ),
    },
    {
        id: 'video',
        label: 'Видео',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <rect x="3.5" y="6" width="12" height="12" rx="2" />
                <path d="M15.5 10.5 20.5 8v8l-5-2.5" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'poll',
        label: 'Опрос',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M7 18V11M12 18V6M17 18v-5" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: 'code',
        label: 'Код',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="m8 7-5 5 5 5M16 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'file',
        label: 'Файл',
        icon: (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M8 4.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-8.5A1.5 1.5 0 0 1 6.5 19V6A1.5 1.5 0 0 1 8 4.5Z" strokeLinejoin="round" />
                <path d="M14 4.5V9h4.5" />
            </svg>
        ),
    },
];

function VerifiedIcon() {
    return (
        <svg className="c-page__verified" viewBox="0 0 22 22" width="18" height="18" aria-label="Подтверждено">
            <circle cx="11" cy="11" r="11" fill="#16B8A6" />
            <path d="M6.8 11.2 9.6 14l5.6-6.2" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ConstellationPage({ posts = [], onPostCreated, onCommentCountChange }) {
    const { id } = useParams();
    const { user } = useAuth();
    const [tab, setTab] = useState('posts');
    const [filter, setFilter] = useState('Все');
    const [draft, setDraft] = useState('');
    const [imgIndex, setImgIndex] = useState(0);
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [memberOpen, setMemberOpen] = useState(false);

    const constellation = useMemo(() => {
        const fromList = CONSTELLATIONS.find((c) => c.id === id);
        return fromList || { id: id || 'dev', label: 'Разработка' };
    }, [id]);

    const meta = META[constellation.id] || META.dev;

    const feedPosts = useMemo(() => {
        const own = (posts || []).filter(
            (p) => p.constellation_id === constellation.id
                || p.constellation?.id === constellation.id
                || (p.constellation?.label && p.constellation.label === constellation.label),
        );
        return own;
    }, [posts, constellation]);

    const handlePublish = async () => {
        if (!draft.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('content', draft.trim());
            formData.append('constellation_id', constellation.id);
            const res = await fetch('/api/posts/', {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });
            const data = await res.json().catch(() => null);
            if (res.ok) {
                setDraft('');
                onPostCreated?.(data);
            }
        } catch (_) {
            /* noop for demo */
        }
    };

    return (
        <section className="c-page">
            <header className="c-page__hero">
                <div className="c-page__cover">
                    <img src={meta.cover} alt="" />
                    <div className="c-page__cover-scrim" aria-hidden />

                    <div className="c-page__identity">
                        <div className="c-page__who">
                            <div className="c-page__title-row">
                                <h1>{constellation.label}</h1>
                                <VerifiedIcon />
                            </div>
                            <p className="c-page__desc">{meta.description}</p>
                            <div className="c-page__stats">
                                <span className="c-page__faces" aria-hidden>
                                    {FACES.map((src, i) => (
                                        <img key={src} src={src} alt="" style={{ zIndex: FACES.length - i }} />
                                    ))}
                                </span>
                                <span>{meta.members} участников</span>
                                <span className="c-page__online">
                                    <i />
                                    {meta.online} в сети
                                </span>
                            </div>
                        </div>

                        <div className="c-page__actions">
                            <div className="c-page__member-wrap">
                                <button
                                    type="button"
                                    className="c-page__member-btn"
                                    onClick={() => setMemberOpen((v) => !v)}
                                >
                                    Вы участник
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                {memberOpen && (
                                    <div className="c-page__member-menu">
                                        <button type="button">Настройки уведомлений</button>
                                        <button type="button" className="is-danger">Покинуть созвездие</button>
                                    </div>
                                )}
                            </div>
                            <button type="button" className="c-page__more" aria-label="Ещё">
                                {MenuIcons.more}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <nav className="c-page__tabs" aria-label="Разделы созвездия">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        className={`c-page__tab${tab === t.id ? ' is-active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </nav>

            {tab === 'posts' && (
                <>
                    <div className="c-page__composer">
                        <div className="c-page__composer-top">
                            <div className="c-page__composer-avatar">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="" />
                                ) : (
                                    <span>{user?.username?.[0]?.toUpperCase() || 'A'}</span>
                                )}
                            </div>
                            <textarea
                                className="c-page__composer-input"
                                placeholder="Поделиться мыслью..."
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                rows={2}
                            />
                        </div>
                        <div className="c-page__composer-bar">
                            <div className="c-page__composer-chips">
                                {COMPOSER_CHIPS.map((chip) => (
                                    <button key={chip.id} type="button" className="c-page__composer-chip">
                                        {chip.icon}
                                        <span>{chip.label}</span>
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="c-page__composer-submit"
                                disabled={!draft.trim()}
                                onClick={handlePublish}
                            >
                                Опубликовать
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="c-page__info-cards">
                        {INFO_CARDS.map((card) => (
                            <button key={card.id} type="button" className={`c-page__info-card c-page__info-card--${card.tone}`}>
                                <span className="c-page__info-icon">{card.icon}</span>
                                <span>
                                    <em>{card.eyebrow}</em>
                                    <strong>{card.title}</strong>
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="c-page__filters">
                        <div className="c-page__filter-pills">
                            {FILTERS.map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    className={`c-page__pill${filter === f ? ' is-active' : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <button type="button" className="c-page__filters-btn" aria-label="Фильтры">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                                <path d="M4 7h16M7 12h10M10 17h4" strokeLinecap="round" />
                            </svg>
                            Фильтры
                        </button>
                    </div>

                    <article className="c-post">
                        <header className="c-post__head">
                            <img className="c-post__avatar" src={DEMO_POST.avatar} alt="" />
                            <div className="c-post__meta">
                                <strong>{DEMO_POST.author}</strong>
                                <span>
                                    в «{constellation.label}» · {DEMO_POST.time}
                                </span>
                            </div>
                            <button type="button" className="c-post__more" aria-label="Ещё">
                                {MenuIcons.more}
                            </button>
                        </header>

                        <h2 className="c-post__title">{DEMO_POST.title}</h2>
                        <p className="c-post__text">{DEMO_POST.text}</p>

                        <div className="c-post__tags">
                            {DEMO_POST.tags.map((tag) => (
                                <span key={tag}>{tag}</span>
                            ))}
                        </div>

                        <div className="c-post__media">
                            <pre className="c-post__code"><code>{DEMO_POST.code}</code></pre>
                            <div className="c-post__gallery">
                                <img src={DEMO_POST.images[imgIndex]} alt="" />
                                <button
                                    type="button"
                                    className="c-post__nav c-post__nav--prev"
                                    aria-label="Назад"
                                    onClick={() => setImgIndex((i) => (i - 1 + DEMO_POST.images.length) % DEMO_POST.images.length)}
                                >
                                    ‹
                                </button>
                                <button
                                    type="button"
                                    className="c-post__nav c-post__nav--next"
                                    aria-label="Вперёд"
                                    onClick={() => setImgIndex((i) => (i + 1) % DEMO_POST.images.length)}
                                >
                                    ›
                                </button>
                                <span className="c-post__counter">{imgIndex + 1}/{DEMO_POST.images.length}</span>
                            </div>
                        </div>

                        <footer className="c-post__footer">
                            <button
                                type="button"
                                className={`c-post__action${liked ? ' is-active' : ''}`}
                                onClick={() => setLiked((v) => !v)}
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                                    <path
                                        d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"
                                        fill={liked ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                    />
                                </svg>
                                {DEMO_POST.likes + (liked ? 1 : 0)}
                            </button>
                            <button type="button" className="c-post__action">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                                    <path d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v7.2a1.5 1.5 0 0 1-1.5 1.5H10l-4.2 3.1V16.7H5A1.5 1.5 0 0 1 3.5 15.2V8A1.5 1.5 0 0 1 5 6.5Z" strokeLinejoin="round" />
                                </svg>
                                {DEMO_POST.comments}
                            </button>
                            <button type="button" className="c-post__action">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                                    <path d="M17 7h4v4M21 7l-7.5 7.5M7 17H3v-4M3 17l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {DEMO_POST.reposts}
                            </button>
                            <button
                                type="button"
                                className={`c-post__action c-post__action--end${saved ? ' is-active' : ''}`}
                                onClick={() => setSaved((v) => !v)}
                                aria-label="В закладки"
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                                    <path
                                        d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.5a1 1 0 0 1 1-1Z"
                                        fill={saved ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </footer>
                    </article>

                    {feedPosts.map((post) => (
                        <article key={post.id} className="c-post c-post--simple">
                            <header className="c-post__head">
                                <img
                                    className="c-post__avatar"
                                    src={post.author?.avatar || FACES[0]}
                                    alt=""
                                />
                                <div className="c-post__meta">
                                    <strong>{post.author?.full_name || post.author?.username || 'Участник'}</strong>
                                    <span>в «{constellation.label}»</span>
                                </div>
                            </header>
                            <p className="c-post__text">{post.content}</p>
                            <PostMedia post={post} className="c-post__media" />
                        </article>
                    ))}
                </>
            )}

            {tab !== 'posts' && (
                <div className="c-page__empty">
                    Раздел «{TABS.find((t) => t.id === tab)?.label}» скоро появится
                </div>
            )}
        </section>
    );
}
