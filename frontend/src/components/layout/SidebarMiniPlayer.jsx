import React from 'react';

export function SidebarMiniPlayer({
    tracks = [],
    currentTrack = 0,
    isPlaying = false,
    onPlayToggle,
    onNext,
    onPrev,
}) {
    const track = tracks[currentTrack];
    if (!track) return null;

    const progress = isPlaying ? 42 : 18;

    return (
        <div className="sidebar-mini-player">
            <div className="sidebar-mini-player__head">
                <img
                    src={track.cover}
                    alt=""
                    className="sidebar-mini-player__cover"
                    width={40}
                    height={40}
                />
                <div className="sidebar-mini-player__texts">
                    <span className="sidebar-mini-player__artist">{track.artist}</span>
                    <span className="sidebar-mini-player__song">{track.title}</span>
                </div>
                <button type="button" className="sidebar-mini-player__like" aria-label="Нравится">
                    ♡
                </button>
            </div>

            <div className="sidebar-mini-player__progress">
                <div className="sidebar-mini-player__bar">
                    <span className="sidebar-mini-player__bar-fill" style={{ width: `${progress}%` }} />
                    <i className="sidebar-mini-player__thumb" style={{ left: `${progress}%` }} />
                </div>
                <div className="sidebar-mini-player__time">
                    <span>1:24</span>
                    <span>{track.duration || '3:50'}</span>
                </div>
            </div>

            <div className="sidebar-mini-player__controls">
                <button type="button" className="sidebar-mini-player__icon" aria-label="Перемешать">
                    ⇄
                </button>
                <button type="button" className="sidebar-mini-player__icon" onClick={onPrev} aria-label="Предыдущий">
                    ⏮
                </button>
                <button
                    type="button"
                    className="sidebar-mini-player__play"
                    onClick={onPlayToggle}
                    aria-label={isPlaying ? 'Пауза' : 'Играть'}
                >
                    {isPlaying ? '❚❚' : '▶'}
                </button>
                <button type="button" className="sidebar-mini-player__icon" onClick={onNext} aria-label="Следующий">
                    ⏭
                </button>
                <button type="button" className="sidebar-mini-player__icon" aria-label="Развернуть">
                    ↗
                </button>
            </div>
        </div>
    );
}
