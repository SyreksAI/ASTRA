from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Comment, Post, User
from backend.routes.auth import get_current_user

router = APIRouter(prefix="/api/posts", tags=["posts"])
MAX_IMAGE_SIZE = 5 * 1024 * 1024


def serialize_post(post: Post, comments_count: int = 0) -> dict:
    return {
        "id": post.id,
        "content": post.content,
        "image": post.image,
        "created_at": post.created_at.isoformat(),
        "likes_count": 0,
        "comments_count": comments_count,
        "author": {
            "id": post.author.id,
            "username": post.author.username,
            "full_name": post.author.full_name,
            "avatar": post.author.avatar,
        },
    }


def serialize_comment(comment: Comment) -> dict:
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "content": comment.content,
        "created_at": comment.created_at.isoformat(),
        "author": {
            "id": comment.author.id,
            "username": comment.author.username,
            "full_name": comment.author.full_name,
            "avatar": comment.author.avatar,
        },
    }


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


async def save_post_image(file: UploadFile) -> str:
    image_types = {
        "image/jpeg": (".jpg", lambda data: data.startswith(b"\xff\xd8\xff")),
        "image/png": (".png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
        "image/webp": (".webp", lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP"),
    }
    image_type = image_types.get(file.content_type or "")
    if image_type is None:
        raise HTTPException(400, "Выберите изображение JPG, PNG или WebP")

    content = await file.read(MAX_IMAGE_SIZE + 1)
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(413, "Размер изображения не должен превышать 5 МБ")
    extension, is_valid_image = image_type
    if not is_valid_image(content):
        raise HTTPException(400, "Файл не похож на изображение указанного формата")

    image_dir = Path("/app/uploads") / "posts"
    image_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    (image_dir / filename).write_bytes(content)
    return f"/uploads/posts/{filename}"


@router.get("/")
def list_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    posts = (
        db.query(Post)
        .options(joinedload(Post.author))
        .order_by(Post.created_at.desc(), Post.id.desc())
        .limit(100)
        .all()
    )
    counts = {}
    if posts:
        counts = dict(
            db.query(Comment.post_id, func.count(Comment.id))
            .filter(Comment.post_id.in_([post.id for post in posts]))
            .group_by(Comment.post_id)
            .all()
        )
    return [serialize_post(post, counts.get(post.id, 0)) for post in posts]


@router.post("/")
async def create_post(
    content: str = Form(default="", max_length=5000),
    image: UploadFile | None = File(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = content.strip()
    if not content and image is None:
        raise HTTPException(400, "Добавьте текст или изображение")

    image_url = await save_post_image(image) if image else None
    post = Post(
        user_id=current_user.id,
        content=content,
        image=image_url,
        created_at=datetime.utcnow(),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    post.author = current_user
    return serialize_post(post)


@router.get("/{post_id}/comments")
def list_comments(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post.id).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(404, "Публикация не найдена")
    comments = (
        db.query(Comment)
        .options(joinedload(Comment.author))
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc(), Comment.id.asc())
        .limit(200)
        .all()
    )
    return [serialize_comment(comment) for comment in comments]


@router.post("/{post_id}/comments")
def create_comment(
    post_id: int,
    request: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(404, "Публикация не найдена")
    content = request.content.strip()
    if not content:
        raise HTTPException(400, "Комментарий не может быть пустым")

    comment = Comment(post_id=post_id, user_id=current_user.id, content=content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    comment.author = current_user
    return serialize_comment(comment)
