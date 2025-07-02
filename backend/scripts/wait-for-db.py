#!/usr/bin/env python3
"""
Database readiness check script.
This script waits for PostgreSQL to be ready before proceeding.
"""
import asyncio
import sys
import os
import time
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

def normalize_asyncpg_url(url: str) -> str:
    """Ensure DATABASE_URL uses asyncpg driver for SQLAlchemy async."""
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

async def wait_for_database(database_url: str, max_retries: int = 30, delay: int = 2):
    """
    Wait for database to be ready.
    
    Args:
        database_url: PostgreSQL connection URL
        max_retries: Maximum number of connection attempts
        delay: Delay between attempts in seconds
    """
    engine = create_async_engine(normalize_asyncpg_url(database_url), pool_pre_ping=True)
    
    for attempt in range(max_retries):
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            print(f"✅ Database is ready after {attempt + 1} attempts!")
            await engine.dispose()
            return True
        except Exception as e:
            print(f"⏳ Attempt {attempt + 1}/{max_retries}: Database not ready yet - {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                print("❌ Database failed to become ready within the timeout period")
                await engine.dispose()
                return False
    
    await engine.dispose()
    return False

def main():
    raw_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres_password@database:5432/trading_bot")
    database_url = normalize_asyncpg_url(raw_url)
    
    print(f"🔍 Waiting for database at: {database_url.split('@')[1] if '@' in database_url else 'Unknown'}")
    
    success = asyncio.run(wait_for_database(database_url))
    
    if not success:
        sys.exit(1)
    
    print("🚀 Database is ready! Proceeding with application startup...")

if __name__ == "__main__":
    main() 