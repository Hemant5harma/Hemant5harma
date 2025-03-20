from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from .models.models import User, Bot, Coin, Trade
from datetime import datetime

# User Operations
async def create_user(db: AsyncSession, address: str) -> User:
    """
    Creates a new user with the given wallet address.
    """
    user = User(address=address)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def get_user_by_address(db: AsyncSession, address: str) -> User:
    """
    Retrieves a user by their wallet address.
    """
    result = await db.execute(select(User).where(User.address == address))
    return result.scalars().first()

# Bot Operations
async def create_bot(db: AsyncSession, user_id: int, name: str, frequency: str) -> Bot:
    """
    Creates a new bot for the given user.
    """
    bot = Bot(user_id=user_id, name=name, frequency=frequency, status="paused")
    db.add(bot)
    await db.commit()
    await db.refresh(bot)
    return bot

async def update_bot_status(db: AsyncSession, bot_id: int, status: str) -> Bot:
    """
    Updates the status of a bot.
    """
    result = await db.execute(select(Bot).where(Bot.id == bot_id))
    bot = result.scalars().first()
    if bot:
        bot.status = status
        await db.commit()
        await db.refresh(bot)
    return bot

async def delete_bot(db: AsyncSession, bot_id: int) -> None:
    """
    Deletes a bot by its ID.
    """
    await db.execute(delete(Bot).where(Bot.id == bot_id))
    await db.commit()

# Coin Operations
async def create_coin(db: AsyncSession, bot_id: int, token_address: str, amount: float, threshold: float) -> Coin:
    """
    Creates a new coin entry for the given bot.
    """
    coin = Coin(bot_id=bot_id, token_address=token_address, amount=amount, threshold=threshold)
    db.add(coin)
    await db.commit()
    await db.refresh(coin)
    return coin

async def get_coins_by_bot(db: AsyncSession, bot_id: int) -> list[Coin]:
    """
    Retrieves all coins associated with a bot.
    """
    result = await db.execute(select(Coin).where(Coin.bot_id == bot_id))
    return result.scalars().all()

# Trade Operations
async def create_trade(db: AsyncSession, bot_id: int, coin_id: int, trade_time: datetime, token_address: str, amount: float) -> Trade:
    """
    Records a new trade for the given bot and coin.
    """
    trade = Trade(bot_id=bot_id, coin_id=coin_id, trade_time=trade_time, token_address=token_address, amount=amount)
    db.add(trade)
    await db.commit()
    await db.refresh(trade)
    return trade

async def get_trades_by_bot(db: AsyncSession, bot_id: int) -> list[Trade]:
    """
    Retrieves all trades for a bot.
    """
    result = await db.execute(select(Trade).where(Trade.bot_id == bot_id))
    return result.scalars().all()