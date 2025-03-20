from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.queries import create_user, get_user_by_address
from src.py_models.user import UserCreate, UserResponse
from src.api.dependencies import get_db_session

router = APIRouter()

@router.post("/", response_model=UserResponse)
async def create_new_user(user: UserCreate, db: AsyncSession = Depends(get_db_session)):
    existing_user = await get_user_by_address(db, user.address)
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this address already exists")
    db_user = await create_user(db, user.address)
    return db_user

@router.get("/{address}", response_model=UserResponse)
async def get_user(address: str, db: AsyncSession = Depends(get_db_session)):
    user = await get_user_by_address(db, address)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user