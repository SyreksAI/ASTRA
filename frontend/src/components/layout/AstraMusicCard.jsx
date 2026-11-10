import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AstraMusicCard({
    tracks = [],
    currentTrack = 0,
    isPlaying = false,
    onPlayToggle,
}) {
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const track = tracks[currentTrack] || tracks[0];
    if (!track) return null;

    const bars = [
        6, 10, 7, 12, 8, 14, 9, 13, 7, 15, 10, 12, 6, 13, 8, 14, 11, 7, 12, 9, 13, 6, 11, 8,
    ];

    return (
        <section className="orbit-panel astra-music">
            <div className="orbit-panel__head">
                <div className="astra-music__brand">
                    <span className="astra-music__star" aria-hidden>
                        <svg viewBox="0 0 16 16" width="12" height="12">
                            <path
                                d="M8 1.1 9.15 6.15 14.2 8 9.15 9.85 8 14.9 6.85 9.85 1.8 8l5.05-1.85Z"
                                fill="currentColor"
                            />
                        </svg>
                    </span>
                    <span className="astra-music__label">Elara Music</span>
                </div>
                <button
                    type="button"
                    className="orbit-panel__link orbit-panel__link--muted"
                    onClick={() => navigate('/music')}
                >
                    Открыть →
                </button>
            </div>

            <div className="astra-music__row">
                <img className="astra-music__cover" src={track.cover} alt="" />
                <div className="astra-music__info">
                    <div className="astra-music__title">{track.title}</div>
                    <div className="astra-music__artist">{track.artist}</div>
                </div>
                <div className="astra-music__actions">
                    <button
                        type="button"
                        className={`astra-music__icon${liked ? ' is-on' : ''}`}
                        aria-label="Нравится"
                        onClick={() => setLiked((v) => !v)}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7">
                            <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8.1a3.8 3.8 0 0 1 7 2.7C19 15.6 12 20 12 20Z" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button type="button" className="astra-music__icon" aria-label="Ещё">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <circle cx="5" cy="12" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="19" cy="12" r="1.5" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="astra-music__player">
                <button
                    type="button"
                    className="astra-music__play"
                    onClick={onPlayToggle}
                    aria-label={isPlaying ? 'Пауза' : 'Играть'}
                >
                    {isPlaying ? (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <rect x="6" y="5" width="4" height="14" rx="1" />
                            <rect x="14" y="5" width="4" height="14" rx="1" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M8 5.5v13l11-6.5L8 5.5Z" />
                        </svg>
                    )}
                </button>
                <div className={`astra-music__wave${isPlaying ? ' is-playing' : ''}`} aria-hidden>
                    {bars.map((h, i) => (
                        <span
                            key={i}
                            style={{
                                height: `${h}px`,
                                animationDelay: `${(i % 8) * 0.08}s`,
                            }}
                            className={i < 12 ? 'is-active' : ''}
                        />
                    ))}
                </div>
                <span className="astra-music__time">02:14 / {track.duration || '04:27'}</span>
            </div>
        </section>
    );
}
