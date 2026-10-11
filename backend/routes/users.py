from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Comment, Post, User
from backend.routes.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


def serialize_public_user(
    user: User,
    posts_count: int = 0,
    current_user: User | None = None,
    db: Session | None = None,
) -> dict:
    followers_count = 0
    following_count = 0
    is_following = False

    if db is not None:
        from backend.models import Follow

        followers_count = db.query(func.count(Follow.id)).filter(
            Follow.following_id == user.id
        ).scalar() or 0

        following_count = db.query(func.count(Follow.id)).filter(
            Follow.follower_id == user.id
        ).scalar() or 0

        if current_user and current_user.id != user.id:
            is_following = db.query(Follow).filter(
                Follow.follower_id == current_user.id,
                Follow.following_id == user.id,
            ).first() is not None

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar": user.avatar,
        "cover_image": user.cover_image,
        "bio": user.bio,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "followers_count": followers_count,
        "following_count": following_count,
        "is_following": is_following,
        "posts_count": posts_count,
        "is_me": bool(current_user and current_user.id == user.id),
    }

@router.get("/{username}")
def get_user_profile(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(404, "Пользователь не найден")

    posts_count = db.scalar(
        select(func.count(Post.id)).where(Post.user_id == user.id)
    ) or 0

    return serialize_public_user(user, posts_count, current_user, db)


@router.get("/{username}/posts")
def get_user_posts(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(404, "Пользователь не найден")

    posts = (
        db.query(Post)
        .filter(Post.user_id == user.id)
        .order_by(Post.created_at.desc(), Post.id.desc())
        .limit(100)
        .all()
    )

    from backend.models import PostLike
    from backend.routes.posts import serialize_post

    post_ids = [p.id for p in posts]

    likes_counts = {}
    comments_counts = {}
    my_likes = set()

    if post_ids:
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
            .filter(PostLike.post_id.in_(post_ids), PostLike.user_id == current_user.id)
            .all()
        }

    return [
        serialize_post(
            post,
            comments_count=comments_counts.get(post.id, 0),
            likes_count=likes_counts.get(post.id, 0),
            liked_by_me=post.id in my_likes,
        )
        for post in posts
    ]
