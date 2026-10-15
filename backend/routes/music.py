import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Track, User
from backend.routes.auth import get_current_user

router = APIRouter(prefix="/api/music", tags=["music"])


def serialize_track(track: Track) -> dict:
    return {
        "id": track.id,
        "title": track.title,
        "artist": track.artist,
        "album": track.album,
        "duration": track.duration,
        "cover": track.cover,
        "audio_url": track.audio_url,
        "created_at": track.created_at.isoformat(),
        "author": {
            "id": track.author.id,
            "username": track.author.username,
            "full_name": track.author.full_name,
            "avatar": track.author.avatar,
        } if track.author else None,
    }


@router.get("/search")
def search_tracks(
    q: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = q.strip()
    if not q:
        return []
    pattern = f"%{q}%"
    tracks = (
        db.query(Track)
        .filter(
            (Track.title.ilike(pattern))
            | (Track.artist.ilike(pattern))
            | (Track.album.ilike(pattern))
        )
        .order_by(Track.created_at.desc())
        .limit(50)
        .all()
    )
    return [serialize_track(t) for t in tracks]


@router.get("/")
def list_tracks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracks = db.query(Track).order_by(Track.created_at.desc()).limit(100).all()
    return [serialize_track(t) for t in tracks]


@router.post("/upload", status_code=201)
async def upload_track(
    title: str = Form(...),
    artist: str = Form(...),
    album: str = Form(default=""),
    duration: str = Form(default=""),
    audio: UploadFile = File(...),
    cover: UploadFile | None = File(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not title.strip() or not artist.strip():
        raise HTTPException(400, "Укажите название и исполнителя")

    upload_root = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))
    music_dir = upload_root / "music"
    covers_dir = upload_root / "music_covers"
    music_dir.mkdir(parents=True, exist_ok=True)
    covers_dir.mkdir(parents=True, exist_ok=True)

    # Аудио
    audio_ext = Path(audio.filename or "").suffix or ".mp3"
    audio_name = f"{uuid4().hex}{audio_ext}"
    audio_bytes = await audio.read()
    if len(audio_bytes) > 50 * 1024 * 1024:
        raise HTTPException(413, "Аудио больше 50 МБ")
    (music_dir / audio_name).write_bytes(audio_bytes)
    audio_url = f"/uploads/music/{audio_name}"

    # Обложка
    cover_url = None
    if cover is not None:
        cover_ext = Path(cover.filename or "").suffix or ".jpg"
        cover_name = f"{uuid4().hex}{cover_ext}"
        cover_bytes = await cover.read()
        if len(cover_bytes) > 5 * 1024 * 1024:
            raise HTTPException(413, "Обложка больше 5 МБ")
        (covers_dir / cover_name).write_bytes(cover_bytes)
        cover_url = f"/uploads/music_covers/{cover_name}"

    track = Track(
        user_id=current_user.id,
        title=title.strip(),
        artist=artist.strip(),
        album=album.strip() or None,
        duration=duration.strip() or None,
        cover=cover_url,
        audio_url=audio_url,
    )
    db.add(track)
    db.commit()
    db.refresh(track)
    track.author = current_user
    return serialize_track(track)