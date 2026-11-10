import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PostCard } from '../post/PostCard';
import { MenuIcons } from '../layout/MenuIcons';

const TABS = [
    { id: 'posts', label: 'Публикации', icon: 'home' },
    { id: 'constellations', label: 'Созвездия', icon: 'constellation' },
    { id: 'music', label: 'Музыка', icon: 'music' },
    { id: 'bookmarks', label: 'Закладки', icon: 'bookmarks' },
    { id: 'media', label: 'Медиа', icon: 'explore' },
    { id: 'about', label: 'О себе', icon: 'profile' },
];

function CameraIcon() {
    return (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path fill="currentColor" d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 14.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        </svg>
    );
}

function VerifiedIcon() {
    return (
        <svg className="profile-orbit__verified" viewBox="0 0 22 22" width="18" height="18" aria-label="Подтверждён">
            <circle cx="11" cy="11" r="11" fill="#1d9bf0" />
            <path d="M6.8 11.2 9.6 14l5.6-6.2" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function PinIcon() {
    return (
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
            <path
                d="M8 1.1 9.15 6.15 14.2 8 9.15 9.85 8 14.9 6.85 9.85 1.8 8l5.05-1.85Z"
                fill="currentColor"
            />
        </svg>
    );
}

function pluralRu(n, one, few, many) {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return many;
    if (last === 1) return one;
    if (last >= 2 && last <= 4) return few;
    return many;
}

function stripProtocol(value = '') {
    return value.trim().replace(/^https?:\/\//i, '');
}

function toHref(value = '') {
    const raw = value.trim();
    if (!raw) return '#';
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
}

function formatLinkLabel(value = '') {
    return stripProtocol(value).replace(/\/$/, '');
}

function toTelegramHref(value = '') {
    const raw = value.trim();
    if (!raw) return '#';
    if (/^https?:\/\//i.test(raw)) return raw;
    const handle = raw.replace(/^@/, '').replace(/^t\.me\//i, '');
    return `https://t.me/${handle}`;
}

function formatTelegramLabel(value = '') {
    const raw = value.trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw) || /^t\.me\//i.test(raw)) return formatLinkLabel(raw);
    return raw.startsWith('@') ? raw : `@${raw}`;
}

export function ProfilePage({ posts = [], onCommentCountChange }) {
    const { user, updateProfile, uploadProfileImage } = useAuth();
    const [activeTab, setActiveTab] = useState('posts');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [avatarFailed, setAvatarFailed] = useState(false);
    const [coverFailed, setCoverFailed] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState('');
    const [quote, setQuote] = useState('Идеи, технологии и люди, которые делают этот мир лучше.');
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const [form, setForm] = useState({
        username: '',
        full_name: '',
        bio: '',
        github: '',
        website: '',
        telegram: '',
    });

    const [stats, setStats] = useState({
        following_count: 76,
        followers_count: 128,
        posts_count: 24,
        constellations_count: 6,
    });

    useEffect(() => {
        setAvatarFailed(false);
    }, [user?.avatar]);

    useEffect(() => {
        setCoverFailed(false);
    }, [user?.cover_image]);

    useEffect(() => () => {
        [avatarPreview, coverPreview].forEach((preview) => {
            if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
        });
    }, [avatarPreview, coverPreview]);

    useEffect(() => {
        if (!isEditing) return;
        const links = user?.preferences?.links || {};
        setForm({
            username: user?.username || '',
            full_name: user?.full_name || '',
            bio: user?.bio || '',
            github: links.github || '',
            website: links.website || '',
            telegram: links.telegram || '',
        });
        setAvatarFile(null);
        setAvatarPreview(user?.avatar || '');
        setCoverFile(null);
        setCoverPreview(user?.cover_image || '');
        setError('');
    }, [isEditing, user]);

    useEffect(() => {
        if (!user?.username) return;
        const token = localStorage.getItem('token');
        fetch(`/api/users/${user.username}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!data) return;
                setStats((prev) => ({
                    following_count: data.following_count ?? prev.following_count,
                    followers_count: data.followers_count ?? prev.followers_count,
                    posts_count: data.posts_count ?? prev.posts_count,
                    constellations_count: data.constellations_count ?? prev.constellations_count,
                }));
            })
            .catch(() => {});
    }, [user?.username]);

    if (!user) {
        return <div className="profile-page-loading">Загрузка профиля…</div>;
    }

    const displayedAvatar = avatarPreview || user.avatar || '';
    // Временно: космическая обложка в стиле Elara (игнор сохранённой)
    const displayedCover = coverPreview || '/home/astra-scene.png';
    const ownPosts = posts.filter((post) => post.author?.username === user.username);
    const joinedAt = user.created_at
        ? new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
        : '1 дек. 2010';
    const displayName = user.full_name || user.username;
    const bio = user.bio || 'Твоя вселенная — твои правила.';
    const location = 'Краснодар';
    const links = user.preferences?.links || {};
    const profileLinks = [
        links.github && { key: 'github', label: formatLinkLabel(links.github), href: toHref(links.github) },
        links.website && { key: 'website', label: formatLinkLabel(links.website), href: toHref(links.website) },
        links.telegram && { key: 'telegram', label: formatTelegramLabel(links.telegram), href: toTelegramHref(links.telegram) },
    ].filter(Boolean);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            if (avatarFile) await uploadProfileImage(avatarFile, 'avatar');
            if (coverFile) await uploadProfileImage(coverFile, 'cover');
            await updateProfile({
                username: form.username,
                full_name: form.full_name,
                bio: form.bio,
                links: {
                    github: form.github.trim(),
                    website: form.website.trim(),
                    telegram: form.telegram.trim(),
                },
            });
            setIsEditing(false);
        } catch (submitError) {
            setError(submitError.message || 'Не удалось сохранить профиль');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageChange = (event, imageKind) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Выберите файл JPG, PNG или WebP');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Размер файла не должен превышать 5 МБ');
            return;
        }
        setError('');
        const preview = URL.createObjectURL(file);
        if (imageKind === 'avatar') {
            setAvatarFailed(false);
            setAvatarFile(file);
            setAvatarPreview(preview);
        } else {
            setCoverFailed(false);
            setCoverFile(file);
            setCoverPreview(preview);
            if (!isEditing) {
                uploadProfileImage(file, 'cover').catch((err) => {
                    setError(err.message || 'Не удалось обновить обложку');
                });
            }
        }
    };

    const statCards = [
        { value: stats.followers_count, label: pluralRu(stats.followers_count, 'подписчик', 'подписчика', 'подписчиков') },
        { value: stats.following_count, label: pluralRu(stats.following_count, 'подписка', 'подписки', 'подписок') },
        { value: stats.constellations_count, label: pluralRu(stats.constellations_count, 'созвездие', 'созвездия', 'созвездий') },
        { value: stats.posts_count, label: pluralRu(stats.posts_count, 'публикация', 'публикации', 'публикаций') },
    ];

    return (
        <section className="profile-orbit">
            <header className="profile-orbit__hero">
                <div className="profile-orbit__cover">
                    {!coverFailed && (
                        <img
                            src={displayedCover}
                            alt=""
                            onError={() => setCoverFailed(true)}
                        />
                    )}
                    <div className="profile-orbit__cover-scrim" aria-hidden />

                    <div className="profile-orbit__identity">
                        <div className="profile-orbit__avatar-wrap">
                            <div className="profile-orbit__avatar">
                                {displayedAvatar && !avatarFailed ? (
                                    <img
                                        src={displayedAvatar}
                                        alt={user.username}
                                        onError={() => setAvatarFailed(true)}
                                    />
                                ) : (
                                    <span aria-hidden>{(displayName || '?').charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <span className="profile-orbit__online" title="В сети" />
                        </div>

                        <div className="profile-orbit__who">
                            <div className="profile-orbit__name-row">
                                <h1>{displayName}</h1>
                                <VerifiedIcon />
                            </div>
                            <p className="profile-orbit__handle">@{user.username}</p>
                            <p className="profile-orbit__bio">{bio}</p>
                            <div className="profile-orbit__meta">
                                <span className="profile-orbit__meta-item">
                                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                                        <path d="M12 21s6.5-5.2 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21 12 21Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                                        <circle cx="12" cy="10.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                                    </svg>
                                    {location}
                                </span>
                                <span className="profile-orbit__meta-item">
                                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                                        <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                                        <path d="M8 3v4M16 3v4M4 10h16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                                    </svg>
                                    {joinedAt}
                                </span>
                                {profileLinks.map((link) => (
                                    <a
                                        key={link.key}
                                        className="profile-orbit__meta-link"
                                        href={link.href}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="profile-orbit__actions">
                            <button
                                type="button"
                                className="profile-orbit__edit-btn"
                                onClick={() => setIsEditing(true)}
                            >
                                Редактировать профиль
                            </button>
                            <button type="button" className="profile-orbit__more-btn" aria-label="Ещё">
                                {MenuIcons.more}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <nav className="profile-orbit__tabs" aria-label="Разделы профиля">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`profile-orbit__tab${activeTab === tab.id ? ' is-active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="profile-orbit__tab-icon">{MenuIcons[tab.icon]}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>

            <div className="profile-orbit__stats-row">
                <div className="profile-orbit__stats">
                    {statCards.map((card) => (
                        <div key={card.label} className="profile-orbit__stat">
                            <strong>{card.value}</strong>
                            <span>{card.label}</span>
                        </div>
                    ))}
                </div>
                <div className="profile-orbit__quote">
                    <p>«{quote}»</p>
                    <button
                        type="button"
                        className="profile-orbit__quote-edit"
                        aria-label="Изменить цитату"
                        onClick={() => {
                            const next = window.prompt('Цитата профиля', quote);
                            if (next != null && next.trim()) setQuote(next.trim());
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
                            <path d="M4 17.5V20h2.5L17 9.5 14.5 7 4 17.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                            <path d="M13 8.5 15.5 11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="profile-orbit__feed">
                {activeTab === 'posts' && (
                    ownPosts.length ? (
                        ownPosts.map((post, index) => (
                            <div key={post.id} className="profile-orbit__post">
                                {index === 0 && (
                                    <div className="profile-orbit__pinned">
                                        <PinIcon />
                                        Закреплено
                                    </div>
                                )}
                                <PostCard
                                    post={post}
                                    onCommentCountChange={onCommentCountChange}
                                    variant="orbit"
                                />
                            </div>
                        ))
                    ) : (
                        <div className="profile-orbit__empty">У вас пока нет публикаций</div>
                    )
                )}

                {activeTab === 'about' && (
                    <div className="profile-orbit__about-panel">
                        <h2>О себе</h2>
                        <p>{bio}</p>
                        <p>Локация: {location}</p>
                        <p>На Elara с {joinedAt}</p>
                    </div>
                )}

                {activeTab !== 'posts' && activeTab !== 'about' && (
                    <div className="profile-orbit__empty">
                        Раздел «{TABS.find((t) => t.id === activeTab)?.label}» скоро появится
                    </div>
                )}
            </div>

            {isEditing && (
                <div
                    className="modal-overlay profile-edit-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !isSaving) setIsEditing(false);
                    }}
                >
                    <form className="profile-edit-dialog" onSubmit={handleSubmit}>
                        <div className="profile-edit-header">
                            <button type="button" className="profile-edit-close" onClick={() => setIsEditing(false)} aria-label="Закрыть">×</button>
                            <h2>Редактировать профиль</h2>
                            <button type="submit" className="profile-edit-save" disabled={isSaving}>
                                {isSaving ? 'Сохранение…' : 'Сохранить'}
                            </button>
                        </div>

                        {error && <div className="profile-edit-error" role="alert">{error}</div>}

                        <div className="profile-edit-media-preview">
                            <div className="profile-edit-cover-preview">
                                {coverPreview && !coverFailed && (
                                    <img src={coverPreview} alt="Предпросмотр обложки" onError={() => setCoverFailed(true)} />
                                )}
                                <button type="button" className="profile-camera-button profile-cover-camera" aria-label="Изменить обложку" onClick={() => coverInputRef.current?.click()}>
                                    <CameraIcon />
                                </button>
                            </div>
                            <div className="profile-edit-avatar-preview">
                                {(displayName || '?').charAt(0).toUpperCase()}
                                {avatarPreview && !avatarFailed && (
                                    <img src={avatarPreview} alt="Предпросмотр фото профиля" onError={() => setAvatarFailed(true)} />
                                )}
                                <button type="button" className="profile-camera-button profile-avatar-camera" aria-label="Изменить фото профиля" onClick={() => avatarInputRef.current?.click()}>
                                    <CameraIcon />
                                </button>
                            </div>
                            <input ref={avatarInputRef} className="profile-edit-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageChange(event, 'avatar')} />
                            <input ref={coverInputRef} className="profile-edit-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageChange(event, 'cover')} />
                            <p className="profile-edit-media-hint">Нажмите на камеру, чтобы изменить фото или обложку. JPG, PNG или WebP, до 5 МБ.</p>
                        </div>

                        <label className="profile-edit-field">
                            Имя пользователя
                            <input
                                value={form.username}
                                onChange={(event) => setForm({ ...form, username: event.target.value })}
                                minLength={1}
                                maxLength={50}
                                required
                            />
                        </label>
                        <label className="profile-edit-field">
                            Отображаемое имя
                            <input
                                value={form.full_name}
                                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                                maxLength={100}
                            />
                        </label>
                        <label className="profile-edit-field">
                            О себе
                            <textarea
                                value={form.bio}
                                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                                maxLength={500}
                                rows={4}
                            />
                            <span className="profile-edit-counter">{form.bio.length}/500</span>
                        </label>

                        <div className="profile-edit-links">
                            <p className="profile-edit-links-title">Ссылки</p>
                            <label className="profile-edit-field">
                                GitHub
                                <input
                                    value={form.github}
                                    onChange={(event) => setForm({ ...form, github: event.target.value })}
                                    placeholder="github.com/username"
                                    maxLength={200}
                                    inputMode="url"
                                    autoComplete="url"
                                />
                            </label>
                            <label className="profile-edit-field">
                                Сайт
                                <input
                                    value={form.website}
                                    onChange={(event) => setForm({ ...form, website: event.target.value })}
                                    placeholder="example.com"
                                    maxLength={200}
                                    inputMode="url"
                                    autoComplete="url"
                                />
                            </label>
                            <label className="profile-edit-field">
                                Telegram
                                <input
                                    value={form.telegram}
                                    onChange={(event) => setForm({ ...form, telegram: event.target.value })}
                                    placeholder="@username или t.me/username"
                                    maxLength={200}
                                />
                            </label>
                        </div>
                    </form>
                </div>
            )}
        </section>
    );
}
