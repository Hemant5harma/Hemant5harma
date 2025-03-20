from pydantic import BaseModel

class UserCreate(BaseModel):
    address: str  # Wallet address, must be unique

class UserResponse(BaseModel):
    id: int
    address: str

    class Config:
        from_attributes = True  # Allows mapping from SQLAlchemy models