from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError
from jose import jwt, JWTError
from datetime import datetime, timedelta
import hmac
import os
from pathlib import Path
from uuid import uuid4

try:
    import crypt
except ImportError:  # Python 3.13+ / Windows development
    crypt = None

from backend.database import get_db
from backend.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError("SECRET_KEY must be set to a random value of at least 32 characters")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    full_name: str = Field(default="", max_length=100)
    bio: str = Field(default="", max_length=500)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return password_hash.verify(plain_password, hashed_password)
    except UnknownHashError:
        # Existing accounts may still have legacy MD5-crypt or DES-crypt hashes.
        if crypt is None:
            return False
        try:
            candidate = crypt.crypt(plain_password, hashed_password)
        except (OSError, ValueError):
            return False
        return candidate is not None and hmac.compare_digest(candidate, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    if len(request.password) < 6:
        raise HTTPException(400, "Password too short (min 6 characters)")

    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(400, "Email already registered")

    existing_username = db.query(User).filter(User.username == request.username).first()
    if existing_username:
        raise HTTPException(400, "Username already taken")

    hashed_password = get_password_hash(request.password)

    user = User(
        username=request.username,
        email=request.email,
        password_hash=hashed_password,
        full_name=request.full_name or request.username,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "avatar": user.avatar,
            "cover_image": user.cover_image,
            "bio": user.bio,
        },
    )


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    if not user.password_hash.startswith("$argon2"):
        user.password_hash = get_password_hash(request.password)
        db.commit()

    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "avatar": user.avatar,
            "cover_image": user.cover_image,
            "bio": user.bio,
        },
    )


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "bio": current_user.bio,
        "avatar": current_user.avatar,
        "cover_image": current_user.cover_image,
        "created_at": current_user.created_at.isoformat(),
        "preferences": current_user.preferences,
    }


@router.patch("/me")
def update_me(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    username = request.username.strip()
    if not username:
        raise HTTPException(400, "Имя пользователя не может быть пустым")

    duplicate = db.query(User).filter(
        User.username == username,
        User.id != current_user.id,
    ).first()
    if duplicate:
        raise HTTPException(409, "Это имя пользователя уже занято")

    current_user.username = username
    current_user.full_name = request.full_name.strip() or username
    current_user.bio = request.bio.strip()
    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "bio": current_user.bio,
        "avatar": current_user.avatar,
        "cover_image": current_user.cover_image,
        "created_at": current_user.created_at.isoformat(),
        "preferences": current_user.preferences,
    }


async def save_profile_image(
    image_kind: str,
    file: UploadFile,
    current_user: User,
    db: Session,
):
    allowed_types = {
        "image/jpeg": (".jpg", lambda data: data.startswith(b"\xff\xd8\xff")),
        "image/png": (".png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
        "image/webp": (".webp", lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP"),
    }
    image_type = allowed_types.get(file.content_type or "")
    if image_type is None:
        raise HTTPException(400, "Выберите изображение JPG, PNG или WebP")

    content = await file.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(413, "Размер изображения не должен превышать 5 МБ")
    extension, signature_check = image_type
    if not signature_check(content):
        raise HTTPException(400, "Файл не похож на изображение указанного формата")

    upload_root = Path(os.getenv("UPLOAD_DIR", "/app/uploads")) / image_kind
    upload_root.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    (upload_root / filename).write_bytes(content)

    image_url = f"/uploads/{image_kind}/{filename}"
    field_name = "cover_image" if image_kind == "covers" else "avatar"
    setattr(current_user, field_name, image_url)
    db.commit()
    db.refresh(current_user)
    return {field_name: image_url}


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await save_profile_image("avatars", file, current_user, db)


@router.post("/me/cover")
async def upload_cover(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await save_profile_image("covers", file, current_user, db)
