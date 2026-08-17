from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

from app.database import get_db, engine, Base
from app.models import User  # Убедитесь, что модель User существует

# Настройки
SECRET_KEY = os.getenv("SECRET_KEY", "secretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

# Создаем таблицы при старте (для простоты)
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Эндпоинт регистрации ---
@app.post("/auth/register")
async def register(username: str, email: str, password: str, db: AsyncSession = Depends(get_db)):
    # Проверка на существующего пользователя
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    
    new_user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(password)
    )
    db.add(new_user)
    await db.commit()
    return {"message": "Пользователь успешно создан"}

# --- Эндпоинт входа ---
@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # В form_data.username приходит email (так как мы отправляем его в поле username)
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}