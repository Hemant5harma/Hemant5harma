from apscheduler.schedulers.asyncio import AsyncIOScheduler 
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from datetime import datetime
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db_url = os.getenv("DATABASE_URL")


def parse_interval(frequency_str: str):
    """
    Parse a frequency like "5 minutes", "1 hour", "1 day", "1 month" 
    and return a dict of args to pass to the interval trigger.
    
    Example returns:
      "5 minutes" -> {"minutes": 5}
      "1 hour"    -> {"hours": 1}
      "1 day"     -> {"days": 1}
      "1 month"   -> {"days": 30}  # approximate monthly
    """
    parts = frequency_str.strip().split()
    if len(parts) != 2:
        raise ValueError(f"Invalid frequency string: {frequency_str}")

    value_str, unit_str = parts
    value = int(value_str)

    # Map user’s words to APScheduler interval arguments
    unit_str = unit_str.lower()
    if unit_str in ("minute", "minutes"):
        return {"minutes": value}
    elif unit_str in ("hour", "hours"):
        return {"hours": value}
    elif unit_str in ("day", "days"):
        return {"days": value}
    elif unit_str in ("month", "months"):
        # APScheduler doesn't have months in interval triggers, so we'll approximate 30 days:
        return {"days": value * 30}
    else:
        raise ValueError(f"Unsupported unit: {unit_str}")


class BotManager:
    def __init__(self):
        self.scheduler = AsyncIOScheduler(
            job_defaults={
            'misfire_grace_time': 5  # Allow jobs to be 30 seconds late
          })
        self.scheduler.add_jobstore('sqlalchemy', url=db_url)
        self.scheduler.start()
        logger.info("Scheduler started")

    def schedule_job(self, bot_id, next_run_time, func, args, frequency: str):
        """
        Schedule an interval job. 
        frequency = "5 minutes" or "1 hour", etc.
        """
        job_id = f"bot_{bot_id}"

        # Use parse_interval to figure out if it's minutes=5, hours=1, etc.
        interval_args = parse_interval(frequency)

        # Start date is next_run_time; interval is whatever parse_interval returns
        self.scheduler.add_job(
            func,
            'interval',
            start_date=next_run_time,  # initial run
            args=args,
            id=job_id,
            replace_existing=True,
            **interval_args  # e.g. minutes=5 or hours=1
        )

        logger.info(
            f"Scheduled job for bot {bot_id} to run every {frequency}, starting at {next_run_time}"
        )

    def pause_job(self, bot_id):
        job_id = f"bot_{bot_id}"
        if self.scheduler.get_job(job_id):
            self.scheduler.pause_job(job_id)
            logger.info(f"Paused job for bot {bot_id}")

    def resume_job(self, bot_id):
        job_id = f"bot_{bot_id}"
        if self.scheduler.get_job(job_id):
            self.scheduler.resume_job(job_id)
            logger.info(f"Resumed job for bot {bot_id}")

    def remove_job(self, bot_id):
        job_id = f"bot_{bot_id}"
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
            logger.info(f"Removed job for bot {bot_id}")

    def list_jobs(self):
        """Return all scheduled jobs."""
        return self.scheduler.get_jobs()

    def shutdown(self):
        self.scheduler.shutdown()
        logger.info("Scheduler shut down")