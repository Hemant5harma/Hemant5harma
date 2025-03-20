from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.connection import get_db

# Dependency to inject the database session into endpoints
async def get_db_session(db: AsyncSession = Depends(get_db)):
    yield db