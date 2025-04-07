from datetime import datetime, timedelta, timezone
from typing import Optional, Callable, Any
from sqlalchemy.future import select
from src.database.models.models import Bot
from src.services.manager import BotManager
import logging
from src.database.connection import async_session
from src.database.connection import get_db  # <- note we're importing the function, not calling it
from src.services.logic import parse_frequency

logger = logging.getLogger(__name__)

class JobManager:
    def __init__(self, scheduler_manager: BotManager):
        self.scheduler_manager = scheduler_manager
        # Store a reference to the get_db function (without parentheses).
        self.get_db = get_db

    async def start_bot_job(self, bot_id: int, check_bot: Callable):
        """Start a bot job using SQLAlchemy ORM"""
        try:
            # Advance the get_db generator to get a session
            db_gen = self.get_db()
            db = await anext(db_gen)

            # Get the bot
            result = await db.execute(select(Bot).where(Bot.id == bot_id))
            bot = result.scalars().first()

            if not bot:
                logger.error(f"Bot with ID {bot_id} not found")
                await db_gen.aclose()
                return False

            # Update the bot status
            bot_frequency = bot.frequency
            next_run_time = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=30)
            
        
            # Schedule the job
            self.scheduler_manager.schedule_job(bot_id, next_run_time, check_bot, [bot_id],bot_frequency)
            bot.status = "running"
            await db.commit()
            logger.info(f"Bot {bot_id} started successfully")
            await db_gen.aclose()
            return True

        except Exception as e:
            logger.error(f"Error starting bot {bot_id}: {str(e)}")
            return False

    async def pause_bot_job(self, bot_id: int):
        """Pause a bot job using SQLAlchemy ORM"""
        try:
            # Advance the get_db generator to get a session
            db_gen = self.get_db()
            db = await anext(db_gen)

            # Get the bot
            result = await db.execute(select(Bot).where(Bot.id == bot_id))
            bot = result.scalars().first()

            if not bot:
                logger.error(f"Bot with ID {bot_id} not found")
                await db_gen.aclose()
                return False

            # Pause the job in the scheduler
            self.scheduler_manager.pause_job(bot_id)
            bot.status = 'paused'

            await db.commit()
            logger.info(f"Bot {bot_id} paused successfully")
            await db_gen.aclose()
            return True

        except Exception as e:
            logger.error(f"Error pausing bot {bot_id}: {str(e)}")
            return False

    async def resume_bot_job(self, bot_id: int):
        """Resume a bot job using SQLAlchemy ORM"""
        try:
            # Advance the get_db generator to get a session
            db_gen = self.get_db()
            db = await anext(db_gen)

            # Get the bot
            result = await db.execute(select(Bot).where(Bot.id == bot_id))
            bot = result.scalars().first()

            if not bot:
                logger.error(f"Bot with ID {bot_id} not found")
                await db_gen.aclose()
                return False

            # Update the bot status
            bot.status = 'running'

            await db.commit()

            # Resume the job in the scheduler
            self.scheduler_manager.resume_job(bot_id)
            logger.info(f"Bot {bot_id} resumed successfully")
            await db_gen.aclose()
            return True

        except Exception as e:
            logger.error(f"Error resuming bot {bot_id}: {str(e)}")
            return False

    async def exit_bot_job(self, bot_id: int):
        """Delete a bot using SQLAlchemy ORM"""
        try:
            # Advance the get_db generator to get a session
            db_gen = self.get_db()
            db = await anext(db_gen)

            # Get the bot
            result = await db.execute(select(Bot).where(Bot.id == bot_id))
            bot = result.scalars().first()

            if not bot:
                logger.error(f"Bot with ID {bot_id} not found")
                await db_gen.aclose()
                return False

            # Delete the bot
            await db.delete(bot)
            await db.commit()

            # Remove the job from the scheduler
            self.scheduler_manager.remove_job(bot_id)
            logger.info(f"Bot {bot_id} deleted successfully")
            await db_gen.aclose()
            return True

        except Exception as e:
            logger.error(f"Error deleting bot {bot_id}: {str(e)}")
            return False