from datetime import datetime, timedelta, timezone
from typing import Optional, Callable, Any
from sqlalchemy.future import select
from src.database.models.models import Bot, BotPerformance
from src.services.manager import BotManager
import logging
from src.database.connection import async_session
from src.database.connection import (
    get_db,
)  # <- note we're importing the function, not calling it
from sqlalchemy import delete


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
            # All bots now check every 1 minute regardless of frequency setting
            # bot.frequency is used at the logic level to determine when to evaluate conditions
            # The bot checks every minute, but only evaluates conditions if enough time has passed since last trade
            # Start checking immediately (or very soon)
            next_run_time = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(
                seconds=5
            )

            # Schedule the job to run every 1 minute
            # Bot checks every minute, but condition evaluation is controlled by time windows
            # based on bot.frequency from the bot's start time
            self.scheduler_manager.schedule_job(
                bot_id, next_run_time, check_bot, [bot_id], "1 minute"
            )
            
            # Set start_time when bot is first started (only if not already set)
            if not bot.start_time:
                bot.start_time = datetime.now(timezone.utc).replace(tzinfo=None)
            
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
            bot.status = "paused"

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
            bot.status = "running"

            await db.commit()

            # Resume the job in the scheduler
            self.scheduler_manager.resume_job(bot_id)
            logger.info(f"Bot {bot_id} resumed successfully")
            await db_gen.aclose()
            return True

        except Exception as e:
            logger.error(f"Error resuming bot {bot_id}: {str(e)}")
            return False

    async def schedule_resume_at_time(self, bot_id: int, resume_time: datetime):
        """
        Schedule a one-time resume job at a specific time.
        Used to resume bot at the start of the next time window.
        """
        try:
            # Create a wrapper function to resume the bot
            async def resume_wrapper():
                await self.resume_bot_job(bot_id)
                # Remove the one-time resume job after execution
                resume_job_id = f"resume_bot_{bot_id}"
                try:
                    job = self.scheduler_manager.scheduler.get_job(resume_job_id)
                    if job:
                        self.scheduler_manager.scheduler.remove_job(resume_job_id)
                        logger.info(f"Removed one-time resume job {resume_job_id} after execution")
                except Exception as e:
                    logger.error(f"Error removing resume job {resume_job_id}: {str(e)}")
            
            # Schedule the one-time resume job
            resume_job_id = f"resume_bot_{bot_id}"
            self.scheduler_manager.schedule_one_time_job(
                resume_job_id,
                resume_time,
                resume_wrapper,
                []
            )
            
            logger.info(f"Scheduled bot {bot_id} to resume at {resume_time}")
            return resume_time
            
        except Exception as e:
            logger.error(f"Error scheduling resume for bot {bot_id}: {str(e)}")
            return None

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
            await db.execute(
                delete(BotPerformance).where(BotPerformance.bot_id == bot_id)
            )
            await db.commit()

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
