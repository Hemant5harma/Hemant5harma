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

if not database_url:
    # Build URL from individual parts *without* hard-coded defaults
    db_user = os.getenv("POSTGRES_USER")
    db_pass = os.getenv("POSTGRES_PASSWORD")
    db_host = os.getenv("POSTGRES_HOST")
    db_port = os.getenv("POSTGRES_PORT", "5432")  # port can reasonably default
    db_name = os.getenv("POSTGRES_DB")

    missing = [k for k, v in {
        'POSTGRES_USER': db_user,
        'POSTGRES_PASSWORD': db_pass,
        'POSTGRES_DB': db_name,
        'POSTGRES_HOST': db_host
    }.items() if not v]
    if missing:
        raise ValueError(f"Missing required database environment variables: {', '.join(missing)}")

    database_url = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

if database_url:
    # Check if this is a local database connection (no SSL required)
    if any(h in database_url for h in ("localhost", "database:", "127.0.0.1")):
        # Local database - use asyncpg directly without SSL
        if database_url.startswith("postgresql://"):
            DATABASE_URL = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        else:
            DATABASE_URL = database_url
    else:
        # Remote database - parse and add SSL requirement
        tmpPostgres = urlparse(database_url)
        DATABASE_URL = f"postgresql+asyncpg://{tmpPostgres.username}:{tmpPostgres.password}@{tmpPostgres.hostname}{tmpPostgres.path}?ssl=require"
else:
    # Fallback for local development
    DATABASE_URL = "postgresql+asyncpg://postgres:postgres_password@localhost:5432/trading_bot"
    print("Warning: DATABASE_URL not found, using default local database")

print(f"🔗 Connecting to database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'Unknown'}")

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