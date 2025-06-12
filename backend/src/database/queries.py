from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete 
from .models.models import User, Bot, Coin, Trade, BotPerformance, ManualTrade
from datetime import datetime , timezone
from typing import Optional, List

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

# Private Key Operations
async def update_user_private_key(db: AsyncSession, user_id: int, encrypted_private_key: str) -> User:
    """Update user's encrypted private key"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise ValueError("User not found")
    
    user.encrypted_private_key = encrypted_private_key
    await db.commit()
    await db.refresh(user)
    return user

async def get_user_private_key(db: AsyncSession, user_id: int) -> Optional[str]:
    """Get user's encrypted private key"""
    result = await db.execute(select(User.encrypted_private_key).where(User.id == user_id))
    encrypted_key = result.scalar_one_or_none()
    return encrypted_key

async def delete_user_private_key(db: AsyncSession, user_id: int) -> bool:
    """Delete user's private key"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        return False
    
    user.encrypted_private_key = None
    await db.commit()
    return True

# Bot Operations
async def create_bot(db: AsyncSession, user_id: int, name: str, frequency: str, chain_id: int = 1, rpc_url: str = None, network_name: str = None) -> Bot:
    """
    Creates a new bot for the given user with multi-chain support.
    """
    bot = Bot(
        user_id=user_id, 
        name=name, 
        frequency=frequency, 
        status="paused",
        chain_id=chain_id,
        rpc_url=rpc_url,
        network_name=network_name
    )
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

async def update_bot_network(db: AsyncSession, bot_id: int, chain_id: int, rpc_url: str = None, network_name: str = None) -> Bot:
    """
    Updates the network configuration of a bot.
    """
    result = await db.execute(select(Bot).where(Bot.id == bot_id))
    bot = result.scalars().first()
    if bot:
        bot.chain_id = chain_id
        bot.rpc_url = rpc_url
        bot.network_name = network_name
        await db.commit()
        await db.refresh(bot)
    return bot

async def delete_bot(db: AsyncSession, bot_id: int) -> None:
    """
    Deletes a bot by its ID.
    """
    await db.execute(delete(Bot).where(Bot.id == bot_id))
    await db.commit()

async def get_bot_by_id(db: AsyncSession, bot_id: int) -> Bot:
    """
    Retrieves a bot by its ID.
    """
    result = await db.execute(select(Bot).where(Bot.id == bot_id))
    return result.scalars().first()

async def get_all_bot(db: AsyncSession) -> Bot:
    """
    Retrieves all bots.
    """
    result = await db.execute(select(Bot))
    return result.scalars().all()

async def get_bots_by_chain(db: AsyncSession, chain_id: int) -> List[Bot]:
    """
    Retrieves all bots for a specific chain.
    """
    result = await db.execute(select(Bot).where(Bot.chain_id == chain_id))
    return result.scalars().all()

async def create_or_update_bot_performance(
    db: AsyncSession,
    bot_id: int,
    performance_data: dict
) -> BotPerformance:
    # Check if there's already a record for this bot
    result = await db.execute(
        select(BotPerformance).where(BotPerformance.bot_id == bot_id)
    )
    record = result.scalars().first()
    if not record:
        record = BotPerformance(bot_id=bot_id)
        db.add(record)
    
    record.total_trades = performance_data["total_trades"]
    record.total_volume = performance_data["total_volume"]
    record.apy = performance_data["apy"]
    record.three_month_perf = performance_data["three_month_perf"]
    record.six_month_perf = performance_data["six_month_perf"]
    record.total_perf = performance_data["total_perf"]
    record.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    
    await db.commit()
    await db.refresh(record)
    return record

async def get_bot_performance(db: AsyncSession, bot_id: int) -> Optional[BotPerformance]:
    result = await db.execute(
        select(BotPerformance).where(BotPerformance.bot_id == bot_id)
    )
    return result.scalars().first()

# Coin Operations
async def create_coin(
    db: AsyncSession, 
    bot_id: int, 
    token_address: str, 
    amount: float, 
    threshold: float,
    condition_type: str = "price_drop",
    condition_params: dict = None,
    logic_operator: str = "AND"
) -> Coin:
    """
    Creates a new coin entry for the given bot with advanced conditions.
    """
    if condition_params is None:
        condition_params = {"threshold": threshold}
    
    coin = Coin(
        bot_id=bot_id, 
        token_address=token_address, 
        amount=amount, 
        threshold=threshold,  # Keep for backward compatibility
        condition_type=condition_type,
        condition_params=condition_params,
        logic_operator=logic_operator
    )
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
async def create_trade(
    db: AsyncSession, 
    bot_id: int, 
    coin_id: int, 
    trade_time: datetime, 
    token_address: str, 
    amount: float, 
    trade_price: float = 0.0, 
    transaction_hash: str = "", 
    chain_id: int = None, 
    network_name: str = None
) -> Trade:
    """
    Records a new trade for the given bot and coin with multi-chain support.
    """
    trade = Trade(
        bot_id=bot_id, 
        coin_id=coin_id, 
        trade_time=trade_time, 
        token_address=token_address, 
        amount=amount,
        trade_price=trade_price,
        transaction_hash=transaction_hash,
        chain_id=chain_id,
        network_name=network_name
    )
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

async def get_trades_by_chain(db: AsyncSession, chain_id: int) -> List[Trade]:
    """
    Retrieves all trades for a specific chain.
    """
    result = await db.execute(select(Trade).where(Trade.chain_id == chain_id))
    return result.scalars().all()

# Manual Trade queries
async def create_manual_trade(db: AsyncSession, user_id: int, trade_data: dict) -> ManualTrade:
    """Create a new manual trade record with multi-chain support"""
    manual_trade = ManualTrade(
        user_id=user_id,
        sell_token=trade_data["sell_token"],
        buy_token=trade_data["buy_token"],
        sell_amount=trade_data["sell_amount"],
        buy_amount=trade_data["buy_amount"],
        transaction_hash=trade_data["transaction_hash"],
        gas_used=trade_data.get("gas_used"),
        gas_price=trade_data.get("gas_price"),
        status=trade_data.get("status", "pending"),
        slippage_bps=trade_data.get("slippage_bps", 100),
        chain_id=trade_data.get("chain_id", 1),
        network_name=trade_data.get("network_name")
    )
    db.add(manual_trade)
    await db.commit()
    await db.refresh(manual_trade)
    return manual_trade

async def get_manual_trades_by_user(
    db: AsyncSession, 
    user_id: int, 
    limit: int = 50, 
    offset: int = 0, 
    chain_id: Optional[int] = None
) -> List[ManualTrade]:
    """Get manual trades for a specific user with optional chain filtering"""
    query = select(ManualTrade).where(ManualTrade.user_id == user_id)
    
    if chain_id is not None:
        query = query.where(ManualTrade.chain_id == chain_id)
    
    query = query.order_by(ManualTrade.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    return result.scalars().all()

async def get_manual_trades_by_chain(db: AsyncSession, chain_id: int, limit: int = 50, offset: int = 0) -> List[ManualTrade]:
    """Get all manual trades for a specific chain"""
    result = await db.execute(
        select(ManualTrade)
        .where(ManualTrade.chain_id == chain_id)
        .order_by(ManualTrade.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()

async def get_manual_trade_by_hash(db: AsyncSession, tx_hash: str) -> Optional[ManualTrade]:
    """Get manual trade by transaction hash"""
    result = await db.execute(
        select(ManualTrade).where(ManualTrade.transaction_hash == tx_hash)
    )
    return result.scalar_one_or_none()

async def update_manual_trade_status(db: AsyncSession, tx_hash: str, status: str, gas_used: str = None) -> Optional[ManualTrade]:
    """Update manual trade status"""
    result = await db.execute(
        select(ManualTrade).where(ManualTrade.transaction_hash == tx_hash)
    )
    manual_trade = result.scalar_one_or_none()
    
    if manual_trade:
        manual_trade.status = status
        if gas_used:
            manual_trade.gas_used = gas_used
        manual_trade.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(manual_trade)
    
    return manual_trade