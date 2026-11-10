import os
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Comment, Constellation, Follow, Post, PostLike, User
from backend.routes.auth import get_current_user

router = APIRouter(prefix="/api/posts", tags=["posts"])
MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_VIDEO_SIZE = 25 * 1024 * 1024
MAX_MEDIA_COUNT = 10


def _upload_root() -> Path:
    return Path(os.getenv("UPLOAD_DIR", "/app/uploads"))


def _media_for_post(post: Post) -> list[dict]:
    stored = post.media if isinstance(post.media, list) and post.media else []
    if stored:
        return [
            {"url": item.get("url"), "type": item.get("type") or "image"}
            for item in stored
            if isinstance(item, dict) and item.get("url")
        ]
    if post.image:
        return [{"url": post.image, "type": "image"}]
    return []


def serialize_post(
    post: Post,
    comments_count: int = 0,
    likes_count: int = 0,
    liked_by_me: bool = False,
) -> dict:
    constellation = None
    constellation_id = None
    if getattr(post, "constellation", None) is not None:
        constellation_id = post.constellation.slug
        constellation = {
            "id": post.constellation.slug,
            "label": post.constellation.label,
        }

    media = _media_for_post(post)
    legacy_image = post.image
    if not legacy_image:
        legacy_image = next((m["url"] for m in media if m["type"] == "image"), None)

    return {
        "id": post.id,
        "content": post.content,
        "image": legacy_image,
        "media": media,
        "created_at": post.created_at.isoformat(),
        "likes_count": likes_count,
        "liked_by_me": liked_by_me,
        "comments_count": comments_count,
        "constellation_id": constellation_id,
        "constellation": constellation,
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


def _collect_post_stats(db: Session, post_ids: list[int], current_user_id: int) -> dict:
    """Считает лайки, комментарии и мои лайки одним запросом на все посты."""
    if not post_ids:
        return {"likes": {}, "comments": {}, "my_likes": set()}

    likes_counts = dict(
        db.query(PostLike.post_id, func.count(PostLike.id))
        .filter(PostLike.post_id.in_(post_ids))
        .group_by(PostLike.post_id)
        .all()
    )

    comments_counts = dict(
        db.query(Comment.post_id, func.count(Comment.id))
        .filter(Comment.post_id.in_(post_ids))
        .group_by(Comment.post_id)
        .all()
    )

    my_likes = {
        row[0]
        for row in db.query(PostLike.post_id)
        .filter(PostLike.post_id.in_(post_ids), PostLike.user_id == current_user_id)
        .all()
    }

    return {"likes": likes_counts, "comments": comments_counts, "my_likes": my_likes}


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


def _is_valid_mp4(data: bytes) -> bool:
    return len(data) >= 12 and data[4:8] == b"ftyp"


def _is_valid_webm(data: bytes) -> bool:
    return data.startswith(b"\x1aE\xdf\xa3")


async def save_post_media_file(file: UploadFile) -> dict:
    image_types = {
        "image/jpeg": (".jpg", lambda data: data.startswith(b"\xff\xd8\xff")),
        "image/png": (".png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
        "image/webp": (".webp", lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP"),
    }
    video_types = {
        "video/mp4": (".mp4", _is_valid_mp4),
        "video/webm": (".webm", _is_valid_webm),
    }

    content_type = file.content_type or ""
    is_video = content_type.startswith("video/")
    type_map = video_types if is_video else image_types
    media_type = type_map.get(content_type)

    if media_type is None:
        if is_video:
            raise HTTPException(400, "Видео: только MP4 или WebM")
        raise HTTPException(400, "Фото: JPG, PNG или WebP")

    max_size = MAX_VIDEO_SIZE if is_video else MAX_IMAGE_SIZE
    content = await file.read(max_size + 1)
    if len(content) > max_size:
        limit_mb = max_size // (1024 * 1024)
        raise HTTPException(413, f"Файл не больше {limit_mb} МБ")

    extension, is_valid = media_type
    if not is_valid(content):
        raise HTTPException(400, "Файл не соответствует выбранному формату")

    media_dir = _upload_root() / "posts"
    media_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    (media_dir / filename).write_bytes(content)

    return {
        "url": f"/uploads/posts/{filename}",
        "type": "video" if is_video else "image",
    }


@router.get("/")
def list_posts(
    feed: str | None = None,
    constellation: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Лента постов.
    - Без параметра: все посты.
    - ?feed=following: посты подписок + свои.
    - ?constellation=slug: посты созвездия.
    """
    query = db.query(Post).options(
        joinedload(Post.author),
        joinedload(Post.constellation),
    )

    if feed == "following":
        following_ids = [
            row[0]
            for row in db.query(Follow.following_id)
            .filter(Follow.follower_id == current_user.id)
            .all()
        ]
        following_ids.append(current_user.id)
        query = query.filter(Post.user_id.in_(following_ids))

    if constellation:
        slug = constellation.strip().lower()
        c = db.query(Constellation).filter(Constellation.slug == slug).first()
        if c is None:
            return []
        query = query.filter(Post.constellation_id == c.id)

    posts = (
        query.order_by(Post.created_at.desc(), Post.id.desc())
        .limit(100)
        .all()
    )

    stats = _collect_post_stats(db, [p.id for p in posts], current_user.id)

    return [
        serialize_post(
            post,
            comments_count=stats["comments"].get(post.id, 0),
            likes_count=stats["likes"].get(post.id, 0),
            liked_by_me=post.id in stats["my_likes"],
        )
        for post in posts
    ]


@router.post("/")
async def create_post(
    content: str = Form(default="", max_length=5000),
    constellation_id: str | None = Form(default=None),
    image: UploadFile | None = File(default=None),
    media: list[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = content.strip()

    uploads: list[UploadFile] = []
    for item in media or []:
        if item.filename:
            uploads.append(item)
    if image and image.filename:
        uploads.append(image)

    if not content and not uploads:
        raise HTTPException(400, "Добавьте текст или медиафайлы")

    if len(uploads) > MAX_MEDIA_COUNT:
        raise HTTPException(400, f"Не более {MAX_MEDIA_COUNT} фото или видео в одной публикации")

    constellation = None
    constellation_fk = None
    if constellation_id:
        slug = constellation_id.strip().lower()
        constellation = db.query(Constellation).filter(Constellation.slug == slug).first()
        if constellation is None:
            raise HTTPException(400, "Созвездие не найдено")
        constellation_fk = constellation.id

    saved_media: list[dict] = []
    for upload in uploads:
        saved_media.append(await save_post_media_file(upload))

    first_image = next((m["url"] for m in saved_media if m["type"] == "image"), None)

    post = Post(
        user_id=current_user.id,
        content=content,
        image=first_image,
        media=saved_media or None,
        constellation_id=constellation_fk,
        created_at=datetime.utcnow(),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    post.author = current_user
    post.constellation = constellation
    return serialize_post(post, comments_count=0, likes_count=0, liked_by_me=False)


@router.post("/{post_id}/like", status_code=status.HTTP_200_OK)
def like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post.id).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(404, "Публикация не найдена")

    existing = db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == current_user.id,
    ).first()
    if existing is None:
        db.add(PostLike(post_id=post_id, user_id=current_user.id))
        db.commit()

    total = db.query(func.count(PostLike.id)).filter(PostLike.post_id == post_id).scalar() or 0
    return {"likes_count": total, "liked_by_me": True}


@router.delete("/{post_id}/like", status_code=status.HTTP_200_OK)
def unlike_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(Post.id).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(404, "Публикация не найдена")

    db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == current_user.id,
    ).delete()
    db.commit()

    total = db.query(func.count(PostLike.id)).filter(PostLike.post_id == post_id).scalar() or 0
    return {"likes_count": total, "liked_by_me": False}


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


@router.get("/search")
def search_posts(
    q: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = q.strip()
    if not q:
        return []

    pattern = f"%{q}%"
    posts = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.constellation))
        .filter(Post.content.ilike(pattern))
        .order_by(Post.created_at.desc(), Post.id.desc())
        .limit(50)
        .all()
    )

    stats = _collect_post_stats(db, [p.id for p in posts], current_user.id)

    return [
        serialize_post(
            p,
            comments_count=stats["comments"].get(p.id, 0),
            likes_count=stats["likes"].get(p.id, 0),
            liked_by_me=p.id in stats["my_likes"],
        )
        for p in posts
    ]


from sqlalchemy import desc


@router.get("/trending")
def get_trending(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Топ-10 постов за последние 7 дней по лайкам."""
    from datetime import timedelta
    from backend.models import PostLike

    since = datetime.utcnow() - timedelta(days=7)

    rows = (
        db.query(Post.id, func.count(PostLike.id).label("likes"))
        .outerjoin(PostLike, PostLike.post_id == Post.id)
        .filter(Post.created_at >= since)
        .group_by(Post.id)
        .order_by(desc("likes"))
        .limit(10)
        .all()
    )

    post_ids = [r[0] for r in rows]
    if not post_ids:
        return []

    posts = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.constellation))
        .filter(Post.id.in_(post_ids))
        .all()
    )

    posts_by_id = {p.id: p for p in posts}
    ordered = [posts_by_id[pid] for pid in post_ids if pid in posts_by_id]

    stats = _collect_post_stats(db, post_ids, current_user.id)
    return [
        serialize_post(
            p,
            comments_count=stats["comments"].get(p.id, 0),
            likes_count=stats["likes"].get(p.id, 0),
            liked_by_me=p.id in stats["my_likes"],
        )
        for p in ordered
    ]
