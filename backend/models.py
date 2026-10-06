# backend/models.py
from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, JSON, Text
from sqlalchemy.orm import relationship
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
    cover_image = Column(String(255), nullable=True)
    preferences = Column(JSON, default={"theme": "light"})      # Настройки
    created_at = Column(DateTime, default=datetime.utcnow)      # Дата регистрации


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False, default="")
    image = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    author = relationship("User")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(String(2000), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    post = relationship("Post", back_populates="comments")
    author = relationship("User")
