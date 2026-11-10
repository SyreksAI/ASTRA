import React, { useEffect, useRef, useState } from 'react';
import { CONSTELLATIONS } from '../../utils/constellations';
import {
    MAX_POST_MEDIA_COUNT,
    POST_MEDIA_ACCEPT,
    createComposerMediaItem,
    validatePostMediaFile,
} from '../../utils/postMedia';
import { PostMediaPicker } from './PostMediaPicker';

const CHIPS = [
    {
        id: 'photo',
        label: 'Медиа',
        icon: (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
                <circle cx="9" cy="9" r="1.4" />
                <path d="M3.8 16.2 9.2 11.5l3.4 3.2 3.2-3.8 4.4 5.3" />
            </svg>
        ),
    },
    {
        id: 'poll',
        label: 'Опрос',
        icon: (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M7 18V11M12 18V6M17 18v-5" />
            </svg>
        ),
    },
    {
        id: 'constellation',
        label: 'Созвездие',
        icon: (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <circle cx="12" cy="12" r="3.5" />
                <ellipse cx="12" cy="12" rx="8.5" ry="3.2" transform="rotate(-22 12 12)" />
            </svg>
        ),
    },
    {
        id: 'emoji',
        label: 'Эмодзи',
        icon: (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <circle cx="12" cy="12" r="8.2" />
                <path d="M8.6 14.4s1.5 2.1 3.4 2.1 3.4-2.1 3.4-2.1" strokeLinecap="round" />
                <circle cx="9.2" cy="10" r="1" fill="currentColor" stroke="none" />
                <circle cx="14.8" cy="10" r="1" fill="currentColor" stroke="none" />
            </svg>
        ),
    },
];

export function PostComposer({ user, onPostCreated, variant = 'feed' }) {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [mediaItems, setMediaItems] = useState([]);
    const [activeMediaId, setActiveMediaId] = useState(null);
    const [constellationId, setConstellationId] = useState('');
    const [pickerOpen, setPickerOpen] = useState(false);
    const fileInputRef = useRef(null);

    const mediaItemsRef = useRef(mediaItems);
    mediaItemsRef.current = mediaItems;
    useEffect(() => () => {
        mediaItemsRef.current.forEach((item) => {
            if (item.preview) URL.revokeObjectURL(item.preview);
        });
    }, []);

    const canSend = (text.trim().length > 0 || mediaItems.length > 0) && !sending;
    const selectedConstellation = CONSTELLATIONS.find((c) => c.id === constellationId);

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        setError('');
        if (mediaItems.length >= MAX_POST_MEDIA_COUNT) {
            setError(`Не более ${MAX_POST_MEDIA_COUNT} файлов`);
            return;
        }
        const validationError = validatePostMediaFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        const item = createComposerMediaItem(file);
        setMediaItems((prev) => [...prev, item]);
        setActiveMediaId(item.id);
    };

    const removeMedia = (id) => {
        setMediaItems((prev) => {
            const index = prev.findIndex((item) => item.id === id);
            const target = prev[index];
            if (target?.preview) URL.revokeObjectURL(target.preview);
            const next = prev.filter((item) => item.id !== id);
            if (activeMediaId === id) {
                const fallback = next[Math.min(index, next.length - 1)];
                setActiveMediaId(fallback?.id ?? null);
            }
            return next;
        });
    };

    const clearMedia = () => {
        mediaItems.forEach((item) => {
            if (item.preview) URL.revokeObjectURL(item.preview);
        });
        setMediaItems([]);
        setActiveMediaId(null);
    };

    const handleChip = (chipId) => {
        if (chipId === 'photo') handlePhotoClick();
        else if (chipId === 'constellation') setPickerOpen((v) => !v);
    };

    const handleSubmit = async () => {
        if (!canSend) return;
        setSending(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('content', text.trim());
            mediaItems.forEach((item) => formData.append('media', item.file));
            if (constellationId) formData.append('constellation_id', constellationId);

            const res = await fetch('/api/posts/', {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                const detail = Array.isArray(data?.detail)
                    ? data.detail.map((item) => item.msg || item).join('. ')
                    : data?.detail;
                throw new Error(detail || 'Не удалось опубликовать');
            }
            setText('');
            clearMedia();
            setConstellationId('');
            setPickerOpen(false);
            onPostCreated?.(data);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Ошибка отправки');
        } finally {
            setSending(false);
        }
    };

    const orbitChips = variant === 'orbit'
        ? CHIPS.filter((c) => c.id === 'photo' || c.id === 'poll' || c.id === 'emoji')
        : CHIPS;

    return (
        <div className={`post-composer post-composer--feed post-composer--${variant}`}>
            <div className="post-composer__top">
                <div className="post-composer-avatar">
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.username} />
                    ) : (
                        <span>{user?.username?.[0]?.toUpperCase() || '?'}</span>
                    )}
                </div>
                <textarea
                    className="post-composer-input"
                    placeholder="Что сейчас занимает твои мысли?"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={variant === 'orbit' ? 1 : 2}
                />
            </div>

            {mediaItems.length > 0 && (
                <PostMediaPicker
                    className="post-composer__media-picker"
                    items={mediaItems}
                    activeId={activeMediaId}
                    onSelect={setActiveMediaId}
                    onRemove={removeMedia}
                    onRequestAdd={handlePhotoClick}
                />
            )}

            {selectedConstellation && (
                <div className="post-composer__constellation">
                    в Созвездии «{selectedConstellation.label}»
                    <button
                        type="button"
                        className="post-composer__constellation-clear"
                        onClick={() => setConstellationId('')}
                    >
                        сбросить
                    </button>
                </div>
            )}

            {pickerOpen && (
                <div className="post-composer__picker" role="listbox" aria-label="Созвездие">
                    {CONSTELLATIONS.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            className={`post-composer__picker-item${constellationId === c.id ? ' is-active' : ''}`}
                            onClick={() => {
                                setConstellationId(c.id);
                                setPickerOpen(false);
                            }}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            )}

            {error && <div className="post-composer__error">{error}</div>}

            <div className="post-composer-toolbar">
                <div className="post-composer-icons">
                    {orbitChips.map((chip) => (
                        <button
                            key={chip.id}
                            type="button"
                            className={`post-composer-chip${chip.id === 'constellation' && (pickerOpen || constellationId) ? ' is-active' : ''}`}
                            aria-label={chip.label}
                            onClick={() => handleChip(chip.id)}
                        >
                            {chip.icon}
                            <span>{chip.label}</span>
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    className="post-composer-submit"
                    onClick={handleSubmit}
                    disabled={!canSend}
                >
                    {sending ? '…' : 'Опубликовать'}
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept={POST_MEDIA_ACCEPT}
                className="hidden-file-input"
                onChange={handleFileChange}
            />
        </div>
    );
}

export default PostComposer;
