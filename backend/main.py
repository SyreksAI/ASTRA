# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles

from backend.database import init_db
from backend.routes import auth, posts, theme

app = FastAPI(
    title="Astra API", 
    version="0.1.0",
    description="API для социальной сети Astra"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(theme.router)

uploads_dir = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
async def root():
    return {"message": "Hello World from Astra!"}

@app.get("/api/message")
def get_message():
    return {"text": "hello from Astra"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Astra API"}
