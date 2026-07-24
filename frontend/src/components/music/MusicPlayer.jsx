import React from "react";

export function MusicPlayer({ tracks, currentTrack, isPlaying, onPlayToggle, onNext, onPrev }) {
    return (
        <div className="music-player">
            <div className="music-player-header">
                <div className="music-player-title-wrapper">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                    <span className="music-player-title">Музыка</span>
                </div>
                <div className="music-player-status">
                    {isPlaying ? '▶ Сейчас играет' : '⏸ На паузе'}
                </div>
            </div>

            <div className="music-player-current-track">
                <img src={tracks[currentTrack].cover} 
                     alt={tracks[currentTrack].title}
                     className="music-player-cover" />
                <div className="music-player-track-info">
                    <div className="music-player-track-title">{tracks[currentTrack].title}</div>
                    <div className="music-player-track-artist">{tracks[currentTrack].artist}</div>
                    <div className="music-player-track-album">{tracks[currentTrack].album}</div>
                </div>
            </div>

            <div className="music-player-progress">
                <div className="music-player-progress-bar">
                    <div className="music-player-progress-fill" style={{ width: '45%' }}></div>
                </div>
                <div className="music-player-time">
                    <span>1:23</span>
                    <span>{tracks[currentTrack].duration}</span>
                </div>
            </div>

            <div className="music-player-controls">
                <button className="music-player-control-btn" onClick={onPrev}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                    </svg>
                </button>
                
                <button className={`music-player-play-btn ${isPlaying ? 'music-player-playing' : ''}`} onClick={onPlayToggle}>
                    {isPlaying ? (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    )}
                </button>
                
                <button className="music-player-control-btn" onClick={onNext}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}