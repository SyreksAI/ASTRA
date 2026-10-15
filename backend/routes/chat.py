from datetime import datetime
from pathlib import Path
from uuid import uuid4
import os

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import SessionLocal, get_db
from backend.models import Conversation, ConversationMember, Message, User
from backend.realtime import manager
from backend.routes.auth import ALGORITHM, SECRET_KEY, get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])


# ============ СХЕМЫ ============

class ConversationCreate(BaseModel):
    """Создать 1-на-1 диалог."""
    user_id: int


class GroupCreate(BaseModel):
    """Создать группу. Минимум 1 приглашённый."""
    title: str = Field(min_length=1, max_length=120)
    user_ids: list[int] = Field(min_length=1, max_length=50)
    avatar_url: str | None = Field(default=None, max_length=255)


class ConversationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    avatar_url: str | None = Field(default=None, max_length=255)


class MemberAdd(BaseModel):
    user_id: int


class MessageCreate(BaseModel):
    text: str = Field(default="", max_length=5000)
    type: str | None = None           # "image" | "file" | None
    file_url: str | None = None
    file_name: str | None = None
    file_size: int | None = None
    mime_type: str | None = None


class GroupSettingsUpdate(BaseModel):
    group_type: str | None = Field(default=None, pattern="^(private|public)$")
    reactions_mode: str | None = Field(default=None, pattern="^(all|some|none)$")
    topics_enabled: bool | None = None
    history_for_new: bool | None = None
    permissions: dict | None = None


# ============ ХЕЛПЕРЫ ============

def serialize_user_short(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar": user.avatar,
        "last_seen_at": user.last_seen_at.isoformat() if user.last_seen_at else None,
    }


def serialize_user_with_status(user: User, role: str | None = None) -> dict:
    data = {
        **serialize_user_short(user),
        "online": manager.is_online(user.id),
    }
    if role is not None:
        data["role"] = role
    return data


def serialize_message(message: Message, current_user_id: int) -> dict:
    return {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "text": message.text,
        "is_me": message.sender_id == current_user_id,
        "sender_id": message.sender_id,
        "sender_name": message.sender.full_name if message.sender else None,
        "type": message.type,
        "file_url": message.file_url,
        "file_name": message.file_name,
        "file_size": message.file_size,
        "mime_type": message.mime_type,
        "read_at": message.read_at.isoformat() if message.read_at else None,
        "created_at": message.created_at.isoformat(),
    }


def serialize_message_raw(message: Message) -> dict:
    return {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "text": message.text,
        "sender_id": message.sender_id,
        "sender_name": message.sender.full_name if message.sender else None,
        "type": message.type,
        "file_url": message.file_url,
        "file_name": message.file_name,
        "file_size": message.file_size,
        "mime_type": message.mime_type,
        "read_at": message.read_at.isoformat() if message.read_at else None,
        "created_at": message.created_at.isoformat(),
    }


def get_member_ids(db: Session, conversation_id: int) -> list[int]:
    return list(db.scalars(
        select(ConversationMember.user_id)
        .where(ConversationMember.conversation_id == conversation_id)
    ).all())


def is_member(db: Session, conversation_id: int, user_id: int) -> bool:
    return db.scalar(
        select(ConversationMember.id).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
    ) is not None


def find_direct_conversation(db: Session, user_a: int, user_b: int) -> Conversation | None:
    ids_a = select(ConversationMember.conversation_id).where(
        ConversationMember.user_id == user_a
    ).scalar_subquery()
    ids_b = select(ConversationMember.conversation_id).where(
        ConversationMember.user_id == user_b
    ).scalar_subquery()

    return db.scalar(
        select(Conversation)
        .where(
            Conversation.type == "direct",
            Conversation.id.in_(ids_a),
            Conversation.id.in_(ids_b),
        )
        .limit(1)
    )


def get_or_create_direct(db: Session, user_a: int, user_b: int) -> Conversation:
    conv = find_direct_conversation(db, user_a, user_b)
    if conv is not None:
        return conv

    conv = Conversation(type="direct", created_by=user_a)
    db.add(conv)
    db.flush()

    db.add(ConversationMember(conversation_id=conv.id, user_id=user_a, role="member"))
    db.add(ConversationMember(conversation_id=conv.id, user_id=user_b, role="member"))
    db.flush()
    return conv


