"""
Migration script to add condition fields to the Coin table

This migration adds the following columns to the coins table:
- condition_type: VARCHAR with default 'price_drop'
- condition_params: JSON with default {'threshold': 5.0}
- logic_operator: VARCHAR with default 'AND'

Run this script after updating the models to ensure existing data is compatible.
"""

from sqlalchemy import create_engine, text
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection URL - update with your actual database URL
DATABASE_URL = "sqlite:///./bot_trading.db"  # Update this to your actual database URL

def run_migration():
    """Run the migration to add condition fields to the coins table"""
    
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as connection:
            # Start a transaction
            with connection.begin():
                logger.info("Starting migration to add condition fields to coins table...")
                
                # Check if columns already exist
                result = connection.execute(text("PRAGMA table_info(coins)"))
                columns = [row[1] for row in result.fetchall()]
                
                # Add condition_type column if it doesn't exist
                if 'condition_type' not in columns:
                    logger.info("Adding condition_type column...")
                    connection.execute(text(
                        "ALTER TABLE coins ADD COLUMN condition_type VARCHAR DEFAULT 'price_drop'"
                    ))
                    
                    # Update existing rows to have price_drop condition
                    connection.execute(text(
                        "UPDATE coins SET condition_type = 'price_drop' WHERE condition_type IS NULL"
                    ))
                    logger.info("✓ Added condition_type column")
                else:
                    logger.info("✓ condition_type column already exists")
                
                # Add condition_params column if it doesn't exist
                if 'condition_params' not in columns:
                    logger.info("Adding condition_params column...")
                    connection.execute(text(
                        "ALTER TABLE coins ADD COLUMN condition_params JSON"
                    ))
                    
                    # Update existing rows to have condition_params based on their threshold
                    update_query = text("""
                        UPDATE coins 
                        SET condition_params = json_object('threshold', threshold) 
                        WHERE condition_params IS NULL
                    """)
                    connection.execute(update_query)
                    logger.info("✓ Added condition_params column")
                else:
                    logger.info("✓ condition_params column already exists")
                
                # Add logic_operator column if it doesn't exist
                if 'logic_operator' not in columns:
                    logger.info("Adding logic_operator column...")
                    connection.execute(text(
                        "ALTER TABLE coins ADD COLUMN logic_operator VARCHAR DEFAULT 'AND'"
                    ))
                    
                    # Update existing rows
                    connection.execute(text(
                        "UPDATE coins SET logic_operator = 'AND' WHERE logic_operator IS NULL"
                    ))
                    logger.info("✓ Added logic_operator column")
                else:
                    logger.info("✓ logic_operator column already exists")
                
                logger.info("Migration completed successfully!")
                
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        raise e
    
    finally:
        engine.dispose()

if __name__ == "__main__":
    run_migration() 