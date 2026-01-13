#!/usr/bin/env python3
"""
Database Connection Test Script
Run this to test your database connection before starting the server.
"""

import asyncio
import os
from dotenv import load_dotenv
from src.database.connection import test_connection, init_db, engine

async def main():
    print("🔧 Testing Database Connection...")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    
    # Check if DATABASE_URL exists
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        print(f"✅ DATABASE_URL found")
        # Hide password in output
        safe_url = db_url.split('@')[1] if '@' in db_url else "localhost"
        print(f"📍 Database: {safe_url}")
    else:
        print("⚠️  DATABASE_URL not found, using fallback")
    
    print()
    
    # Test connection
    success = await test_connection()
    
    if success:
        print("\n🎯 Testing database initialization...")
        try:
            await init_db()
            print("✅ Database tables created successfully")
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            return False
    else:
        print("\n❌ Cannot proceed without database connection")
        print("\n🔧 Troubleshooting steps:")
        print("1. Check your DATABASE_URL in .env file")
        print("2. Ensure PostgreSQL is running")
        print("3. Verify database credentials")
        print("4. Check network connectivity")
        return False
    
    # Clean up
    await engine.dispose()
    print("\n✅ All database tests passed!")
    return True

if __name__ == "__main__":
    asyncio.run(main())

