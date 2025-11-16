from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re

# Email/Password Authentication Models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v.strip()

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: Optional[str] = None
    name: Optional[str] = None
    address: Optional[str] = None  # For wallet auth (future use)
    email_verified: Optional[int] = 0

    class Config:
        from_attributes = True  # Allows mapping from SQLAlchemy models

# Wallet Authentication Models (commented out for future use)
class UserCreate(BaseModel):
    address: str  # Wallet address, must be unique