from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.queries import (
    create_bot,
    create_coin,
    update_bot_status,
    delete_bot,
    get_bot_by_id,
    get_coins_by_bot,
    get_all_bot
)
from src.py_models.bot import BotCreate, BotResponse
from src.py_models.coin import CoinResponse
from src.api.dependencies import get_db_session
from src.services.manager import BotManager
from src.services.DCABot import JobManager
# Import get_current_user and the User type
from src.api.auth_utils import get_current_user
from src.database.models.models import User
from src.services.logic import check_bot
from typing import List

router = APIRouter()

@router.post("/create", response_model=BotResponse)
async def create_new_bot(
    bot: BotCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    # Bot is created for the currently authenticated user
    db_bot = await create_bot(db, current_user.id, bot.name, bot.frequency)
    coins = []
    for coin in bot.coins:
        db_coin = await create_coin(db, db_bot.id, coin.token_address, coin.amount, coin.threshold)
        coins.append(CoinResponse.model_validate(db_coin))

    bot_data = {
        "id": db_bot.id,
        "user_id": db_bot.user_id,
        "name": db_bot.name,
        "frequency": db_bot.frequency,
        "status": db_bot.status,
        "next_execution_time": db_bot.next_execution_time,
        "coins": coins
    }
    return BotResponse.model_validate(bot_data)

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

    bot = await update_bot_status(db, bot_id, "paused")
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

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
    Retrieves all bots belonging to the currently authenticated user.
    """
    # If you have a dedicated query like get_bots_by_user, you can use that:
    # bots = await get_bots_by_user(db, current_user.id)
    
    # Or filter get_all_bot() results by user_id:
    all_bots = await get_all_bot(db)
    user_bots = [bot for bot in all_bots if bot.user_id == current_user.id]

    # Build a response list
    bots_response = []
    for bot in user_bots:
        coins = [CoinResponse.model_validate(coin) for coin in await get_coins_by_bot(db, bot.id)]
        bot_data = {
            "id": bot.id,
            "user_id": bot.user_id,
            "name": bot.name,
            "frequency": bot.frequency,
            "status": bot.status,
            "next_execution_time": bot.next_execution_time,
            "coins": coins
        }
        bots_response.append(BotResponse.model_validate(bot_data))

    return bots_response

