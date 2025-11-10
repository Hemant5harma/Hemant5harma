from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.queries import (
    create_bot,
    create_coin,
    update_bot_status,
    update_bot_network,
    delete_bot,
    get_bot_by_id,
    get_coins_by_bot,
    get_all_bot,
    get_bots_by_chain,
    get_bot_performance,
    get_trades_by_bot,
    get_bot_by_user_and_name
)
from src.py_models.bot import BotCreate, BotResponse, BotUpdate, BotNetworkUpdate, MultiChainBotStats
from src.py_models.coin import CoinResponse
from src.py_models.trade import TradeResponse
from src.api.dependencies import get_db_session
from src.services.manager import BotManager
from src.services.DCABot import JobManager
from src.api.auth_utils import get_current_user
from src.database.models.models import User
from src.services.logic import check_bot, calculate_bot_performance
from typing import List, Optional
import logging
from src.services.notifications import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/create", response_model=BotResponse)
async def create_and_start_bot(
    bot: BotCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new bot for the current user with multi-chain support.
    """
    # Check if bot name already exists for this user
    existing_bot = await get_bot_by_user_and_name(db, current_user.id, bot.name)
    if existing_bot:
        raise HTTPException(
            status_code=400, 
            detail=f"Bot with name '{bot.name}' already exists. Please choose a different name."
        )
    
    # 1) Create bot in the DB with network parameters
    db_bot = await create_bot(
        db, 
        current_user.id, 
        bot.name, 
        bot.frequency,
        bot.chain_id,
        bot.rpc_url,
        bot.network_name,
        bot.private_key_id
    )
    
    # 2) Create corresponding coins
    coins = []
    for coin in bot.coins:
        db_coin = await create_coin(
            db, 
            db_bot.id, 
            coin.token_address, 
            coin.amount, 
            coin.threshold,
            getattr(coin, 'condition_type', 'price_drop'),
            getattr(coin, 'condition_params', None)
        )
        coins.append(CoinResponse.model_validate(db_coin))
    
    # 3) Update bot data structure
    bot_data = {
        "id": db_bot.id,
        "user_id": db_bot.user_id,
        "name": db_bot.name,
        "frequency": db_bot.frequency,
        "status": db_bot.status,
        "chain_id": db_bot.chain_id,
        "rpc_url": db_bot.rpc_url,
        "network_name": db_bot.network_name,
        "next_execution_time": db_bot.next_execution_time,
        "coins": coins
    }
    bot_response = BotResponse.model_validate(bot_data)
    
    # 4) Start the bot by changing status to "running" and scheduling it
    started_bot = await update_bot_status(db, db_bot.id, "running")
    if not started_bot:
        raise HTTPException(status_code=404, detail="Bot update failed")

    # 5) Launch the job manager
    job_manager = JobManager(scheduler_manager=BotManager())
    await job_manager.start_bot_job(db_bot.id, check_bot)
    # Emit notification: bot started
    try:
        await NotificationService.emit(
            db,
            user_id=current_user.id,
            type="bot.started",
            title="Bot started",
            message=f"Bot '{db_bot.name}' started",
            severity="success",
            bot_id=db_bot.id,
        )
    except Exception as e:
        logger.error(f"Failed to emit bot started notification: {e}")
    
    # Refresh bot data after starting
    updated_bot = await get_bot_by_id(db, db_bot.id)
    coins = [CoinResponse.model_validate(coin) for coin in await get_coins_by_bot(db, db_bot.id)]
    
    # 6) Return the final bot response
    final_data = {
        "id": updated_bot.id,
        "user_id": updated_bot.user_id,
        "name": updated_bot.name,
        "frequency": updated_bot.frequency,
        "status": updated_bot.status,
        "chain_id": updated_bot.chain_id,
        "rpc_url": updated_bot.rpc_url,
        "network_name": updated_bot.network_name,
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
        "chain_id": bot.chain_id,
        "rpc_url": bot.rpc_url,
        "network_name": bot.network_name,
        "next_execution_time": bot.next_execution_time,
        "coins": coins
    }
    bot_response = BotResponse.model_validate(bot_data)

    # Create an instance of JobManager and pass in your BotManager
    job_manager = JobManager(scheduler_manager=BotManager())
    await job_manager.start_bot_job(bot_id, check_bot)
    # Notification: bot started
    try:
        await NotificationService.emit(
            db,
            user_id=current_user.id,
            type="bot.started",
            title="Bot started",
            message=f"Bot '{bot.name}' started",
            severity="success",
            bot_id=bot_id,
        )
    except Exception as e:
        logger.error(f"Failed to emit bot started notification: {e}")
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

    job_manager = JobManager(scheduler_manager=BotManager())
    await job_manager.pause_bot_job(bot_id)
    # Update DB status to paused for consistency
    await update_bot_status(db, bot_id, "paused")
    # Notification: bot paused
    try:
        await NotificationService.emit(
            db,
            user_id=current_user.id,
            type="bot.paused",
            title="Bot paused",
            message=f"Bot '{bot.name}' paused",
            severity="info",
            bot_id=bot_id,
        )
    except Exception as e:
        logger.error(f"Failed to emit bot paused notification: {e}")

    coins = [CoinResponse.model_validate(coin) for coin in await get_coins_by_bot(db, bot_id)]
    bot_data = {
        "id": bot.id,
        "user_id": bot.user_id,
        "name": bot.name,
        "frequency": bot.frequency,
        "status": bot.status,
        "chain_id": bot.chain_id,
        "rpc_url": bot.rpc_url,
        "network_name": bot.network_name,
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

    # 2) Update bot's status to 'running'
    resumed_bot = await update_bot_status(db, bot_id, "running")
    if not resumed_bot:
        raise HTTPException(status_code=404, detail="Failed to resume bot")

    # 3) Resume the bot job on the scheduler
    job_manager = JobManager(scheduler_manager=BotManager())
    await job_manager.resume_bot_job(bot_id)
    # Notification: bot resumed
    try:
        await NotificationService.emit(
            db,
            user_id=current_user.id,
            type="bot.resumed",
            title="Bot resumed",
            message=f"Bot '{resumed_bot.name}' resumed",
            severity="success",
            bot_id=bot_id,
        )
    except Exception as e:
        logger.error(f"Failed to emit bot resumed notification: {e}")

    # 4) Return updated bot info
    coins = [CoinResponse.model_validate(coin) for coin in await get_coins_by_bot(db, bot_id)]
    bot_data = {
        "id": resumed_bot.id,
        "user_id": resumed_bot.user_id,
        "name": resumed_bot.name,
        "frequency": resumed_bot.frequency,
        "status": resumed_bot.status,
        "chain_id": resumed_bot.chain_id,
        "rpc_url": resumed_bot.rpc_url,
        "network_name": resumed_bot.network_name,
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

    # Emit notification BEFORE deleting the bot to avoid foreign key constraint issues
    try:
        await NotificationService.emit(
            db,
            user_id=current_user.id,
            type="bot.deleted",
            title="Bot deleted",
            message=f"Bot '{bot.name}' deleted",
            severity="warning",
            bot_id=None,  # Don't reference the bot_id since it will be deleted
            extra_data={"deleted_bot_id": bot_id, "bot_name": bot.name},
        )
    except Exception as e:
        # Log but don't fail the deletion
        logger.error(f"Failed to emit bot deletion notification: {e}")

    job_manager = JobManager(scheduler_manager=BotManager())
    await job_manager.exit_bot_job(bot_id)
    await delete_bot(db, bot_id)
    return {"message": "Bot deleted successfully"}

@router.get("/get", response_model=List[BotResponse])
async def get_all_bots(
    chain_id: Optional[int] = Query(None, description="Filter bots by chain ID"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all bots belonging to the currently authenticated user,
    with optional chain filtering and including performance metrics.
    """
    if chain_id:
        all_bots = await get_bots_by_chain(db, chain_id)
        user_bots = [bot for bot in all_bots if bot.user_id == current_user.id]
    else:
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
            "chain_id": bot.chain_id,
            "rpc_url": bot.rpc_url,
            "network_name": bot.network_name,
            "next_execution_time": bot.next_execution_time,
            "coins": coins,
            "performance": performance
        }
        bots_response.append(BotResponse.model_validate(bot_data))

    return bots_response

