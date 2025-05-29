from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.connection import get_db

# Direct dependency injection without additional wrapping
get_db_session = get_db