-- ============================================
-- ТАБЛИЦА ПОСТОВ
-- Версия: 01
-- ============================================

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    image VARCHAR(255),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для ускорения
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Комментарий к таблице
COMMENT ON TABLE posts IS 'Посты пользователей';
COMMENT ON COLUMN posts.content IS 'Текст поста';
COMMENT ON COLUMN posts.image IS 'Ссылка на изображение';
COMMENT ON COLUMN posts.author_id IS 'ID автора поста';