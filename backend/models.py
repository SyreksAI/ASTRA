# backend/models.py
from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = 'users'  # 👈 Название таблицы в БД
    
    # 👇 Каждое поле = колонка в таблице
    id = Column(Integer, primary_key=True)  # Уникальный ID
    username = Column(String(50), unique=True, nullable=False)  # Никнейм
    email = Column(String(100), unique=True, nullable=False)    # Email
    password_hash = Column(String(255), nullable=False)         # Хеш пароля
    full_name = Column(String(100), nullable=True)              # Полное имя
    bio = Column(String(500), nullable=True)                    # О себе
    avatar = Column(String(255), default='/default-avatar.png') # Аватарка
    preferences = Column(JSON, default={"theme": "light"})      # Настройки
    created_at = Column(DateTime, default=datetime.utcnow)      # Дата регистрации