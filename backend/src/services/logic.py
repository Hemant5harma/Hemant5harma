import logging
from datetime import datetime, timedelta, timezone
from web3 import Web3
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.database.models.models import Bot, Coin, Trade
from src.database.connection import async_session
from src.services.market_data import MarketDataService  # Placeholder for your actual market data fetching function

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Web3 setup (commented out as in your original)
# web3 = Web3(Web3.HTTPProvider('your_ethereum_node_url'))
# ...

async def get_current_price(token_address):
    # This is a placeholder for your actual implementation
    # When you uncomment the Web3 code, you can implement the actual price fetching
     # Placeholder for your actual market data fetching function
    md_service = MarketDataService()
    price = await md_service.get_token_data(token_id=token_address)
    if price is None:
        logger.error(f"Failed to fetch price for token: {token_address}")
        return None
    return price  # Placeholder value

async def execute_trade(token_address, amount):
    # This is a placeholder for your actual implementation
    # When you uncomment the Web3 code, you can implement the actual trading
    logger.info(f"Executing trade for {amount} of token: {token_address}")
    return "0xtransaction_hash_placeholder"  # Placeholder value

async def check_bot(bot_id: int):
    """Check bot conditions and execute trades using SQLAlchemy ORM"""
    try:
        async with async_session() as session:
            # Get the bot
            result = await session.execute(
                select(Bot).where(Bot.id == bot_id, Bot.status == 'running')
            )
            bot = result.scalars().first()
            
            if not bot:
                logger.info(f"Bot {bot_id} not found or not running")
                return
            
            # Get all coins for this bot
            result = await session.execute(
                select(Coin).where(Coin.bot_id == bot_id)
            )
            coins = result.scalars().all()
            
            for coin in coins:
                try:
                    # Get current price and check against threshold
                    current_threshold = await get_current_price(coin.token_address)
                    current_threshold = current_threshold['price_drop_pct'] if current_threshold else print ("Failed to fetch price")
                    # Compare price to threshold logic
                    # Note: You might need to adjust this logic based on your threshold definition
                    if current_threshold < -coin.threshold:
                        # Execute the trade
                        tx_hash = await execute_trade(coin.token_address, coin.amount)
                        
                        # Record the trade
                        trade = Trade(
                            bot_id=bot_id,
                            coin_id=coin.id,
                            trade_time=datetime.utcnow(),
                            token_address=coin.token_address,
                            amount=coin.amount,
                            transaction_hash=tx_hash
                        )
                        session.add(trade)
                        logger.info(f"Trade executed for bot {bot_id}, coin {coin.id}")
                
                except Exception as e:
                    logger.error(f"Error processing coin {coin.id}: {str(e)}")
            
            # Update next execution time
            next_time = datetime.now(timezone.utc) + parse_frequency(bot.frequency)
            bot.next_execution_time = next_time
            
            # Commit all changes
            await session.commit()
            logger.info(f"Bot {bot_id} check completed, next run at {next_time}")
            
    except Exception as e:
        logger.error(f"Error checking bot {bot_id}: {str(e)}")

def parse_frequency(frequency_str):
    """Parse frequency string into timedelta"""
    try:
        # If frequency is stored as an integer (minutes)
        if isinstance(frequency_str, int):
            return timedelta(minutes=frequency_str)
        
        # If frequency is stored as a string like "5 minute"
        num, unit = frequency_str.split()
        num = int(num)
        if unit.lower() in ('second', 'seconds'):
            return timedelta(seconds=num)
        elif unit.lower() in ('minute', 'minutes'):
            return timedelta(minutes=num)
        elif unit.lower() in ('hour', 'hours'):
            return timedelta(hours=num)
        elif unit.lower() in ('day', 'days'):
            return timedelta(days=num)
        elif unit.lower() in ('week', 'weeks'):
            return timedelta(weeks=num)
        elif unit.lower() in ('month', 'months'):
            return timedelta(days=num * 30)
        else:
            raise ValueError(f"Invalid frequency unit: {unit}")
    except Exception as e:
        logger.error(f"Error parsing frequency '{frequency_str}': {str(e)}")
        # Default to 1 day if parsing fails
        return timedelta(days=1)