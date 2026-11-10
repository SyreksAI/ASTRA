from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Constellation, ConstellationMember, Post, User
from backend.routes.auth import get_current_user
from backend.routes.posts import serialize_post, _collect_post_stats

router = APIRouter(prefix="/api/constellations", tags=["constellations"])

SEED = [
    ("dev", "Разработка", "Код, API, деплой и инструменты"),
    ("design", "Дизайн", "UI/UX, макеты и визуальный язык"),
    ("tech", "Технологии", "AI, гаджеты и стартапы"),
    ("music", "Музыка", "Треки, альбомы и плейлисты"),
    ("games", "Игры", "Гейминг и киберспорт"),
    ("art", "Искусство", "Картины, фото и кино"),
    ("science", "Наука", "Космос, исследования и эксперименты"),
    ("sport", "Спорт", "Тренировки, матчи и фитнес"),
]


def seed_constellations(db: Session) -> None:
    existing = {row[0] for row in db.query(Constellation.slug).all()}
    for slug, label, description in SEED:
        if slug in existing:
            continue
        db.add(Constellation(slug=slug, label=label, description=description))
    db.commit()


def serialize_constellation(
    c: Constellation,
    *,
    members_count: int = 0,
    posts_count: int = 0,
    joined: bool = False,
) -> dict:
    return {
        "id": c.slug,
        "slug": c.slug,
        "label": c.label,
        "description": c.description,
        "members_count": members_count,
        "posts_count": posts_count,
        "joined": joined,
    }


def _get_by_slug(db: Session, slug: str) -> Constellation:
    c = db.query(Constellation).filter(Constellation.slug == slug).first()
    if c is None:
        raise HTTPException(404, "Созвездие не найдено")
    return c


@router.get("/")
def list_constellations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    seed_constellations(db)
    rows = db.query(Constellation).order_by(Constellation.label.asc()).all()
    if not rows:
        return []

    ids = [c.id for c in rows]

    members = dict(
        db.query(ConstellationMember.constellation_id, func.count(ConstellationMember.id))
        .filter(ConstellationMember.constellation_id.in_(ids))
        .group_by(ConstellationMember.constellation_id)
        .all()
    )
    posts = dict(
        db.query(Post.constellation_id, func.count(Post.id))
        .filter(Post.constellation_id.in_(ids))
        .group_by(Post.constellation_id)
        .all()
    )
    joined_ids = {
        row[0]
        for row in db.query(ConstellationMember.constellation_id)
        .filter(
            ConstellationMember.user_id == current_user.id,
            ConstellationMember.constellation_id.in_(ids),
        )
        .all()
    }

    return [
        serialize_constellation(
            c,
            members_count=members.get(c.id, 0),
            posts_count=posts.get(c.id, 0),
            joined=c.id in joined_ids,
        )
        for c in rows
    ]


@router.get("/{slug}")
def get_constellation(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    seed_constellations(db)
    c = _get_by_slug(db, slug)
    members_count = (
        db.query(func.count(ConstellationMember.id))
        .filter(ConstellationMember.constellation_id == c.id)
        .scalar()
        or 0
    )
    posts_count = (
        db.query(func.count(Post.id)).filter(Post.constellation_id == c.id).scalar() or 0
    )
    joined = (
        db.query(ConstellationMember.id)
        .filter(
            ConstellationMember.constellation_id == c.id,
            ConstellationMember.user_id == current_user.id,
        )
        .first()
        is not None
    )
    return serialize_constellation(
        c,
        members_count=members_count,
        posts_count=posts_count,
        joined=joined,
    )


@router.post("/{slug}/join", status_code=status.HTTP_200_OK)
def join_constellation(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    seed_constellations(db)
    c = _get_by_slug(db, slug)
    existing = (
        db.query(ConstellationMember)
        .filter(
            ConstellationMember.constellation_id == c.id,
            ConstellationMember.user_id == current_user.id,
        )
        .first()
    )
    if existing is None:
        db.add(
            ConstellationMember(
                constellation_id=c.id,
                user_id=current_user.id,
                joined_at=datetime.utcnow(),
            )
        )
        db.commit()
    return get_constellation(slug, current_user, db)


@router.delete("/{slug}/join", status_code=status.HTTP_200_OK)
def leave_constellation(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = _get_by_slug(db, slug)
    db.query(ConstellationMember).filter(
        ConstellationMember.constellation_id == c.id,
        ConstellationMember.user_id == current_user.id,
    ).delete()
    db.commit()
    return get_constellation(slug, current_user, db)


@router.get("/{slug}/posts")
def list_constellation_posts(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    seed_constellations(db)
    c = _get_by_slug(db, slug)
    posts = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.constellation))
        .filter(Post.constellation_id == c.id)
        .order_by(Post.created_at.desc(), Post.id.desc())
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
