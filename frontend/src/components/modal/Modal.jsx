// src/components/modal/Modal.jsx
import React, { useState, useRef } from 'react';

// ИСПРАВЛЕНО: Добавили onAddPost в фигурные скобки ниже
export function ModalPost({ onClose, onAddPost }) {
    const [text, setText] = useState('');
    const [image, setImage] = useState(null);          // для хранения файла
    const [preview, setPreview] = useState(null);      // для превью
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (!text.trim() && !image) return;

        // Теперь это сработает, так как мы приняли onAddPost сверху
        onAddPost({
            text: text,
            image: preview
        });

        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Создать пост</h2>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
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
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden-file-input"
                        id='ImgPostModal'
                    />
                </div>
                {/* Поле ввода текста */}
                <textarea
                    className="modal-textarea"
                    placeholder="Что нового?"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    id='TextPostModal'
                />

                {/* Кнопка публикации */}
                <button 
                    className="modal-submit-btn" 
                    onClick={handleSubmit}
                    disabled={!text.trim() && !image}
                >
                    Опубликовать
                </button>
            </div>
        </div>
    );
}
