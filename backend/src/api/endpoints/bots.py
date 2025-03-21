from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.queries import create_bot, create_coin, update_bot_status, delete_bot, get_bot_by_id, get_coins_by_bot
from src.py_models.bot import BotCreate, BotResponse
from src.py_models.coin import CoinResponse
from src.api.dependencies import get_db_session

router = APIRouter()

@router.post("/{user_id}", response_model=BotResponse)
async def create_new_bot(user_id: int, bot: BotCreate, db: AsyncSession = Depends(get_db_session)):
    db_bot = await create_bot(db, user_id, bot.name, bot.frequency)
    # Create associated coins
    coins = []
    for coin in bot.coins:
        db_coin = await create_coin(db, db_bot.id, coin.token_address, coin.amount, coin.threshold)
        coins.append(CoinResponse.model_validate(db_coin))
    bot_response = BotResponse.model_validate(db_bot)
    bot_response.coins = coins
    return bot_response

@router.put("/{bot_id}/start", response_model=BotResponse)
async def start_bot(bot_id: int, db: AsyncSession = Depends(get_db_session)):
    bot = await update_bot_status(db, bot_id, "running")
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    bot_response = BotResponse.model_validate(bot)
    bot_response.coins = [CoinResponse.model_validate(coin) for coin in await get_coins_by_bot(db, bot_id)]
    return bot_response

@router.put("/{bot_id}/pause", response_model=BotResponse)
async def pause_bot(bot_id: int, db: AsyncSession = Depends(get_db_session)):
    bot = await update_bot_status(db, bot_id, "paused")
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    bot_response = BotResponse.model_validate(bot)
    bot_response.coins = [CoinResponse.model_validate(coin) for coin in await get_coins_by_bot(db, bot_id)]
    return bot_response

@router.delete("/{bot_id}")
async def delete_existing_bot(bot_id: int, db: AsyncSession = Depends(get_db_session)):
    bot = await get_bot_by_id(db, bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    await delete_bot(db, bot_id)
    return {"message": "Bot deleted successfully"}