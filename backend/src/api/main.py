from fastapi import FastAPI
from src.database.connection import init_db, engine, test_connection
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.database.models.models import Base
from .endpoints import users, auth, bots, manual_trading, private_keys, notifications
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    try:
        logger.info("🚀 Starting DCA Bot Platform API...")
        
        # Test database connection first
        logger.info("🔧 Testing database connection...")
        connection_ok = await test_connection()
        
        if not connection_ok:
            logger.error("❌ Database connection failed! Please check your DATABASE_URL")
            raise Exception("Database connection failed")
        
        # Initialize database tables
        logger.info("📊 Initializing database tables...")
        await init_db()
        logger.info("✅ Database initialization complete")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    finally:
        # Cleanup
        logger.info("🧹 Cleaning up database connections...")
        await engine.dispose()
        logger.info("👋 Shutdown complete")

app = FastAPI(
    title="DCA Bot Platform API",
    description="Trading platform with DCA bots and manual trading functionality",
    version="1.0.0",
    lifespan=lifespan
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(bots.router, prefix="/bots", tags=["bots"])
app.include_router(manual_trading.router, prefix="/mtrades", tags=["manual-trading"])
app.include_router(private_keys.router, prefix="/private-keys", tags=["private-keys"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

@app.get("/")
async def root():
    return {
        "message": "DCA Bot Platform API with Manual Trading",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        db_status = await test_connection()
        return {
            "status": "healthy" if db_status else "unhealthy",
            "database": "connected" if db_status else "disconnected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "error",
            "error": str(e)
        }