@router.get("/stats/multichain", response_model=MultiChainBotStats)
async def get_multichain_bot_stats(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics about bots across different chains for the current user.
    """
    all_bots = await get_all_bot(db)
    user_bots = [bot for bot in all_bots if bot.user_id == current_user.id]
    
    total_bots = len(user_bots)
    active_bots = len([bot for bot in user_bots if bot.status == "running"])
    
    # Count bots by chain
    bots_by_chain = {}
    for bot in user_bots:
        chain_id = bot.chain_id or 1  # Default to 1 if None
        bots_by_chain[chain_id] = bots_by_chain.get(chain_id, 0) + 1
    
    # Calculate total volume and trades (you might need to implement this)
    total_volume = 0.0
    total_trades = 0
    
    return MultiChainBotStats(
        total_bots=total_bots,
        active_bots=active_bots,
        bots_by_chain=bots_by_chain,
        total_volume=total_volume,
        total_trades=total_trades
    )

@router.get("/{bot_id}", response_model=BotResponse)
async def get_one_bot(
    bot_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Gets details of a single bot, including nested performance data and network info.
    Uses real-time calculation for consistent performance metrics.
    """
    bot = await get_bot_by_id(db, bot_id)
    if not bot or bot.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bot not found or not yours")

    # Use real-time performance calculation (same as bot list)
    performance_data = await calculate_bot_performance(bot.id, db)
    
    # Convert DB coins to pydantic responses
    coins = [CoinResponse.model_validate(c) for c in await get_coins_by_bot(db, bot.id)]

    # Return the final BotResponse with multi-chain support
    return BotResponse.model_validate({
        "id": bot.id,
        "user_id": bot.user_id,
        "name": bot.name,
        "frequency": bot.frequency,
        "status": bot.status,
        "chain_id": bot.chain_id,
        "rpc_url": bot.rpc_url,
        "network_name": bot.network_name,
        "next_execution_time": bot.next_execution_time,
        "coins": coins,
        "performance": performance_data,
    })

@router.put("/{bot_id}/network", response_model=BotResponse)
async def update_bot_network_config(
    bot_id: int,
    network_update: BotNetworkUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the network configuration of a bot (chain_id, rpc_url, network_name).
    """
    # Check if bot exists and belongs to the current user
    bot = await get_bot_by_id(db, bot_id)
    if not bot or bot.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bot not found or not yours")

    # Update network configuration
    updated_bot = await update_bot_network(
        db, 
        bot_id, 
        network_update.chain_id, 
        network_update.rpc_url, 
        network_update.network_name
    )
    
    if not updated_bot:
        raise HTTPException(status_code=404, detail="Failed to update bot network")

    coins = [CoinResponse.model_validate(coin) for coin in await get_coins_by_bot(db, bot_id)]
    bot_data = {
        "id": updated_bot.id,
        "user_id": updated_bot.user_id,
        "name": updated_bot.name,
        "frequency": updated_bot.frequency,
        "status": updated_bot.status,
        "chain_id": updated_bot.chain_id,
        "rpc_url": updated_bot.rpc_url,
        "network_name": updated_bot.network_name,
        "next_execution_time": updated_bot.next_execution_time,
        "coins": coins
    }
    return BotResponse.model_validate(bot_data)

@router.get("/{bot_id}/trades", response_model=List[TradeResponse])
async def get_trades_for_bot(
    bot_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves trade history for a specific bot.
    """
    # Verify bot ownership
    bot = await get_bot_by_id(db, bot_id)
    if not bot or bot.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bot not found or not yours")

    trades = await get_trades_by_bot(db, bot_id)
    trade_responses = [TradeResponse.model_validate(trade) for trade in trades]
    return trade_responses



