from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str | None = None  # Placeholder for future expansion


class UserRead(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
