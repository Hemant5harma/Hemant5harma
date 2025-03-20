import os
from dotenv import load_dotenv
from urllib.parse import urlparse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from .models.models import Base

# Load environment variables
load_dotenv()

# Parse DATABASE_URL from environment
tmpPostgres = urlparse(os.getenv("DATABASE_URL"))

# Create async engine
DATABASE_URL = f"postgresql+asyncpg://{tmpPostgres.username}:{tmpPostgres.password}@{tmpPostgres.hostname}{tmpPostgres.path}?ssl=require"
engine = create_async_engine(DATABASE_URL)

# Create async session factory
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    """
    Initializes the database by creating all tables defined in the models.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialized successfully.")

async def get_db():
    """
    Dependency to get an async database session.
    """
    async with async_session() as session:
        yield session

async def test_connection():
    """
    Tests the database connection by running a simple query.
    """
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 'hello world'"))
        print(result.fetchall())
    await engine.dispose()