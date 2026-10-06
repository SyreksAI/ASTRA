import React, { useMemo, useState } from 'react';

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
  const [activeTab, setActiveTab] = useState('Главная');
  const [likedTracks, setLikedTracks] = useState({});
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
  const tabs = ['Главная', 'Треки', 'Плейлисты', 'Избранное'];

  return (
    <main className="music-page">
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
          {searchQuery && <button className="music-search-clear" type="button" onClick={() => setSearchQuery('')} aria-label="Очистить поиск">×</button>}
        </label>
      </header>

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

      {activeTab === 'Главная' && !searchQuery && (
        <>
          <section className="music-hero">
            <div className="music-hero-glow music-hero-glow-one" />
            <div className="music-hero-glow music-hero-glow-two" />
            <div className="music-hero-copy">
              <span className="music-eyebrow"><span className="music-live-dot" /> ВАША МУЗЫКА</span>
              <h1>Поймай свою<br />волну</h1>
              <p>Любимые треки и новое настроение — в одном месте.</p>
              <button className="music-hero-play" type="button" onClick={() => playPlaylist(0)}>
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

          <section className="music-section music-recent-section">
            <div className="music-section-heading">
              <div><span className="music-section-kicker">ПРОДОЛЖАЙ СЛУШАТЬ</span><h2>Недавно слушали</h2></div>
              <button className="music-text-button" type="button" onClick={() => setActiveTab('Треки')}>Все треки <span>→</span></button>
            </div>
            <div className="music-recent-grid">
              {safeTracks.slice(0, 3).map((track, index) => (
                <button className="music-recent-card" type="button" key={track.id} onClick={() => handleTrackSelect(index)}>
                  <span className="music-recent-cover-wrap">
                    {track.cover ? <img src={track.cover} alt="" className="music-recent-cover" /> : <span className="music-cover-placeholder"><Icon name="music" /></span>}
                    <span className="music-card-play"><Icon name="play" size={17} filled /></span>
                  </span>
                  <span className="music-recent-title">{track.title}</span>
                  <span className="music-recent-artist">{track.artist}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="music-section music-playlists-section">
            <div className="music-section-heading">
              <div><span className="music-section-kicker">ПОД ТВОЁ НАСТРОЕНИЕ</span><h2>Подборки дня</h2></div>
              <button className="music-text-button" type="button" onClick={() => setActiveTab('Плейлисты')}>Все подборки <span>→</span></button>
            </div>
            <div className="music-playlist-grid">
              {PLAYLISTS.map((playlist, index) => {
                const cover = safeTracks[playlist.trackIndex % safeTracks.length]?.cover;
                return (
                  <button className={`music-playlist-card music-playlist-${playlist.tone}`} type="button" key={playlist.title} onClick={() => playPlaylist(playlist.trackIndex)}>
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
        </>
      )}

      {(activeTab === 'Треки' || activeTab === 'Избранное' || searchQuery || activeTab === 'Главная') && (
        <section className="music-section music-tracks-section">
          <div className="music-section-heading">
            <div><span className="music-section-kicker">СЛУШАЙ СЕЙЧАС</span><h2>{activeTab === 'Избранное' ? 'Мне нравится' : searchQuery ? 'Результаты поиска' : 'Популярные треки'}</h2></div>
            {activeTab === 'Главная' && <button className="music-text-button" type="button" onClick={() => setActiveTab('Треки')}>Вся музыка <span>→</span></button>}
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
                  <span className="music-track-index">{track.index === currentTrack && isPlaying ? <span className="music-playing-bars"><i /><i /><i /></span> : String(index + 1).padStart(2, '0')}</span>
                  <span className="music-track-cover-wrap">
                    {track.cover ? <img className="music-track-cover" src={track.cover} alt="" /> : <span className="music-cover-placeholder"><Icon name="music" /></span>}
                    <span className="music-track-hover-play"><Icon name={track.index === currentTrack && isPlaying ? 'pause' : 'play'} size={17} filled /></span>
                  </span>
                  <span className="music-track-main"><span className="music-track-title">{track.title}</span><span className="music-track-artist">{track.artist}</span></span>
                  <span className="music-track-album">{track.album || 'Сингл'}</span>
                  <span className="music-track-duration">{formatDuration(track.duration)}</span>
                  <span className="music-track-actions">
                    <span className={`music-like-button ${likedTracks[track.id] ? 'music-like-active' : ''}`} onClick={(event) => toggleLike(event, track.id)} role="button" tabIndex={0} aria-label={likedTracks[track.id] ? 'Убрать из любимых' : 'Добавить в любимые'} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') toggleLike(event, track.id); }}>
                      <Icon name="heart" size={18} filled={!!likedTracks[track.id]} />
                    </span>
                    <span className="music-track-more"><Icon name="more" size={19} /></span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="music-empty-state">
              <span className="music-empty-icon"><Icon name={activeTab === 'Избранное' ? 'heart' : 'search'} size={25} /></span>
              <strong>{activeTab === 'Избранное' && !searchQuery ? 'Пока нет любимых треков' : 'Ничего не нашлось'}</strong>
              <span>{activeTab === 'Избранное' && !searchQuery ? 'Отмечай сердцем треки, чтобы собрать свою коллекцию.' : 'Попробуй изменить запрос.'}</span>
            </div>
          )}
        </section>
      )}

      {activeTab === 'Плейлисты' && (
        <section className="music-section music-playlists-section music-playlists-page">
          <div className="music-section-heading"><div><span className="music-section-kicker">СОБРАНО ДЛЯ ТЕБЯ</span><h2>Подборки дня</h2></div></div>
          <div className="music-playlist-grid">
            {PLAYLISTS.map((playlist) => {
              const cover = safeTracks[playlist.trackIndex % safeTracks.length]?.cover;
              return (
                <button className={`music-playlist-card music-playlist-${playlist.tone}`} type="button" key={playlist.title} onClick={() => playPlaylist(playlist.trackIndex)}>
                  <span className="music-playlist-image">{cover ? <img src={cover} alt="" /> : <Icon name="music" size={42} />}<span className="music-playlist-play"><Icon name="play" size={17} filled /></span></span>
                  <span className="music-playlist-title">{playlist.title}</span><span className="music-playlist-description">{playlist.description}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <footer className="music-player-dock">
        <div className="music-dock-track">
          {selectedTrack.cover ? <img src={selectedTrack.cover} alt="" className="music-dock-cover" /> : <span className="music-dock-placeholder"><Icon name="music" /></span>}
          <div className="music-dock-copy"><strong>{selectedTrack.title}</strong><span>{selectedTrack.artist}</span></div>
          <button className={`music-dock-like ${likedTracks[selectedTrack.id] ? 'music-like-active' : ''}`} type="button" onClick={() => setLikedTracks((current) => ({ ...current, [selectedTrack.id]: !current[selectedTrack.id] }))} aria-label="Нравится"><Icon name="heart" size={19} filled={!!likedTracks[selectedTrack.id]} /></button>
        </div>
        <div className="music-dock-center">
          <div className="music-dock-controls">
            <button type="button" className="music-dock-secondary" aria-label="Перемешать"><Icon name="shuffle" size={17} /></button>
            <button type="button" className="music-dock-secondary" onClick={onPrev} aria-label="Предыдущий трек"><Icon name="prev" size={19} /></button>
            <button type="button" className="music-dock-main-play" onClick={onPlayToggle} aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}><Icon name={isPlaying ? 'pause' : 'play'} size={19} filled /></button>
            <button type="button" className="music-dock-secondary" onClick={onNext} aria-label="Следующий трек"><Icon name="next" size={19} /></button>
            <button type="button" className="music-dock-secondary" aria-label="Громкость"><Icon name="volume" size={19} /></button>
          </div>
          <div className="music-dock-progress"><span>0:00</span><div className="music-progress-track"><span /></div><span>{formatDuration(selectedTrack.duration)}</span></div>
        </div>
        <div className="music-dock-extra"><span className="music-dock-quality">ASTRA<br /><small>PLAYER</small></span></div>
      </footer>
    </main>
  );
}

export default MusicPage;
