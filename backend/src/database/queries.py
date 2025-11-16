from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete 
from .models.models import User, Bot, Coin, Trade, BotPerformance, ManualTrade, Notification
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import desc

# User Operations - Email/Password Authentication
async def create_user_with_email(db: AsyncSession, email: str, password_hash: str, name: str) -> User:
    """
    Creates a new user with email and password.
    """
    user = User(email=email, password_hash=password_hash, name=name, email_verified=0)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def get_user_by_email(db: AsyncSession, email: str) -> User:
    """
    Retrieves a user by their email address.
    """
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def get_user_by_id(db: AsyncSession, user_id: int) -> User:
    """
    Retrieves a user by their ID.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()

# User Operations - Wallet Authentication (for future use)
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

# Separate ETH and Solana Private Key Operations
async def update_user_private_key_by_type(db: AsyncSession, user_id: int, encrypted_private_key: str, key_type: str) -> User:
    """Update user's encrypted private key for specific blockchain"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise ValueError("User not found")
    
    if key_type == 'eth':
        user.encrypted_eth_private_key = encrypted_private_key
    elif key_type == 'solana':
        user.encrypted_solana_private_key = encrypted_private_key
    else:
        raise ValueError(f"Invalid key type: {key_type}")
    
    await db.commit()
    await db.refresh(user)
    return user

async def get_user_private_key_by_type(db: AsyncSession, user_id: int, key_type: str) -> Optional[str]:
    """
    Get user's encrypted private key for specific blockchain.
    First checks the new private_keys table, then falls back to old users table for backward compatibility.
    """
    from src.database.models.models import PrivateKey
    
    # Map old key types to new ones
    key_type_mapping = {
        'eth': 'evm',  # Old 'eth' maps to new 'evm'
        'evm': 'evm',
        'solana': 'solana'
    }
    
    mapped_key_type = key_type_mapping.get(key_type.lower())
    if not mapped_key_type:
        raise ValueError(f"Invalid key type: {key_type}")
    
    # First, try the new private_keys table (preferred method)
    # Try to get default key first
    query = select(PrivateKey.encrypted_private_key).where(
        PrivateKey.user_id == user_id,
        PrivateKey.key_type == mapped_key_type,
        PrivateKey.is_default == 1
    ).order_by(PrivateKey.created_at.asc())
    
    result = await db.execute(query)
    encrypted_key = result.scalar_one_or_none()
    
    # If default key found, return it
    if encrypted_key:
        return encrypted_key
    
    # If no default key, get the first available key (for backward compatibility)
    query = select(PrivateKey.encrypted_private_key).where(
        PrivateKey.user_id == user_id,
        PrivateKey.key_type == mapped_key_type
    ).order_by(PrivateKey.created_at.asc())
    
    result = await db.execute(query)
    encrypted_key = result.scalar_one_or_none()
    
    # If found in new table, return it
    if encrypted_key:
        return encrypted_key
    
    # Fallback to old users table for backward compatibility
    if key_type.lower() == 'eth':
        result = await db.execute(select(User.encrypted_eth_private_key).where(User.id == user_id))
    elif key_type.lower() == 'solana':
        result = await db.execute(select(User.encrypted_solana_private_key).where(User.id == user_id))
    else:
        return None
    
    encrypted_key = result.scalar_one_or_none()
    return encrypted_key

async def get_user_private_key_status(db: AsyncSession, user_id: int) -> dict:
    """Get status of both ETH and Solana private keys"""
    result = await db.execute(
        select(User.encrypted_eth_private_key, User.encrypted_solana_private_key)
        .where(User.id == user_id)
    )
    eth_key, solana_key = result.first() or (None, None)
    
    return {
        'eth_key': eth_key is not None,
        'solana_key': solana_key is not None
    }

async def delete_user_private_key_by_type(db: AsyncSession, user_id: int, key_type: str) -> bool:
    """Delete user's private key for specific blockchain"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        return False
    
    if key_type == 'eth':
        user.encrypted_eth_private_key = None
    elif key_type == 'solana':
        user.encrypted_solana_private_key = None
    else:
        raise ValueError(f"Invalid key type: {key_type}")
    
    await db.commit()
    return True

# Bot Operations
async def get_bot_by_user_and_name(db: AsyncSession, user_id: int, name: str) -> Optional[Bot]:
    """
    Check if a bot with the given name already exists for the user.
    """
    result = await db.execute(select(Bot).where(Bot.user_id == user_id, Bot.name == name))
    return result.scalars().first()

async def create_bot(db: AsyncSession, user_id: int, name: str, frequency: str, chain_id: int = 1, rpc_url: str = None, network_name: str = None, private_key_id: int = None) -> Bot:
    """
    Creates a new bot for the given user with multi-chain support.
    """
    bot = Bot(
        user_id=user_id,
        private_key_id=private_key_id,
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
    Retrieves a bot by its ID with private key information.
    """
    from sqlalchemy.orm import joinedload
    result = await db.execute(
        select(Bot).where(Bot.id == bot_id).options(joinedload(Bot.private_key))
    )
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

async def get_bot_network_info(db: AsyncSession, bot_id: int) -> Optional[dict]:
    """
    Retrieves bot's network configuration for market data requests.
    """
    result = await db.execute(
        select(Bot.chain_id, Bot.network_name, Bot.rpc_url).where(Bot.id == bot_id)
    )
    bot_network = result.first()
    
    if bot_network:
        return {
            "chain_id": bot_network.chain_id,
            "network_name": bot_network.network_name,
            "rpc_url": bot_network.rpc_url
        }
    return None

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
    condition_params: dict = None
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
        condition_params=condition_params
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
        manual_trade.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        await db.refresh(manual_trade)
    
    return manual_trade

# Notification Operations
async def create_notification(
    db: AsyncSession,
    *,
    user_id: int,
    type: str,
    title: str,
    message: str,
    severity: str = "info",
    bot_id: Optional[int] = None,
    trade_id: Optional[int] = None,
    extra_data: Optional[dict] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        severity=severity,
        status="unread",
        bot_id=bot_id,
        trade_id=trade_id,
        extra_data=extra_data or {}
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification

async def list_notifications(
    db: AsyncSession,
    user_id: int,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Notification]:
    query = select(Notification).where(Notification.user_id == user_id)
    if status:
        query = query.where(Notification.status == status)
    query = query.order_by(desc(Notification.created_at)).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()

async def mark_notification_read(db: AsyncSession, user_id: int, notification_id: int) -> bool:
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
    )
    n = result.scalar_one_or_none()
    if not n:
        return False
    n.status = "read"
    n.read_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.commit()
    return True

async def mark_all_notifications_read(db: AsyncSession, user_id: int) -> int:
    result = await db.execute(select(Notification).where(Notification.user_id == user_id, Notification.status == "unread"))
    notifications = result.scalars().all()
    count = 0
    for n in notifications:
        n.status = "read"
        n.read_at = datetime.now(timezone.utc).replace(tzinfo=None)
        count += 1
    if count:
        await db.commit()
    return count

async def get_unread_count(db: AsyncSession, user_id: int) -> int:
    result = await db.execute(
        select(Notification).where(Notification.user_id == user_id, Notification.status == "unread")
    )
    return len(result.scalars().all())