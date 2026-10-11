import React, { useMemo, useState, useEffect } from 'react';

const Icon = ({ name, size = 20, filled = false }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: filled ? 'currentColor' : 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
    pause: <><path d="M8 5h3v14H8z" fill="currentColor" stroke="none" /><path d="M15 5h3v14h-3z" fill="currentColor" stroke="none" /></>,
    next: <><path d="m5 5 10 7-10 7V5Z" fill="currentColor" stroke="none" /><path d="M19 5v14" /></>,
    prev: <><path d="m19 5-10 7 10 7V5Z" fill="currentColor" stroke="none" /><path d="M5 5v14" /></>,
    heart: <path d="M20.8 8.8c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" />,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    volume: <><path d="M4 10v4h4l5 4V6l-5 4H4Z" /><path d="M17 9a5 5 0 0 1 0 6" /><path d="M19.5 6.5a8.5 8.5 0 0 1 0 11" /></>,
    shuffle: <><path d="m18 14 3 3-3 3" /><path d="M3 7h2.5a5 5 0 0 1 4 2l5 6a5 5 0 0 0 4 2H21" /><path d="m18 4 3 3-3 3" /><path d="M3 17h2.5a5 5 0 0 0 3-1" /><path d="M14 8a5 5 0 0 1 4-2h3" /></>,
    music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
    down: <path d="m6 9 6 6 6-6" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
};

const PLAYLISTS = [
  { title: 'На повторе', description: 'Треки, к которым возвращаются', trackIndex: 0, tone: 'violet' },
  { title: 'Ночной маршрут', description: 'Музыка для большого города', trackIndex: 1, tone: 'blue' },
  { title: 'Мягкий свет', description: 'Спокойный вечерний звук', trackIndex: 2, tone: 'orange' },
  { title: 'Весь день в ритме', description: 'Хиты, которые знают все', trackIndex: 0, tone: 'pink' },
];

const formatDuration = (duration) => duration || '—:—';

