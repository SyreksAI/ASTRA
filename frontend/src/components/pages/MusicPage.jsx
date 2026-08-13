import React, { useState } from "react";

/* ---------- SVG-иконки ---------- */
const NoteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#1d9bf0">
    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d9bf0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12" />
    <polyline points="13 5 20 12 13 19" />
  </svg>
);

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
    <polygon points="7 4 21 12 7 20" />
  </svg>
);

const PauseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const PrevIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#536471">
    <polygon points="19 20 9 12 19 4" />
    <rect x="5" y="4" width="2.5" height="16" rx="1" />
  </svg>
);

const NextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#536471">
    <polygon points="5 4 15 12 5 20" />
    <rect x="16.5" y="4" width="2.5" height="16" rx="1" />
  </svg>
);

const HeartIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "#f91880" : "#536471"}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#536471">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

/* ---------- Данные треков (обложки замените на свои) ---------- */
const TRACKS = [
  { id: 0, title: "Музыка времени",  artist: "ASTRA",          cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80" },
  { id: 1, title: "Пушистый бит",    artist: "Хома Records",   cover: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=400&q=80" },
  { id: 2, title: "На волне",        artist: "Лето FM",        cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=400&q=80" },
  { id: 3, title: "Клавиры мечты",   artist: "Piano Man",      cover: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=400&q=80" },
  { id: 4, title: "Тёплый ламповый", artist: "Vintage Sound",  cover: "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=400&q=80" },
  { id: 5, title: "Роботы фанка",    artist: "Daft Crew",      cover: "https://images.unsplash.com/photo-1470225620780-dba8db36b745?auto=format&fit=crop&w=400&q=80" },
  { id: 6, title: "Скрипка страсти", artist: "Stradivari",     cover: "https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?auto=format&fit=crop&w=400&q=80" },
  { id: 7, title: "Жёлтое настроение", artist: "Солнечный день", cover: "https://images.unsplash.com/photo-1493225457127-a178b2a436ba?auto=format&fit=crop&w=400&q=80" },
];

export function MusicPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState(0);
  const [likedTracks, setLikedTracks] = useState({});

  const currentTrack = TRACKS[currentTrackId];

  const filteredTracks = TRACKS.filter((t) =>
    `${t.title} ${t.artist}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handlePlaylistClick = () => console.log("Мой плейлист открыт");
  const handlePlayToggle = () => setIsPlaying((p) => !p);
  const handleTrackSelect = (id) => { setCurrentTrackId(id); setIsPlaying(true); };
  const handlePrev = () => setCurrentTrackId((id) => (id - 1 + TRACKS.length) % TRACKS.length);
  const handleNext = () => setCurrentTrackId((id) => (id + 1) % TRACKS.length);
  const toggleLike = (id) => setLikedTracks((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="music-page">
      {/* Поиск */}
      <div className="music-search">
        <input
          type="search"
          className="music-search-input"
          placeholder="Поиск..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Кнопка "Мой плейлист" */}
      <div className="music-playlist-btn-wrapper">
        <button className="music-playlist-btn" onClick={handlePlaylistClick}>
          <NoteIcon />
          Мой плейлист
          <ArrowRightIcon />
        </button>
      </div>

      {/* Диск с кнопкой Play по центру */}
      <div className="music-player-center">
        <div className="music-disc-container">
          <div className={`music-disc ${isPlaying ? "music-disc-spin" : ""}`}>
            <img src={currentTrack.cover} alt={currentTrack.title} className="music-disc-cover" />
          </div>
          <button
            className="music-play-btn"
            onClick={handlePlayToggle}
            aria-label="Играть / пауза"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>
      </div>

      {/* Сетка обложек */}
      <div className="music-grid">
        {filteredTracks.map((track) => (
          <button
            key={track.id}
            className={`music-grid-item ${track.id === currentTrackId ? "active" : ""}`}
            onClick={() => handleTrackSelect(track.id)}
            title={`${track.title} — ${track.artist}`}
          >
            <img src={track.cover} alt={track.title} className="music-grid-cover" />
          </button>
        ))}
      </div>

      {/* Нижний плеер */}
      <div className="music-bottom-player">
        <div className="player-track">
          <img src={currentTrack.cover} alt={currentTrack.title} className="player-track-cover" />
          <span className="player-track-title">{currentTrack.title}</span>
        </div>

        <div className="player-controls">
          <button className="player-skip-btn" onClick={handlePrev} aria-label="Предыдущий трек">
            <PrevIcon />
          </button>
          <button className="player-play-btn" onClick={handlePlayToggle} aria-label="Играть / пауза">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="player-skip-btn" onClick={handleNext} aria-label="Следующий трек">
            <NextIcon />
          </button>
        </div>

        <div className="player-actions">
          <button className="player-action-btn" onClick={() => toggleLike(currentTrack.id)} aria-label="Нравится">
            <HeartIcon active={!!likedTracks[currentTrack.id]} />
          </button>
          <button className="player-action-btn" aria-label="Комментарии">
            <CommentIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MusicPage;