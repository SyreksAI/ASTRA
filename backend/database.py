from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 1. Берём URL из переменных окружения
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL не задан в переменных окружения")

# 2. Явно указываем драйвер psycopg2, чтобы SQLAlchemy 2.0 не пыталась использовать psycopg3
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# 3. Только теперь создаём engine — с уже правильным URL
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from backend import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        # Существующие ALTER
        connection.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_image VARCHAR(255)"
        ))
        # 👇 Новые колонки для вложений
        connection.execute(text(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS type VARCHAR(16)"
        ))
        connection.execute(text(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url VARCHAR(500)"
        ))
        connection.execute(text(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255)"
        ))
        connection.execute(text(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER"
        ))
        connection.execute(text(
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100)"
        ))