from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Строка подключения к БД
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://astra:12281228_astra_2026@postgres:5432/astra_db")

# Движок SQLAlchemy
engine = create_engine(DATABASE_URL)

# Сессия
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()

# Функция для получения сессии (это то, что нужно main.py)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()