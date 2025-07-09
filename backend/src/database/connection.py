import os
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from .models.models import Base

# Load environment variables
load_dotenv()

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise ValueError(
        "DATABASE_URL environment variable is not set. "
    )


if database_url.startswith("postgresql://"):
    DATABASE_URL = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    DATABASE_URL = database_url

print(f"🔗 Connecting to database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'Unknown'}")

# Create async engine with better connection settings
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL logging
    pool_pre_ping=True,  # Validate connections before use
    pool_recycle=3600,   # Recycle connections every hour
)

# Create async session factory
async_session = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    autoflush=False,
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

async def check_database_health():
    """
    Advanced health check for database connection.
    """
    try:
        async with engine.connect() as conn:
            # Test basic connectivity
            await conn.execute(text("SELECT 1"))
            
            # Test if our tables exist
            await conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"))
            
        print("✅ Database health check passed")
        return True
    except Exception as e:
        print(f"❌ Database health check failed: {e}")
        return False