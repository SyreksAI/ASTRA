# backend/main.py
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import init_db
from backend.realtime import manager
from backend.routes import auth, chat, follows, music, posts, theme, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Старт
    init_db()
    await manager.start()
    yield
    # Стоп
    await manager.stop()


app = FastAPI(
    title="Astra API",
    version="0.1.0",
    description="API для социальной сети Astra",
    lifespan=lifespan,
)

# CORS — с credentials нельзя использовать "*"
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost,http://127.0.0.1,http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(theme.router)
app.include_router(users.router)
app.include_router(follows.router)
app.include_router(chat.router)
app.include_router(music.router)


uploads_dir = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/")
async def root():
    return {"message": "Astra API", "version": app.version}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Astra API"}