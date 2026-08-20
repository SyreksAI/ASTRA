# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from backend.database import init_db
from backend.routes import auth, theme  # 👈 УБРАЛИ posts

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
app.include_router(theme.router)  # 👈 ТОЛЬКО auth и theme

@app.on_event("startup")
def startup():
    print("🚀 Запуск Astra API...")
    init_db()
    print("✅ База данных инициализирована")
    print("✅ Astra API готов к работе!")

@app.get("/")
async def root():
    return {"message": "Hello World from Astra!"}

@app.get("/api/message")
def get_message():
    return {"text": "hello from Astra"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Astra API"}