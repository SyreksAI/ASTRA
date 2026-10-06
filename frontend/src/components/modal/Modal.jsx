// src/components/modal/Modal.jsx
import React, { useEffect, useState, useRef } from 'react';

// ИСПРАВЛЕНО: Добавили onAddPost в фигурные скобки ниже
export function ModalPost({ onClose, onAddPost }) {
    const [text, setText] = useState('');
    const [image, setImage] = useState(null);          // для хранения файла
    const [preview, setPreview] = useState(null);      // для превью
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => () => {
        if (preview) URL.revokeObjectURL(preview);
    }, [preview]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            e.target.value = '';
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                setError('Выберите изображение JPG, PNG или WebP');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('Размер изображения не должен превышать 5 МБ');
                return;
            }
            setError('');
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!text.trim() && !image) return;
        setError('');
        setIsSaving(true);
        try {
            await onAddPost({ text: text.trim(), imageFile: image });
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

                {/* Кастомная область загрузки фото */}
                <div 
                    className="photo-upload-area"
                    onClick={() => fileInputRef.current.click()}
                >
                    {preview ? (
                        <img src={preview} alt="Превью" className="photo-preview" />
                    ) : (
                        <>
                            <span className="photo-upload-text">Добавить фото</span>
                            <span className="photo-upload-hint">Нажмите для выбора</span>
                        </>
                    )}
                    {/* Скрытый инпут */}
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden-file-input"
                        id='ImgPostModal'
                    />
                </div>
                {error && <div className="auth-error" role="alert">{error}</div>}
                <textarea
                    className="modal-textarea"
                    placeholder="Что нового?"
                    value={text}
                    maxLength={5000}
                    onChange={(e) => setText(e.target.value)}
                    id='TextPostModal'
                />

                {/* Кнопка публикации */}
                <button 
                    className="modal-submit-btn" 
                    type="submit"
                    disabled={isSaving || (!text.trim() && !image)}
                >
                    {isSaving ? 'Публикация…' : 'Опубликовать'}
                </button>
            </form>
        </div>
    );
}
