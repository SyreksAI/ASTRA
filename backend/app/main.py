from fastapi import FastAPI
from app.db import engine, Base
from app import models  # Важно импортировать models, чтобы зарегистрировать таблицы

# Создаем таблицы в БД
# В продакшене лучше использовать Alembic для миграций, но для старта это ок
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Хук запуска событий ( lifespan )
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # При старте
    await init_db()
    print("✅ База данных инициализирована, таблицы созданы.")
    yield
    # При остановке (если нужно закрыть соединения)
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Astra API is running"}