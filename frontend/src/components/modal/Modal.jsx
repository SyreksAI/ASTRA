// src/components/modal/Modal.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
    createComposerMediaItem,
    MAX_POST_MEDIA_COUNT,
    POST_MEDIA_ACCEPT,
    validatePostMediaFile,
} from '../../utils/postMedia';
import { PostMediaPicker } from '../post/PostMediaPicker';

export function ModalPost({ onClose, onAddPost }) {
    const [text, setText] = useState('');
    const [mediaItems, setMediaItems] = useState([]);
    const [activeMediaId, setActiveMediaId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const mediaItemsRef = useRef(mediaItems);
    mediaItemsRef.current = mediaItems;
    useEffect(() => () => {
        mediaItemsRef.current.forEach((item) => {
            if (item.preview) URL.revokeObjectURL(item.preview);
        });
    }, []);

    const openFilePicker = () => {
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!text.trim() && mediaItems.length === 0) return;
        setError('');
        setIsSaving(true);
        try {
            await onAddPost({
                text: text.trim(),
                mediaFiles: mediaItems.map((item) => item.file),
            });
            onClose();
        } catch (submitError) {
            setError(submitError.message || 'Не удалось опубликовать запись');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
                <div className="modal-header">
                    <h2>Создать пост</h2>
                    <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="photo-upload-area photo-upload-area--picker">
                    <PostMediaPicker
                        items={mediaItems}
                        activeId={activeMediaId}
                        onSelect={setActiveMediaId}
                        onRemove={removeMedia}
                        onRequestAdd={openFilePicker}
                    />
                    <input
                        type="file"
                        accept={POST_MEDIA_ACCEPT}
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden-file-input"
                        id="ImgPostModal"
                    />
                </div>
                {error && <div className="auth-error" role="alert">{error}</div>}
                <textarea
                    className="modal-textarea"
                    placeholder="Что нового?"
                    value={text}
                    maxLength={5000}
                    onChange={(e) => setText(e.target.value)}
                    id="TextPostModal"
                />

                <button
                    className="modal-submit-btn"
                    type="submit"
                    disabled={isSaving || (!text.trim() && mediaItems.length === 0)}
                >
                    {isSaving ? 'Публикация…' : 'Опубликовать'}
                </button>
            </form>
        </div>
    );
}
