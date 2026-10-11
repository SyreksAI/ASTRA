from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Follow, User
from backend.routes.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["follows"])


def serialize_user_short(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar": user.avatar,
    }


@router.post("/{username}/follow", status_code=204)
def follow_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.username == username).first()
    if target is None:
        raise HTTPException(404, "Пользователь не найден")
    if target.id == current_user.id:
        raise HTTPException(400, "Нельзя подписаться на себя")

    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == target.id,
    ).first()
    if existing:
        return

    db.add(Follow(follower_id=current_user.id, following_id=target.id))
    db.commit()


@router.delete("/{username}/follow", status_code=204)
def unfollow_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.username == username).first()
    if target is None:
        raise HTTPException(404, "Пользователь не найден")

    db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == target.id,
    ).delete()
    db.commit()


@router.get("/{username}/followers")
def get_followers(username: str, db: Session = Depends(get_db)):
    target = db.query(User).filter(User.username == username).first()
    if target is None:
        raise HTTPException(404, "Пользователь не найден")

    followers = (
        db.query(User)
        .join(Follow, Follow.follower_id == User.id)
        .filter(Follow.following_id == target.id)
        .order_by(Follow.created_at.desc())
        .limit(100)
        .all()
    )
    return [serialize_user_short(u) for u in followers]


@router.get("/{username}/following")
def get_following(username: str, db: Session = Depends(get_db)):
    target = db.query(User).filter(User.username == username).first()
    if target is None:
        raise HTTPException(404, "Пользователь не найден")

    following = (
        db.query(User)
        .join(Follow, Follow.following_id == User.id)
        .filter(Follow.follower_id == target.id)
        .order_by(Follow.created_at.desc())
        .limit(100)
        .all()
    )
    return [serialize_user_short(u) for u in following]