def build_conversation_payload(
    db: Session,
    conv: Conversation,
    current_user_id: int,
) -> dict:
    last_message = db.scalar(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .limit(1)
    )

    unread = db.scalar(
        select(Message)
        .where(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id,
            Message.read_at.is_(None),
        )
        .limit(1)
    )

    members = db.scalars(
        select(User)
        .join(ConversationMember, ConversationMember.user_id == User.id)
        .where(ConversationMember.conversation_id == conv.id)
    ).all()

    if conv.type == "direct":
        other = next((m for m in members if m.id != current_user_id), None)
        if other is None and members:
            other = members[0]
        display_name = (other.full_name or other.username) if other else "Диалог"
        display_avatar = other.avatar if other else "/default-avatar.png"
        payload_user = serialize_user_short(other) if other else None
    else:
        display_name = conv.title or "Группа"
        display_avatar = conv.avatar_url or "/default-avatar.png"
        payload_user = None

    # Превью последнего сообщения с учётом типа
    if last_message:
        if last_message.type == "image":
            preview = "📷 Фото"
        elif last_message.type == "file":
            preview = f"📎 {last_message.file_name or 'Файл'}"
        else:
            preview = last_message.text or ""
    else:
        preview = ""

    return {
        "id": conv.id,
        "type": conv.type,
        "title": conv.title,
        "avatar_url": conv.avatar_url,
        "display_name": display_name,
        "display_avatar": display_avatar,
        "user": payload_user,
        "members_count": len(members),
        "last_message": preview,
        "last_message_at": (
            last_message.created_at.isoformat()
            if last_message
            else conv.updated_at.isoformat()
        ),
        "has_unread": unread is not None,
    }


# ============ HTTP-РОУТЫ ============

@router.get("/users/online")
def get_online_users(
    ids: str,
    current_user: User = Depends(get_current_user),
):
    user_ids = []
    for x in ids.split(","):
        x = x.strip()
        if x.isdigit():
            user_ids.append(int(x))

    online_ids = [uid for uid in user_ids if manager.is_online(uid)]
    return {"online_ids": online_ids}


@router.get("/users/{user_id}/status")
def get_user_status(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "Пользователь не найден")

    return {
        "user_id": user.id,
        "online": manager.is_online(user_id),
        "last_seen_at": user.last_seen_at.isoformat() if user.last_seen_at else None,
    }


@router.get("/conversations")
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation_ids = db.scalars(
        select(ConversationMember.conversation_id)
        .where(ConversationMember.user_id == current_user.id)
    ).all()

    if not conversation_ids:
        return []

    conversations = db.scalars(
        select(Conversation)
        .where(Conversation.id.in_(conversation_ids))
        .order_by(Conversation.updated_at.desc())
    ).all()

    return [
        build_conversation_payload(db, conv, current_user.id)
        for conv in conversations
    ]


@router.post("/conversations", status_code=201)
def create_direct_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.user_id == current_user.id:
        raise HTTPException(400, "Нельзя открыть чат с самим собой")

    other = db.get(User, data.user_id)
    if other is None:
        raise HTTPException(404, "Пользователь не найден")

    conv = get_or_create_direct(db, current_user.id, data.user_id)
    db.commit()
    db.refresh(conv)

    return build_conversation_payload(db, conv, current_user.id)


