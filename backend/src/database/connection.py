import os
from dotenv import load_dotenv
from urllib.parse import urlparse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from .models.models import Base

# Load environment variables
load_dotenv()

# Parse DATABASE_URL from environment with fallback
database_url = os.getenv("DATABASE_URL")

if database_url:
    tmpPostgres = urlparse(database_url)
    DATABASE_URL = f"postgresql+asyncpg://{tmpPostgres.username}:{tmpPostgres.password}@{tmpPostgres.hostname}{tmpPostgres.path}?ssl=require"
else:
    # Fallback for local development
    DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/trading_bot"
    print("Warning: DATABASE_URL not found, using default local database")

# Create async engine with better connection settings
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL logging
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Validate connections before use
    pool_recycle=3600,   # Recycle connections every hour
)

# Create async session factory
async_session = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

async def init_db():
    """
    Initializes the database by creating all tables defined in the models.
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database initialized successfully.")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise

async def get_db():
    """
    Dependency to get an async database session.
    """
    async with async_session() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            raise
        finally:
            await session.close()

async def test_connection():
    """
    Tests the database connection by running a simple query.
    """
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 'Database connection successful' as message"))
            message = result.fetchone()
            print(f"✅ {message[0]}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False