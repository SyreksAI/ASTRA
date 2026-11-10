import React from 'react';
import { MAX_POST_MEDIA_COUNT } from '../../utils/postMedia';

export function PostMediaPicker({
    items,
    activeId,
    onSelect,
    onRemove,
    onRequestAdd,
    maxCount = MAX_POST_MEDIA_COUNT,
    className = '',
    emptyLabel = 'Добавить фото или видео',
}) {
    const canAdd = items.length < maxCount;
    const active = items.find((item) => item.id === activeId) ?? items[items.length - 1];

    if (!items.length) {
        return (
            <div className={`post-media-picker post-media-picker--empty ${className}`.trim()}>
                <button
                    type="button"
                    className="post-media-picker__add post-media-picker__add--lead"
                    onClick={onRequestAdd}
                    aria-label="Добавить медиа"
                >
                    +
                </button>
                <button type="button" className="post-media-picker__empty-hit" onClick={onRequestAdd}>
                    <span>{emptyLabel}</span>
                    <span className="post-media-picker__empty-hint">По одному файлу, до {maxCount}</span>
                </button>
            </div>
        );
    }

    return (
        <div className={`post-media-picker ${className}`.trim()}>
            <div className="post-media-picker__strip" role="tablist" aria-label="Вложения">
                {items.map((item, index) => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={active?.id === item.id}
                        className={`post-media-picker__thumb${active?.id === item.id ? ' is-active' : ''}`}
                        onClick={() => onSelect(item.id)}
                        aria-label={`Файл ${index + 1}`}
                    >
                        {item.type === 'video' ? (
                            <video src={item.preview} muted playsInline preload="metadata" />
                        ) : (
                            <img src={item.preview} alt="" />
                        )}
                    </button>
                ))}
                {canAdd && (
                    <button
                        type="button"
                        className="post-media-picker__add"
                        onClick={onRequestAdd}
                        aria-label="Добавить ещё"
                    >
                        +
                    </button>
                )}
            </div>

            {active && (
                <div className="post-media-picker__stage">
                    {active.type === 'video' ? (
                        <video src={active.preview} controls playsInline preload="metadata" />
                    ) : (
                        <img src={active.preview} alt="" />
                    )}
                    <button
                        type="button"
                        className="post-composer__preview-clear"
                        onClick={() => onRemove(active.id)}
                        aria-label="Убрать файл"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}

export default PostMediaPicker;
