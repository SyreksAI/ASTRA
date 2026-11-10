import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';

const TABS = ['Музыка', 'Радио', 'Моя музыка', 'Для тебя'];

const QUICK_TILES = [
    { id: 'mine', label: 'Моя музыка', icon: 'library' },
    { id: 'new', label: 'Новые релизы', icon: 'spark' },
    { id: 'playlists', label: 'Плейлисты', icon: 'list' },
    { id: 'radio', label: 'Радио', icon: 'radio' },
    { id: 'foryou', label: 'Для тебя', icon: 'star' },
];

const POPULAR = [
    { id: 'p1', title: 'Космос внутри', subtitle: 'Плейлист', cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop', trackIndex: 0 },
    { id: 'p2', title: 'Глубокий звук', subtitle: 'Микс', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop', trackIndex: 1 },
    { id: 'p3', title: 'В дороге', subtitle: 'Плейлист', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', trackIndex: 2 },
    { id: 'p4', title: 'Focus', subtitle: 'Для работы', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', trackIndex: 3 },
    { id: 'p5', title: 'AI Vibes', subtitle: 'Elara Mix', cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop', trackIndex: 4 },
];

const CURATED = [
    { id: 'c1', title: 'Спокойствие', plays: '128K', cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop', trackIndex: 0 },
    { id: 'c2', title: 'Энергия', plays: '94K', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=400&fit=crop', trackIndex: 1 },
    { id: 'c3', title: 'Продуктивность', plays: '76K', cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop', trackIndex: 2 },
];

function Icon({ name, size = 18 }) {
    const common = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
    };
    const paths = {
        search: <><circle cx="11" cy="11" r="6.5" /><path d="m16.2 16.2 3.3 3.3" /></>,
        play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
        pause: <><path d="M8 5h3v14H8z" fill="currentColor" stroke="none" /><path d="M15 5h3v14h-3z" fill="currentColor" stroke="none" /></>,
        next: <><path d="m5 5 10 7-10 7V5Z" fill="currentColor" stroke="none" /><path d="M19 5v14" /></>,
        prev: <><path d="m19 5-10 7 10 7V5Z" fill="currentColor" stroke="none" /><path d="M5 5v14" /></>,
        heart: <path d="M20.8 8.8c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" />,
        dislike: <path d="M10 14H5.5A2.5 2.5 0 0 1 3 11.5V10a2 2 0 0 1 2-2h3l1.2-4.2A1.8 1.8 0 0 1 11 2.5h.4a1.2 1.2 0 0 1 1.2 1.4L12 7h5.2A2.8 2.8 0 0 1 20 9.8V11a3 3 0 0 1-3 3h-2.2l-.8 5.2A1.6 1.6 0 0 1 12.4 21H12a2 2 0 0 1-2-2v-5Z" />,
        more: <><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></>,
        volume: <><path d="M4 10v4h4l5 4V6l-5 4H4Z" /><path d="M17 9a5 5 0 0 1 0 6" /></>,
        shuffle: <><path d="m18 14 3 3-3 3" /><path d="M3 7h2.5a5 5 0 0 1 4 2l5 6a5 5 0 0 0 4 2H21" /><path d="m18 4 3 3-3 3" /><path d="M3 17h2.5a5 5 0 0 0 3-1" /></>,
        repeat: <><path d="M7 7h10v3l3-3.5L17 3v3H6a3 3 0 0 0-3 3v3" /><path d="M17 17H7v-3l-3 3.5L7 21v-3h11a3 3 0 0 0 3-3v-3" /></>,
        queue: <><path d="M8 6h13v3H8zM8 11h13v3H8zM8 16h13v3H8z" /><circle cx="4.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="17.5" r="1.2" fill="currentColor" stroke="none" /></>,
        expand: <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />,
        collapse: <path d="m6 10 6 6 6-6" />,
        bell: <><path d="M8 18h8M9.5 18a5.5 5.5 0 1 1 5 0" /><path d="M12 3.5v1.2" /></>,
        chevron: <path d="m9 6 6 6-6 6" />,
        library: <><path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H10v16H6.5A1.5 1.5 0 0 1 5 18.5v-13Z" /><path d="M14 4h3.5A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14V4Z" /><path d="M10 4h4v16h-4V4Z" /></>,
        spark: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />,
        list: <><path d="M8 7h12M8 12h12M8 17h12" /><circle cx="4.5" cy="7" r="1" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4.5" cy="17" r="1" fill="currentColor" stroke="none" /></>,
        radio: <><circle cx="12" cy="13" r="3" /><path d="M5 13a7 7 0 0 1 14 0" /><path d="M8.5 7.5 18 4" /></>,
        star: <path d="m12 3.5 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.8 7.2 18.4l.9-5.4L4.2 9.2l5.4-.8L12 3.5Z" />,
        share: <><circle cx="18" cy="5" r="2.4" /><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="19" r="2.4" /><path d="m8.2 13.2 7.6 4.2M15.8 6.6l-7.6 4.2" /></>,
        lyrics: <><path d="M5 5h14v14H5z" /><path d="M8 9h8M8 12h8M8 15h5" /></>,
        close: <path d="M6 6l12 12M18 6 6 18" />,
    };
    return <svg {...common}>{paths[name]}</svg>;
}

export function MusicPage({
    tracks = [],
    currentTrack = 0,
    isPlaying = false,
    onPlayToggle,
    onNext,
    onPrev,
    onTrackSelect,
}) {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Музыка');
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [playerOpen, setPlayerOpen] = useState(false);
    const [playerPanel, setPlayerPanel] = useState(null);

    const safeTracks = useMemo(() => {
        if (tracks.length >= 7) return tracks;
        const extras = [
            { id: 4, title: 'Orbit Glow', artist: 'Elara Music', album: 'Focus', duration: '2:48', cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop' },
            { id: 5, title: 'Лунный рёпот', artist: 'Сигнал', album: 'Night', duration: '3:05', cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&h=120&fit=crop' },
            { id: 6, title: 'Пульс города', artist: 'Три дня дождя', album: 'Live', duration: '3:41', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop' },
            { id: 7, title: 'Тихий космос', artist: 'Elara AI', album: 'Calm', duration: '4:02', cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&h=120&fit=crop' },
        ];
        const base = tracks.length
            ? tracks
            : [
                { id: 1, title: 'Космос внутри', artist: 'Три дня дождя', album: 'Orbit', duration: '3:27', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&h=120&fit=crop' },
                { id: 2, title: 'Night Signals', artist: 'Elara Music', album: 'Orbit', duration: '3:48', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&h=120&fit=crop' },
                { id: 3, title: 'Soft Horizon', artist: 'Elara Music', album: 'Orbit', duration: '3:12', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop' },
            ];
        return [...base, ...extras].slice(0, 7);
    }, [tracks]);

    const selected = safeTracks[currentTrack] || safeTracks[0];
    const userInitial = String(user?.full_name || user?.username || 'A').charAt(0).toUpperCase();
    const queueTracks = useMemo(() => {
        if (!safeTracks.length) return [];
        return [...safeTracks.slice(currentTrack + 1), ...safeTracks.slice(0, currentTrack)];
    }, [safeTracks, currentTrack]);

    useEffect(() => {
        if (!playerOpen) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setPlayerOpen(false);
                setPlayerPanel(null);
            }
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [playerOpen]);

    const playIndex = (index) => {
        onTrackSelect?.(index);
    };

    const stop = (e) => e.stopPropagation();

    return (
        <main className="astra-music">
            <header className="astra-music__top">
                <label className="astra-music__search">
                    <Icon name="search" size={16} />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск треков, артистов, альбомов..."
                    />
                </label>

                <nav className="astra-music__tabs" aria-label="Разделы музыки">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            className={`astra-music__tab${activeTab === tab ? ' is-active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="astra-music__top-actions">
                    <button type="button" className="astra-music__icon-btn" aria-label="Уведомления">
                        <Icon name="bell" />
                        <i className="astra-music__dot" />
                    </button>
                    <button type="button" className="astra-music__avatar" aria-label="Профиль">
                        {user?.avatar ? <img src={user.avatar} alt="" /> : <span>{userInitial}</span>}
                    </button>
                </div>
            </header>

            <div className="astra-music__scroll">
                <section className="astra-music__hero">
                    <img className="astra-music__hero-bg" src="/music/hero-universe.png?v=2" alt="" />
                    <div className="astra-music__hero-copy">
                        <h1>Музыка в твоей вселенной</h1>
                        <p>Открывай новые звуки, плейлисты и миксы в спокойном стиле Elara.</p>
                        <button
                            type="button"
                            className="astra-music__hero-cta"
                            onClick={() => playIndex(0)}
                        >
                            <Icon name="play" size={16} />
                            Слурать
                        </button>
                    </div>
                </section>

                <section className="astra-music__tiles" aria-label="Быстрые разделы">
                    {QUICK_TILES.map((tile) => (
                        <button key={tile.id} type="button" className="astra-music__tile">
                            <span className="astra-music__tile-icon"><Icon name={tile.icon} size={16} /></span>
                            <span>{tile.label}</span>
                            <Icon name="chevron" size={14} />
                        </button>
                    ))}
                </section>

                <div className="astra-music__split">
                    <div className="astra-music__main-col">
                        <section className="astra-music__block">
                            <div className="astra-music__block-head">
                                <h2>Популярное сейчас</h2>
                                <button type="button">Все</button>
                            </div>
                            <div className="astra-music__popular">
                                {POPULAR.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className="astra-music__card"
                                        onClick={() => playIndex(item.trackIndex % safeTracks.length)}
                                    >
                                        <span className="astra-music__card-cover">
                                            <img src={item.cover} alt="" />
                                            <span className="astra-music__card-play" aria-hidden>
                                                <Icon name="play" size={14} />
                                            </span>
                                        </span>
                                        <strong>{item.title}</strong>
                                        <em>{item.subtitle}</em>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="astra-music__block astra-music__block--curated">
                            <div className="astra-music__block-head">
                                <h2>Подборки для тебя</h2>
                                <button type="button">Все</button>
                            </div>
                            <div className="astra-music__curated">
                                {CURATED.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className="astra-music__curated-card"
                                        onClick={() => playIndex(item.trackIndex % safeTracks.length)}
                                    >
                                        <img src={item.cover} alt="" />
                                        <span className="astra-music__curated-copy">
                                            <strong>{item.title}</strong>
                                            <em>Плейлист · {item.plays}</em>
                                        </span>
                                        <span className="astra-music__card-play" aria-hidden>
                                            <Icon name="play" size={14} />
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="astra-music__tops">
                        <div className="astra-music__block-head">
                            <h2>Топ треков</h2>
                        </div>
                        <ol className="astra-music__top-list">
                            {safeTracks.map((track, index) => (
                                <li key={track.id}>
                                    <button
                                        type="button"
                                        className={`astra-music__top-row${currentTrack === index ? ' is-current' : ''}`}
                                        onClick={() => playIndex(index)}
                                    >
                                        <span className="astra-music__top-rank">{index + 1}</span>
                                        <img src={track.cover} alt="" />
                                        <span className="astra-music__top-meta">
                                            <strong>{track.title}</strong>
                                            <em>{track.artist}</em>
                                        </span>
                                        <span className="astra-music__top-dur">{track.duration}</span>
                                        <span className="astra-music__top-more" aria-hidden>
                                            <Icon name="more" size={14} />
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ol>
                    </aside>
                </div>
            </div>

            <footer
                className="astra-music__dock"
                role="button"
                tabIndex={0}
                aria-label="Открыть плеер"
                onClick={() => { setPlayerPanel(null); setPlayerOpen(true); }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setPlayerPanel(null);
                        setPlayerOpen(true);
                    }
                }}
            >
                <div className="astra-music__dock-track">
                    <img src={selected.cover} alt="" />
                    <div>
                        <strong>{selected.title}</strong>
                        <em>{selected.artist}</em>
                    </div>
                    <button
                        type="button"
                        className={`astra-music__icon-btn${liked ? ' is-liked' : ''}`}
                        aria-label="В избранное"
                        onClick={(e) => { stop(e); setLiked((v) => !v); }}
                    >
                        <Icon name="heart" size={16} />
                    </button>
                    <button type="button" className="astra-music__icon-btn" aria-label="Ещё" onClick={stop}>
                        <Icon name="more" size={16} />
                    </button>
                </div>

                <div className="astra-music__dock-controls" onClick={stop}>
                    <div className="astra-music__dock-buttons">
                        <button type="button" className="astra-music__icon-btn" aria-label="Перемерать">
                            <Icon name="shuffle" size={16} />
                        </button>
                        <button type="button" className="astra-music__icon-btn" aria-label="Предыдущий" onClick={onPrev}>
                            <Icon name="prev" size={16} />
                        </button>
                        <button
                            type="button"
                            className="astra-music__dock-play"
                            aria-label={isPlaying ? 'Пауза' : '�грать'}
                            onClick={onPlayToggle}
                        >
                            <Icon name={isPlaying ? 'pause' : 'play'} size={18} />
                        </button>
                        <button type="button" className="astra-music__icon-btn" aria-label="Следующий" onClick={onNext}>
                            <Icon name="next" size={16} />
                        </button>
                        <button type="button" className="astra-music__icon-btn" aria-label="Повтор">
                            <Icon name="repeat" size={16} />
                        </button>
                    </div>
                    <div className="astra-music__dock-progress">
                        <span>1:24</span>
                        <div className="astra-music__progress-bar" aria-hidden>
                            <i style={{ width: '42%' }} />
                        </div>
                        <span>{selected.duration || '3:27'}</span>
                    </div>
                </div>

                <div className="astra-music__dock-extra" onClick={stop}>
                    <button type="button" className="astra-music__icon-btn" aria-label="Громкость">
                        <Icon name="volume" size={16} />
                    </button>
                    <div className="astra-music__volume" aria-hidden>
                        <i style={{ width: '65%' }} />
                    </div>
                    <button
                        type="button"
                        className="astra-music__icon-btn"
                        aria-label="Очередь"
                        onClick={() => { setPlayerPanel('queue'); setPlayerOpen(true); }}
                    >
                        <Icon name="queue" size={16} />
                    </button>
                    <button
                        type="button"
                        className="astra-music__icon-btn"
                        aria-label="Развернуть плеер"
                        onClick={() => { setPlayerPanel(null); setPlayerOpen(true); }}
                    >
                        <Icon name="expand" size={16} />
                    </button>
                </div>
            </footer>

            {playerOpen && createPortal(
                <div
                    className={`astra-music__fullplayer${playerPanel ? ' has-panel' : ''}`}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Плеер"
                >
                    <div
                        className="astra-music__fullplayer-bg"
                        style={{ backgroundImage: `url(${selected.cover})` }}
                        aria-hidden
                    />
                    <div className="astra-music__fullplayer-shade" aria-hidden />

                    <header className="astra-music__fullplayer-top">
                        <button
                            type="button"
                            className="astra-music__fullplayer-collapse"
                            aria-label="Свернуть"
                            onClick={() => { setPlayerOpen(false); setPlayerPanel(null); }}
                        >
                            <Icon name="collapse" size={22} />
                        </button>
                        <div className="astra-music__fullplayer-context">
                            <em>Сейчас играет</em>
                            <strong>{selected.album || 'Elara Music'}</strong>
                        </div>
                        <button type="button" className="astra-music__icon-btn astra-music__fullplayer-more" aria-label="Ещё">
                            <Icon name="more" size={18} />
                        </button>
                    </header>

                    <div className="astra-music__fullplayer-body">
                        <div className="astra-music__fullplayer-stage">
                            <div className="astra-music__fullplayer-cover">
                                <img src={selected.cover} alt="" />
                            </div>

                            <div className="astra-music__fullplayer-meta">
                                <div className="astra-music__fullplayer-title-row">
                                    <div className="astra-music__fullplayer-titles">
                                        <h2>{selected.title}</h2>
                                        <p>{selected.artist}</p>
                                    </div>
                                </div>

                                <div className="astra-music__fullplayer-progress">
                                    <div className="astra-music__progress-bar astra-music__progress-bar--lg" aria-hidden>
                                        <i style={{ width: '42%' }} />
                                    </div>
                                    <div className="astra-music__fullplayer-times">
                                        <span>1:24</span>
                                        <span>{selected.duration || '3:27'}</span>
                                    </div>
                                </div>

                                <div className="astra-music__fullplayer-controls">
                                    <button
                                        type="button"
                                        className={`astra-music__icon-btn${disliked ? ' is-disliked' : ''}`}
                                        aria-label="Не нравится"
                                        onClick={() => {
                                            setDisliked((v) => !v);
                                            if (!disliked) setLiked(false);
                                        }}
                                    >
                                        <Icon name="dislike" size={22} />
                                    </button>
                                    <button type="button" className="astra-music__icon-btn" aria-label="Предыдущий" onClick={onPrev}>
                                        <Icon name="prev" size={24} />
                                    </button>
                                    <button
                                        type="button"
                                        className="astra-music__fullplayer-play"
                                        aria-label={isPlaying ? 'Пауза' : '�грать'}
                                        onClick={onPlayToggle}
                                    >
                                        <Icon name={isPlaying ? 'pause' : 'play'} size={28} />
                                    </button>
                                    <button type="button" className="astra-music__icon-btn" aria-label="Следующий" onClick={onNext}>
                                        <Icon name="next" size={24} />
                                    </button>
                                    <button
                                        type="button"
                                        className={`astra-music__icon-btn${liked ? ' is-liked' : ''}`}
                                        aria-label="Нравится"
                                        onClick={() => {
                                            setLiked((v) => !v);
                                            if (!liked) setDisliked(false);
                                        }}
                                    >
                                        <Icon name="heart" size={22} />
                                    </button>
                                </div>

                                <div className="astra-music__fullplayer-tools">
                                    <button type="button" className="astra-music__icon-btn" aria-label="Громкость">
                                        <Icon name="volume" size={18} />
                                    </button>
                                    <div className="astra-music__volume astra-music__volume--lg" aria-hidden>
                                        <i style={{ width: '65%' }} />
                                    </div>
                                    <span className="astra-music__fullplayer-tools-spacer" />
                                    <button
                                        type="button"
                                        className={`astra-music__fullplayer-chip${playerPanel === 'lyrics' ? ' is-active' : ''}`}
                                        onClick={() => setPlayerPanel((v) => (v === 'lyrics' ? null : 'lyrics'))}
                                    >
                                        Текст
                                    </button>
                                    <button
                                        type="button"
                                        className={`astra-music__fullplayer-chip${playerPanel === 'queue' ? ' is-active' : ''}`}
                                        onClick={() => setPlayerPanel((v) => (v === 'queue' ? null : 'queue'))}
                                    >
                                        Очередь
                                    </button>
                                </div>
                            </div>
                        </div>

                        {playerPanel && (
                            <aside className="astra-music__fullplayer-side">
                                <div className="astra-music__fullplayer-side-head">
                                    <strong>{playerPanel === 'queue' ? 'Очередь' : 'Текст'}</strong>
                                    <button
                                        type="button"
                                        className="astra-music__icon-btn"
                                        aria-label="Закрыть"
                                        onClick={() => setPlayerPanel(null)}
                                    >
                                        <Icon name="close" size={16} />
                                    </button>
                                </div>

                                {playerPanel === 'queue' ? (
                                    <div className="astra-music__fullplayer-queue">
                                        <p className="astra-music__fullplayer-queue-label">Сейчас играет</p>
                                        <button
                                            type="button"
                                            className="astra-music__fullplayer-queue-row is-current"
                                            onClick={() => playIndex(currentTrack)}
                                        >
                                            <img src={selected.cover} alt="" />
                                            <span>
                                                <strong>{selected.title}</strong>
                                                <em>{selected.artist}</em>
                                            </span>
                                            <b>{selected.duration}</b>
                                        </button>
                                        {queueTracks.length > 0 && (
                                            <p className="astra-music__fullplayer-queue-label">Далее</p>
                                        )}
                                        {queueTracks.map((track) => {
                                            const index = safeTracks.findIndex((t) => t.id === track.id);
                                            return (
                                                <button
                                                    key={track.id}
                                                    type="button"
                                                    className="astra-music__fullplayer-queue-row"
                                                    onClick={() => playIndex(index)}
                                                >
                                                    <img src={track.cover} alt="" />
                                                    <span>
                                                        <strong>{track.title}</strong>
                                                        <em>{track.artist}</em>
                                                    </span>
                                                    <b>{track.duration}</b>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="astra-music__fullplayer-lyrics">
                                        <p>Свет далёких станций</p>
                                        <p className="is-active">ложится на ладони</p>
                                        <p>и космос внутри</p>
                                        <p>звучит тире ночи</p>
                                        <p>мы держим орбиту</p>
                                        <p>пока не погаснет эхо</p>
                                        <p>и снова в путь</p>
                                        <p>сквозь мягкий рум</p>
                                    </div>
                                )}
                            </aside>
                        )}
                    </div>
                </div>,
                document.body,
            )}
        </main>
    );
}
