from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)
    role: Optional[str] = Field("user", description="Role: 'user' or 'admin'")


class UserCreate(UserBase):
    password: str = Field(..., min_length=4)


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
