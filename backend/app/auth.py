import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from . import models

# Secret key used to cryptographically sign JWT tokens
# In production, keep this secret and store it in .env
SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_jwt_key_for_learning_purposes_123456")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# OAuth2PasswordBearer tells FastAPI that the token comes in the Authorization header as:
# "Authorization: Bearer <token>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ==========================================
# 1. PASSWORD HASHING (bcrypt)
# ==========================================

def hash_password(password: str) -> str:
    """Hash a raw string password into a secure bcrypt hash."""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify that a plain text password matches the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except ValueError:
        # Returns False safely if the stored hash is not a valid bcrypt format
        return False


# ==========================================
# 2. JWT TOKEN CREATION
# ==========================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT token containing user identity and expiration timestamp."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ==========================================
# 3. AUTHENTICATION DEPENDENCY
# ==========================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    """
    Dependency that:
    1. Extracts the Bearer token from the request header.
    2. Decodes and verifies the signature and expiration.
    3. Fetches and returns the User object from PostgreSQL.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub")
        if user_email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == user_email).first()
    if user is None:
        raise credentials_exception

    return user


def get_current_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    """
    Authorization Dependency:
    1. Authenticates user via get_current_user.
    2. Rejects request with 403 Forbidden if user is not an Admin.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required.",
        )
    return current_user
