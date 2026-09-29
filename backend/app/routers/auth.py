from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token
from app import auth

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account with a secure bcrypt-hashed password."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    role = user_in.role if user_in.role in ["user", "admin"] else "user"

    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=auth.hash_password(user_in.password),
        role=role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post(
    "/login",
    response_model=Token,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Log in with email (username) and password to receive a JWT Bearer access token."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_current_user_profile(current_user: User = Depends(auth.get_current_user)):
    """Protected route: Returns the profile and role of the currently logged-in user."""
    return current_user