export function MusicPage({
  tracks = [],
  currentTrack = 0,
  isPlaying = false,
  onPlayToggle,
  onNext,
  onPrev,
  onTrackSelect,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Моя волна');
  const [likedTracks, setLikedTracks] = useState({});
  const [playerOpen, setPlayerOpen] = useState(false);

  const safeTracks = tracks.length ? tracks : [{
    id: 0,
    title: 'Музыка для тебя',
    artist: 'ASTRA',
    album: 'Моя волна',
    duration: '3:20',
    cover: '',
  }];

  const selectedTrack = safeTracks[currentTrack] || safeTracks[0];
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

  const visibleTracks = useMemo(() => safeTracks
    .map((track, index) => ({ ...track, index }))
    .filter((track) => {
      const matchesQuery = `${track.title} ${track.artist} ${track.album || ''}`
        .toLocaleLowerCase()
        .includes(normalizedQuery);
      const matchesTab = activeTab !== 'Избранное' || likedTracks[track.id];
      return matchesQuery && matchesTab;
    }), [safeTracks, normalizedQuery, activeTab, likedTracks]);

  const handleTrackSelect = (index) => {
    if (onTrackSelect) onTrackSelect(index);
    else onPlayToggle?.();
  };

  const toggleLike = (event, trackId) => {
    event.stopPropagation();
    setLikedTracks((current) => ({ ...current, [trackId]: !current[trackId] }));
  };

  const playPlaylist = (index) => handleTrackSelect(index % safeTracks.length);
  const tabs = ['Моя волна', 'Треки', 'Плейлисты', 'Избранное'];

  // Закрытие по Escape
  useEffect(() => {
    if (!playerOpen) return;
    const onKey = (e) => e.key === 'Escape' && setPlayerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playerOpen]);

  return (
    <main className="music-page">

      {/* =====================================================
          ШАПКА
          ===================================================== */}
      <header className="music-header">
        <div className="music-brand-mark"><Icon name="music" size={19} /></div>
        <div className="music-brand-copy">
          <span className="music-brand-name">ASTRA</span>
          <span className="music-brand-caption">music</span>
        </div>
        <label className="music-search">
          <Icon name="search" size={19} />
          <input
            type="search"
            className="music-search-input"
            placeholder="Треки, альбомы и исполнители"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery && (
            <button
              className="music-search-clear"
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Очистить поиск"
            >×</button>
          )}
        </label>
      </header>

      {/* =====================================================
          ТАБЫ
          ===================================================== */}
      <nav className="music-tabs" aria-label="Разделы музыки">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`music-tab ${activeTab === tab ? 'music-tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* =====================================================
          ГЛАВНАЯ
          ===================================================== */}
      {activeTab === 'Моя волна' && !searchQuery && (
        <>
          {/* Большая карточка-плейлист «Моя волна» */}
          <section className="music-hero">
            <div className="music-hero-glow music-hero-glow-one" />
            <div className="music-hero-glow music-hero-glow-two" />
            <div className="music-hero-copy">
              <span className="music-eyebrow">
                <span className="music-live-dot" /> ВАША МУЗЫКА
              </span>
              <h1>Поймай свою<br />волну</h1>
              <p>Любимые треки и новое настроение — в одном месте.</p>
              <button
                className="music-hero-play"
                type="button"
                onClick={() => playPlaylist(0)}
              >
                <Icon name="play" size={18} filled /> Слушать микс
              </button>
            </div>
            <div className="music-hero-art" aria-hidden="true">
              {safeTracks.slice(0, 3).map((track, index) => (
                <div className={`music-hero-cover music-hero-cover-${index + 1}`} key={track.id}>
                  {track.cover ? <img src={track.cover} alt="" /> : <Icon name="music" size={42} />}
                </div>
              ))}
              <div className="music-hero-play-badge"><Icon name="play" size={24} filled /></div>
            </div>
          </section>

          {/* Горизонтальная карусель «Недавно слушали» */}
          <section className="music-section">
            <div className="music-section-heading">
              <div>
                <span className="music-section-kicker">ПРОДОЛЖАЙ СЛУШАТЬ</span>
                <h2>Недавно слушали</h2>
              </div>
              <button
                className="music-text-button"
                type="button"
                onClick={() => setActiveTab('Треки')}
              >
                Все треки <span>→</span>
              </button>
            </div>

            <div className="music-carousel">
              {safeTracks.slice(0, 8).map((track, index) => (
                <button
                  className="music-carousel-card"
                  type="button"
                  key={track.id}
                  onClick={() => handleTrackSelect(index)}
                >
                  <span className="music-carousel-cover">
                    {track.cover
                      ? <img src={track.cover} alt="" />
                      : <span className="music-cover-placeholder"><Icon name="music" /></span>}
                  </span>
                  <span className="music-carousel-title">{track.title}</span>
                  <span className="music-carousel-artist">{track.artist}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Горизонтальная карусель «Подборки дня» */}
          <section className="music-section">
            <div className="music-section-heading">
              <div>
                <span className="music-section-kicker">ПОД ТВОЁ НАСТРОЕНИЕ</span>
                <h2>Подборки дня</h2>
              </div>
              <button
                className="music-text-button"
                type="button"
                onClick={() => setActiveTab('Плейлисты')}
              >
                Все подборки <span>→</span>
              </button>
            </div>

            <div className="music-carousel">
              {PLAYLISTS.map((playlist) => {
                const cover = safeTracks[playlist.trackIndex % safeTracks.length]?.cover;
                return (
                  <button
                    className={`music-carousel-card music-carousel-card-playlist music-playlist-${playlist.tone}`}
                    type="button"
                    key={playlist.title}
                    onClick={() => playPlaylist(playlist.trackIndex)}
                  >
                    <span className="music-carousel-cover music-carousel-cover-playlist">
                      {cover
                        ? <img src={cover} alt="" />
                        : <Icon name="music" size={42} />}
                    </span>
                    <span className="music-carousel-title">{playlist.title}</span>
                    <span className="music-carousel-artist">{playlist.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Топ-треки (первые 5) */}
          <section className="music-section">
            <div className="music-section-heading">
              <div>
                <span className="music-section-kicker">СЛУШАЙ СЕЙЧАС</span>
                <h2>Популярные треки</h2>
              </div>
              <button
                className="music-text-button"
                type="button"
                onClick={() => setActiveTab('Треки')}
              >
                Вся музыка <span>→</span>
              </button>
            </div>

            <div className="music-track-list">
              {safeTracks.slice(0, 5).map((track, index) => (
                <button
                  className={`music-track-row ${index === currentTrack ? 'music-track-row-current' : ''}`}
                  type="button"
                  key={track.id}
                  onClick={() => handleTrackSelect(index)}
                >
                  <span className="music-track-index">
                    {index === currentTrack && isPlaying
                      ? <span className="music-playing-bars"><i /><i /><i /></span>
                      : String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="music-track-cover-wrap">
                    {track.cover
                      ? <img className="music-track-cover" src={track.cover} alt="" />
                      : <span className="music-cover-placeholder"><Icon name="music" /></span>}
                  </span>
                  <span className="music-track-main">
                    <span className="music-track-title">{track.title}</span>
                    <span className="music-track-artist">{track.artist}</span>
                  </span>
                  <span className="music-track-duration">{formatDuration(track.duration)}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* =====================================================
          ТРЕКИ / ИЗБРАННОЕ / ПОИСК
          ===================================================== */}
      {(activeTab === 'Треки' || activeTab === 'Избранное' || searchQuery) && (
        <section className="music-section music-tracks-section">
          <div className="music-section-heading">
            <div>
              <span className="music-section-kicker">СЛУШАЙ СЕЙЧАС</span>
              <h2>
                {activeTab === 'Избранное'
                  ? 'Мне нравится'
                  : searchQuery
                    ? 'Результаты поиска'
                    : 'Популярные треки'}
              </h2>
            </div>
          </div>
          {visibleTracks.length ? (
            <div className="music-track-list">
              {visibleTracks.map((track, index) => (
                <button
                  className={`music-track-row ${track.index === currentTrack ? 'music-track-row-current' : ''}`}
                  type="button"
                  key={track.id}
                  onClick={() => handleTrackSelect(track.index)}
                >
                  <span className="music-track-index">
                    {track.index === currentTrack && isPlaying
                      ? <span className="music-playing-bars"><i /><i /><i /></span>
                      : String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="music-track-cover-wrap">
                    {track.cover
                      ? <img className="music-track-cover" src={track.cover} alt="" />
                      : <span className="music-cover-placeholder"><Icon name="music" /></span>}
                    <span className="music-track-hover-play">
                      <Icon
                        name={track.index === currentTrack && isPlaying ? 'pause' : 'play'}
                        size={17}
                        filled
                      />
                    </span>
                  </span>
                  <span className="music-track-main">
                    <span className="music-track-title">{track.title}</span>
                    <span className="music-track-artist">{track.artist}</span>
                  </span>
                  <span className="music-track-album">{track.album || 'Сингл'}</span>
                  <span className="music-track-duration">{formatDuration(track.duration)}</span>
                  <span className="music-track-actions">
                    <span
                      className={`music-like-button ${likedTracks[track.id] ? 'music-like-active' : ''}`}
                      onClick={(event) => toggleLike(event, track.id)}
                      role="button"
                      tabIndex={0}
                      aria-label={likedTracks[track.id] ? 'Убрать из любимых' : 'Добавить в любимые'}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') toggleLike(event, track.id);
                      }}
                    >
                      <Icon name="heart" size={18} filled={!!likedTracks[track.id]} />
                    </span>
                    <span className="music-track-more"><Icon name="more" size={19} /></span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="music-empty-state">
              <span className="music-empty-icon">
                <Icon name={activeTab === 'Избранное' ? 'heart' : 'search'} size={25} />
              </span>
              <strong>
                {activeTab === 'Избранное' && !searchQuery
                  ? 'Пока нет любимых треков'
                  : 'Ничего не нашлось'}
              </strong>
              <span>
                {activeTab === 'Избранное' && !searchQuery
                  ? 'Отмечай сердцем треки, чтобы собрать свою коллекцию.'
                  : 'Попробуй изменить запрос.'}
              </span>
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          ПЛЕЙЛИСТЫ
          ===================================================== */}
      {activeTab === 'Плейлисты' && (
        <section className="music-section music-playlists-page">
          <div className="music-section-heading">
            <div>
              <span className="music-section-kicker">СОБРАНО ДЛЯ ТЕБЯ</span>
              <h2>Подборки дня</h2>
            </div>
          </div>
          <div className="music-playlist-grid">
            {PLAYLISTS.map((playlist) => {
              const cover = safeTracks[playlist.trackIndex % safeTracks.length]?.cover;
              return (
                <button
                  className={`music-playlist-card music-playlist-${playlist.tone}`}
                  type="button"
                  key={playlist.title}
                  onClick={() => playPlaylist(playlist.trackIndex)}
                >
                  <span className="music-playlist-image">
                    {cover ? <img src={cover} alt="" /> : <Icon name="music" size={42} />}
                    <span className="music-playlist-play"><Icon name="play" size={17} filled /></span>
                  </span>
                  <span className="music-playlist-title">{playlist.title}</span>
                  <span className="music-playlist-description">{playlist.description}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* =====================================================
          МИНИ-ПЛЕЕР (внизу) — тап открывает полный
          ===================================================== */}
      <footer
        className={`music-player-dock ${playerOpen ? 'music-player-dock-hidden' : ''}`}
        onClick={() => setPlayerOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setPlayerOpen(true);
        }}
      >
        {/* 1. Полоса прогресса — СВЕРХУ */}
        <div className="music-dock-progress-line">
          <span style={{ width: '22%' }} />
        </div>

        {/* 2. Фото + название + play — ПОД ней */}
        <div className="music-player-dock-inner">
          <div className="music-dock-track">
            <div className="music-dock-cover-wrap">
              {selectedTrack.cover ? (
                <img src={selectedTrack.cover} alt="" className="music-dock-cover" />
              ) : (
                <span className="music-dock-placeholder">
                  <Icon name="music" size={20} />
                </span>
              )}
            </div>

            <div className="music-dock-copy">
              <strong>{selectedTrack.title}</strong>
              <span>{selectedTrack.artist}</span>
            </div>
          </div>

          <button
            type="button"
            className="music-dock-main-play"
            onClick={(e) => { e.stopPropagation(); onPlayToggle?.(); }}
            aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
          >
            <Icon name={isPlaying ? 'pause' : 'play'} size={22} filled />
          </button>
        </div>
      </footer>

      {/* =====================================================
          ПОЛНОЭКРАННЫЙ ПЛЕЕР
          ===================================================== */}
      <div className={`music-fullscreen ${playerOpen ? 'music-fullscreen-open' : ''}`}>
        <header className="music-fullscreen-header">
          <button
            type="button"
            className="music-fullscreen-down"
            onClick={() => setPlayerOpen(false)}
            aria-label="Свернуть"
          >
            <Icon name="down" size={26} />
          </button>
          <span className="music-fullscreen-caption">Сейчас играет</span>
          <button type="button" className="music-fullscreen-more" aria-label="Ещё">
            <Icon name="more" size={22} />
          </button>
        </header>

        <div className="music-fullscreen-body">
          <div className="music-fullscreen-cover">
            {selectedTrack.cover
              ? <img src={selectedTrack.cover} alt="" />
              : <span className="music-cover-placeholder"><Icon name="music" size={64} /></span>}
          </div>

          <div className="music-fullscreen-info">
            <h1 className="music-fullscreen-title">{selectedTrack.title}</h1>
            <p className="music-fullscreen-artist">{selectedTrack.artist}</p>
            {selectedTrack.album && (
              <p className="music-fullscreen-album">{selectedTrack.album}</p>
            )}
          </div>

          <div className="music-fullscreen-progress">
            <div className="music-progress-track"><span /></div>
            <div className="music-fullscreen-time">
              <span>0:00</span>
              <span>{formatDuration(selectedTrack.duration)}</span>
            </div>
          </div>

          <div className="music-fullscreen-controls">
            <button type="button" className="music-fullscreen-secondary" aria-label="Перемешать">
              <Icon name="shuffle" size={22} />
            </button>
            <button
              type="button"
              className="music-fullscreen-secondary"
              onClick={onPrev}
              aria-label="Предыдущий"
            >
              <Icon name="prev" size={28} />
            </button>
            <button
              type="button"
              className="music-fullscreen-play"
              onClick={onPlayToggle}
              aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
            >
              <Icon name={isPlaying ? 'pause' : 'play'} size={30} filled />
            </button>
            <button
              type="button"
              className="music-fullscreen-secondary"
              onClick={onNext}
              aria-label="Следующий"
            >
              <Icon name="next" size={28} />
            </button>
            <button type="button" className="music-fullscreen-secondary" aria-label="Повтор">
              <Icon name="shuffle" size={22} />
            </button>
          </div>

          <div className="music-fullscreen-actions">
            <button
              type="button"
              className={`music-fullscreen-like ${likedTracks[selectedTrack.id] ? 'music-like-active' : ''}`}
              onClick={() => setLikedTracks((c) => ({ ...c, [selectedTrack.id]: !c[selectedTrack.id] }))}
              aria-label="Нравится"
            >
              <Icon name="heart" size={22} filled={!!likedTracks[selectedTrack.id]} />
            </button>
            <button type="button" className="music-fullscreen-secondary" aria-label="Громкость">
              <Icon name="volume" size={22} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default MusicPage;