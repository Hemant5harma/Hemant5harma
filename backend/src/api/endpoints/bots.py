from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.queries import (
    create_bot,
    create_coin,
    update_bot_status,
    delete_bot,
    get_bot_by_id,
    get_coins_by_bot,
    get_all_bot,
    get_bot_performance
)
from src.py_models.bot import BotCreate, BotResponse
from src.py_models.coin import CoinResponse
from src.api.dependencies import get_db_session
from src.services.manager import BotManager
from src.services.DCABot import JobManager
from src.api.auth_utils import get_current_user
from src.database.models.models import User
from src.services.logic import check_bot, calculate_bot_performance
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/create", response_model=BotResponse)
async def create_and_start_bot(
    bot: BotCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new bot for the current user and immediately starts it.
    """
    # 1) Create bot in the DB
    db_bot = await create_bot(db, current_user.id, bot.name, bot.frequency)
    
    # 2) Create corresponding coins
    coins = []
    for coin in bot.coins:
        db_coin = await create_coin(db, db_bot.id, coin.token_address, coin.amount, coin.threshold)
        coins.append(CoinResponse.model_validate(db_coin))
    
    # 3) Update bot data structure
    bot_data = {
        "id": db_bot.id,
        "user_id": db_bot.user_id,
        "name": db_bot.name,
        "frequency": db_bot.frequency,
        "status": db_bot.status,
        "next_execution_time": db_bot.next_execution_time,
        "coins": coins
    }
    bot_response = BotResponse.model_validate(bot_data)
    
    # 4) Start the bot by changing status to "running" and scheduling it
    started_bot = await update_bot_status(db, db_bot.id, "running")
    if not started_bot:
        # If for some reason the update fails, raise an exception
        raise HTTPException(status_code=404, detail="Bot update failed")

    # 5) Launch the job manager
    job_manager = JobManager(scheduler_manager=BotManager())
    await job_manager.start_bot_job(db_bot.id, check_bot)
    
    # Refresh bot data after starting
    updated_bot = await get_bot_by_id(db, db_bot.id)
    coins = [CoinResponse.model_validate(coin) for coin in await get_coins_by_bot(db, db_bot.id)]
    
    # 6) Return the final bot response (including updated status, next_execution_time, etc.)
    final_data = {
        "id": updated_bot.id,
        "user_id": updated_bot.user_id,
        "name": updated_bot.name,
        "frequency": updated_bot.frequency,
        "status": updated_bot.status,
        "next_execution_time": updated_bot.next_execution_time,
        "coins": coins
    }
    return BotResponse.model_validate(final_data)

@router.put("/{bot_id}/start", response_model=BotResponse)
async def start_bot(
    bot_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    # Check if bot exists and belongs to the current user
    bot = await get_bot_by_id(db, bot_id)
    if not bot or bot.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bot not found or not yours")

    bot = await update_bot_status(db, bot_id, "running")
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not update")

    coins = [CoinResponse.model_validate(coin) for coin in await get_coins_by_bot(db, bot_id)]
    bot_data = {
        "id": bot.id,
        "user_id": bot.user_id,
        "name": bot.name,
        "frequency": bot.frequency,
        "status": bot.status,
        "next_execution_time": bot.next_execution_time,
        "coins": coins
    }
    bot_response = BotResponse.model_validate(bot_data)

    # Create an instance of JobManager and pass in your BotManager
    job_manager = JobManager(scheduler_manager=BotManager())

    # Pass the function check_bot itself, not its return value
    await job_manager.start_bot_job(bot_id, check_bot)

    return bot_response

@router.put("/{bot_id}/pause", response_model=BotResponse)
async def pause_bot(
    bot_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    # Verify bot ownership
    bot = await get_bot_by_id(db, bot_id)
    if not bot or bot.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bot not found or not yours")

    # bot = await update_bot_status(db, bot_id, "paused")
    # if not bot:
    #     raise HTTPException(status_code=404, detail="Bot not found")

    job_manager = JobManager(scheduler_manager=BotManager())

    # Pass the function check_bot itself, not its return value
    await job_manager.pause_bot_job(bot_id)

    coins = [CoinResponse.model_validate(coin) for coin in await get_coins_by_bot(db, bot_id)]
    bot_data = {
        "id": bot.id,
        "user_id": bot.user_id,
        "name": bot.name,
        "frequency": bot.frequency,
        "status": bot.status,
        "next_execution_time": bot.next_execution_time,
        "coins": coins
    }
    return BotResponse.model_validate(bot_data)

@router.put("/{bot_id}/resume", response_model=BotResponse)
async def resume_bot(
    bot_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Resumes a paused bot, updates its status to 'running', 
    and resumes its scheduled job.
    """
    # 1) Verify the bot exists and belongs to the current user
    bot = await get_bot_by_id(db, bot_id)
    if not bot or bot.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bot not found or not yours")

    # 2) Update bot’s status to 'running'
    resumed_bot = await update_bot_status(db, bot_id, "running")
    if not resumed_bot:
        raise HTTPException(status_code=404, detail="Failed to resume bot")

    # 3) Resume the bot job on the scheduler
    job_manager = JobManager(scheduler_manager=BotManager())
    await job_manager.resume_bot_job(bot_id)

    # 4) Return updated bot info
    coins = [CoinResponse.model_validate(coin) for coin in await get_coins_by_bot(db, bot_id)]
    bot_data = {
        "id": resumed_bot.id,
        "user_id": resumed_bot.user_id,
        "name": resumed_bot.name,
        "frequency": resumed_bot.frequency,
        "status": resumed_bot.status,
        "next_execution_time": resumed_bot.next_execution_time,
        "coins": coins
    }
    return BotResponse.model_validate(bot_data)

@router.delete("/{bot_id}")
async def delete_existing_bot(
    bot_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    # Verify bot ownership
    bot = await get_bot_by_id(db, bot_id)
    if not bot or bot.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bot not found or not yours")

    job_manager = JobManager(scheduler_manager=BotManager())

    await job_manager.exit_bot_job(bot_id)
    return {"message": "Bot deleted successfully"}

@router.get("/get", response_model=List[BotResponse])
async def get_all_bots(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all bots belonging to the currently authenticated user,
    including performance metrics for each bot.
    """
    all_bots = await get_all_bot(db)
    user_bots = [bot for bot in all_bots if bot.user_id == current_user.id]

    bots_response = []
    for bot in user_bots:
        coins = [CoinResponse.model_validate(coin) for coin in await get_coins_by_bot(db, bot.id)]
        performance = await calculate_bot_performance(bot.id, db)  # Get performance

        bot_data = {
            "id": bot.id,
            "user_id": bot.user_id,
            "name": bot.name,
            "frequency": bot.frequency,
            "status": bot.status,
            "next_execution_time": bot.next_execution_time,
            "coins": coins,
            "performance": performance  # Attach performance here
        }
        bots_response.append(BotResponse.model_validate(bot_data))

    return bots_response

@router.get("/{bot_id}", response_model=BotResponse)
async def get_one_bot(
    bot_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Gets details of a single bot, including nested performance data.
    """
    bot = await get_bot_by_id(db, bot_id)
    if not bot or bot.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bot not found or not yours")

    # Retrieve performance record, e.g. from your BotPerformance table
    perf_record = await get_bot_performance(db, bot_id)
    
    # Convert DB coins to pydantic responses
    coins = [CoinResponse.model_validate(c) for c in await get_coins_by_bot(db, bot.id)]

    # Build a nested "performance" object (PerformanceResponse) if a record exists
    performance_data = None
    if perf_record:
        performance_data = {
            "total_trades": perf_record.total_trades,
            "total_volume": perf_record.total_volume,
            "apy": perf_record.apy,
            "three_month_perf": perf_record.three_month_perf,
            "six_month_perf": perf_record.six_month_perf,
            "total_perf": perf_record.total_perf,
        }

    # Return the final BotResponse, including nested performance
    return BotResponse.model_validate({
        "id": bot.id,
        "user_id": bot.user_id,
        "name": bot.name,
        "frequency": bot.frequency,
        "status": bot.status,
        "next_execution_time": bot.next_execution_time,
        "coins": coins,
        "performance": performance_data,  # Matches BotResponse.performance
    })



