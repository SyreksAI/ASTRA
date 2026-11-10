# backend/routes/theme.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.models import User
from backend.routes.auth import get_current_user

router = APIRouter(prefix="/api/theme", tags=["theme"])

class ThemeUpdate(BaseModel):
    theme: str  # "light" или "dark"

@router.get("/")
def get_theme(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить текущую тему пользователя"""
    theme = current_user.preferences.get("theme", "light") if current_user.preferences else "light"
    return {"theme": theme}

@router.post("/")
def update_theme(
    theme_data: ThemeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Сохранить тему пользователя"""
    theme = theme_data.theme if theme_data.theme in ("light", "dark") else "light"
    # Новый dict — иначе SQLAlchemy может не увидеть изменение JSON
    prefs = dict(current_user.preferences or {})
    prefs["theme"] = theme
    current_user.preferences = prefs
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Theme updated successfully",
        "theme": (current_user.preferences or {}).get("theme", theme),
    }