@router.post("/conversations/group", status_code=201)
def create_group_conversation(
    data: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    title = data.title.strip()
    if not title:
        raise HTTPException(400, "Введите название группы")

    member_ids = {current_user.id}
    for uid in data.user_ids:
        if uid != current_user.id:
            member_ids.add(uid)

    if len(member_ids) < 2:
        raise HTTPException(400, "В группе должно быть минимум 2 участника (вы + 1)")

    existing_users = db.scalars(
        select(User).where(User.id.in_(member_ids))
    ).all()
    if len(existing_users) != len(member_ids):
        raise HTTPException(404, "Один или несколько пользователей не найдены")

    conv = Conversation(
        type="group",
        title=title,
        avatar_url=data.avatar_url,
        created_by=current_user.id,
    )
    db.add(conv)
    db.flush()

    for uid in member_ids:
        db.add(ConversationMember(
            conversation_id=conv.id,
            user_id=uid,
            role="owner" if uid == current_user.id else "member",
        ))

    db.commit()
    db.refresh(conv)

    return build_conversation_payload(db, conv, current_user.id)


@router.get("/conversations/{conversation_id}")
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(404, "Диалог не найден")
    if not is_member(db, conversation_id, current_user.id):
        raise HTTPException(403, "Нет доступа к этому диалогу")

    members = db.scalars(
        select(User)
        .join(ConversationMember, ConversationMember.user_id == User.id)
        .where(ConversationMember.conversation_id == conversation_id)
    ).all()

    member_roles = dict(db.execute(
        select(ConversationMember.user_id, ConversationMember.role)
        .where(ConversationMember.conversation_id == conversation_id)
    ).all())

    payload = build_conversation_payload(db, conv, current_user.id)
    payload["members"] = [
        serialize_user_with_status(u, member_roles.get(u.id, "member"))
        for u in members
    ]
    return payload


@router.patch("/conversations/{conversation_id}")
def update_conversation(
    conversation_id: int,
    data: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(404, "Диалог не найден")
    if conv.type != "group":
        raise HTTPException(400, "Можно редактировать только группы")

    member = db.scalar(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if member is None:
        raise HTTPException(403, "Нет доступа")
    if member.role not in ("owner", "admin"):
        raise HTTPException(403, "Только владелец или админ может редактировать группу")

    if data.title is not None:
        conv.title = data.title.strip()[:120]
    if data.avatar_url is not None:
        conv.avatar_url = data.avatar_url[:255]

    db.commit()
    db.refresh(conv)

    return build_conversation_payload(db, conv, current_user.id)


@router.post("/conversations/{conversation_id}/members", status_code=201)
def add_member(
    conversation_id: int,
    data: MemberAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(404, "Диалог не найден")
    if conv.type != "group":
        raise HTTPException(400, "Добавлять участников можно только в группы")

    me = db.scalar(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if me is None:
        raise HTTPException(403, "Нет доступа")
    if is_member(db, conversation_id, data.user_id):
        raise HTTPException(409, "Пользователь уже в группе")

    other = db.get(User, data.user_id)
    if other is None:
        raise HTTPException(404, "Пользователь не найден")

    db.add(ConversationMember(
        conversation_id=conversation_id,
        user_id=data.user_id,
        role="member",
    ))
    conv.updated_at = datetime.utcnow()
    db.commit()

    member_ids = get_member_ids(db, conversation_id)
    return {
        "ok": True,
        "member": serialize_user_short(other),
        "member_ids": member_ids,
    }


@router.delete("/conversations/{conversation_id}/members/{user_id}", status_code=200)
def remove_member(
    conversation_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(404, "Диалог не найден")
    if conv.type != "group":
        raise HTTPException(400, "Это не группа")

    me = db.scalar(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if me is None:
        raise HTTPException(403, "Нет доступа")

    target = db.scalar(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
    )
    if target is None:
        raise HTTPException(404, "Пользователь не в группе")

    if user_id != current_user.id and me.role not in ("owner", "admin"):
        raise HTTPException(403, "Недостаточно прав")

    if user_id == current_user.id and me.role == "owner":
        remaining = db.scalar(
            select(ConversationMember.id).where(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id != current_user.id,
            ).limit(1)
        )
        if remaining is not None:
            raise HTTPException(409, "Владелец не может выйти, пока в группе есть участники")

    db.delete(target)
    conv.updated_at = datetime.utcnow()
    db.commit()

    return {"ok": True, "removed_user_id": user_id}


@router.post("/conversations/{conversation_id}/leave", status_code=200)
def leave_group(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(404, "Диалог не найден")
    if conv.type != "group":
        raise HTTPException(400, "Это не группа")

    member = db.scalar(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if member is None:
        raise HTTPException(404, "Вы не в этой группе")

    if member.role == "owner":
        remaining = db.scalar(
            select(ConversationMember.id).where(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id != current_user.id,
            ).limit(1)
        )
        if remaining is not None:
            raise HTTPException(409, "Владелец не может выйти, пока в группе есть участники")

    db.delete(member)
    conv.updated_at = datetime.utcnow()
    db.commit()

    return {"ok": True}


@router.get("/conversations/{conversation_id}/messages")
def list_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(404, "Диалог не найден")
    if not is_member(db, conversation_id, current_user.id):
        raise HTTPException(403, "Нет доступа к этому диалогу")

    messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .limit(500)
    ).all()

    now = datetime.utcnow()
    changed = False
    for msg in messages:
        if msg.sender_id != current_user.id and msg.read_at is None:
            msg.read_at = now
            changed = True
    if changed:
        db.commit()

    return {
        "conversation_id": conv.id,
        "type": conv.type,
        "title": conv.title,
        "user": None,
        "messages": [serialize_message(m, current_user.id) for m in messages],
    }


@router.post("/conversations/{conversation_id}/messages", status_code=201)
async def send_message(
    conversation_id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(404, "Диалог не найден")
    if not is_member(db, conversation_id, current_user.id):
        raise HTTPException(403, "Нет доступа к этому диалогу")

    text = (data.text or "").strip()
    if not text and not data.file_url:
        raise HTTPException(400, "Сообщение не может быть пустым")

    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        text=text,
        type=data.type,
        file_url=data.file_url,
        file_name=data.file_name,
        file_size=data.file_size,
        mime_type=data.mime_type,
    )
    db.add(message)
    conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(message)

    member_ids = get_member_ids(db, conversation_id)
    await manager.broadcast(
        user_ids=member_ids,
        payload={
            "type": "message.new",
            "conversation_id": conv.id,
            "message": serialize_message_raw(message),
            "sender": serialize_user_short(current_user),
        },
    )

    return serialize_message(message, current_user.id)


# ============ ЗАГРУЗКА ФАЙЛОВ ============

@router.post("/conversations/{conversation_id}/upload", status_code=201)
async def upload_chat_file(
    conversation_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(404, "Диалог не найден")
    if not is_member(db, conversation_id, current_user.id):
        raise HTTPException(403, "Нет доступа")

    upload_dir = Path(os.getenv("UPLOAD_DIR", "/app/uploads")) / "chat"
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "").suffix or ".bin"
    filename = f"{uuid4().hex}{ext}"
    content = await file.read()

    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(413, "Файл слишком большой (макс. 25 МБ)")

    (upload_dir / filename).write_bytes(content)

    return {
        "url": f"/uploads/chat/{filename}",
        "file_name": file.filename,
        "file_size": len(content),
        "mime_type": file.content_type,
    }


# ============ WEBSOCKET ============

@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket, token: str | None = None):
    if not token:
        await websocket.close(code=4401)
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        await websocket.close(code=4401)
        return

    with SessionLocal() as db:
        user = db.get(User, user_id)
        if user is None:
            await websocket.close(code=4401)
            return
        user.last_seen_at = datetime.utcnow()
        db.commit()

    await manager.connect(user_id, websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        with SessionLocal() as db:
            u = db.get(User, user_id)
            if u:
                u.last_seen_at = datetime.utcnow()
                db.commit()
    except Exception:
        manager.disconnect(user_id, websocket)


# ============ НАСТРОЙКИ ГРУППЫ ============

@router.patch("/conversations/{conversation_id}/settings")
def update_group_settings(
    conversation_id: int,
    data: GroupSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(404, "Диалог не найден")
    if conv.type != "group":
        raise HTTPException(400, "Только для групп")

    me = db.scalar(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if me is None or me.role not in ("owner", "admin"):
        raise HTTPException(403, "Только владелец или админ")

    return {
        "ok": True,
        "group_type": data.group_type,
        "reactions_mode": data.reactions_mode,
        "topics_enabled": data.topics_enabled,
        "history_for_new": data.history_for_new,
        "permissions": data.permissions,
    }


@router.post("/conversations/{conversation_id}/invite-link", status_code=201)
def create_invite_link(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(404, "Диалог не найден")
    if conv.type != "group":
        raise HTTPException(400, "Только для групп")

    me = db.scalar(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if me is None or me.role not in ("owner", "admin"):
        raise HTTPException(403, "Недостаточно прав")

    import secrets
    code = secrets.token_urlsafe(8)
    link = f"/join/{code}"
    return {"link": link, "code": code}


@router.delete("/conversations/{conversation_id}/invite-link/{code}", status_code=200)
def delete_invite_link(
    conversation_id: int,
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conversation_id)
    if conv is None:
        raise HTTPException(404, "Диалог не найден")

    me = db.scalar(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if me is None or me.role not in ("owner", "admin"):
        raise HTTPException(403, "Недостаточно прав")

    return {"ok": True, "deleted": code}