import logging
from datetime import datetime, timedelta, timezone
from web3 import Web3
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.database.models.models import Bot, Coin, Trade
from src.database.connection import async_session
from src.dex.dex_integration import DexIntegration

from src.services.market_data import (
    MarketDataService,
)  # Placeholder for your actual market data fetching function
from src.database.queries import create_or_update_bot_performance

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Web3 setup (commented out as in your original)
# web3 = Web3(Web3.HTTPProvider('your_ethereum_node_url'))
# ...
WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50E4C7287F794"
LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"


async def get_current_price(token_address):
    # This function doesn't need a DB session, so leave it as is
    md_service = MarketDataService()
    price = await md_service.get_token_data(token_id=token_address)
    if price is None:
        logger.error(f"Failed to fetch price for token: {token_address}")
        return None
    return price


# async def execute_trade(token_address, amount):
#     # This function doesn't need a DB session either
#     logger.info(f"Executing trade for {amount} of token: {token_address}")
#     return "0xtransaction_hash_placeholder"


async def calculate_bot_performance(bot_id: int, db: AsyncSession) -> dict:
    """
    A more complete performance calculation for a DCA bot:
      - Summation of all trades to find the cost basis (USDT invested).
      - Summation of the current market value (in USDT).
      - Calculation of total % return and an accurate APY.
      - Proper three_month_perf and six_month_perf calculations.
    
    Note: Each trade's `amount` now represents the USDT allocated to buy a token.
          For example, if a coin costs $1, then an amount of $20 will buy 20 coins.
          The actual coin quantity purchased is calculated as:
              coin_qty = amount / trade_price
    """
    # Retrieve trades for the given bot
    result = await db.execute(select(Trade).where(Trade.bot_id == bot_id))
    trades = result.scalars().all()
    if not trades:
        return {
            "total_trades": 0,
            "total_volume": 0.0,
            "apy": 0.0,
            "three_month_perf": 0.0,
            "six_month_perf": 0.0,
            "total_perf": 0.0,
        }
    
    # 1) Total trades
    total_trades = len(trades)
    
    # 2) Total USDT invested is the sum of amounts (since amount is already in USDT)
    total_invested = sum(t.amount for t in trades if t.amount)
    
    # Get current timestamp for time-based calculations
    current_time = datetime.now()
    three_months_ago = current_time - timedelta(days=90)
    six_months_ago = current_time - timedelta(days=180)
    
    # For time-based invested amounts, we sum the USDT amounts that occurred
    three_month_invested = sum(t.amount for t in trades if t.amount and t.trade_time >= three_months_ago)
    six_month_invested = sum(t.amount for t in trades if t.amount and t.trade_time >= six_months_ago)
    
    # 3) Calculate current value by token address
    # Here we calculate the coin quantity purchased per token:
    #       coin_qty = (USDT allocated) / (trade_price)
    md_service = MarketDataService()
    token_amounts = {}
    
    # Group and accumulate coin quantities by token address
    for trade in trades:
        token_address = trade.token_address
        # Ensure we have a valid price and amount to avoid division errors.
        if token_address and trade.trade_price and trade.amount:
            coin_qty = trade.amount / trade.trade_price
            token_amounts[token_address] = token_amounts.get(token_address, 0) + coin_qty
    
    current_value = 0.0
    current_prices = {}
    
    # Retrieve current prices for each token and compute overall portfolio value
    for token_address, coin_qty in token_amounts.items():
        try:
            token_data = await md_service.get_token_data(token_id=token_address)
            if token_data and "current_price" in token_data:
                price = token_data["current_price"]
                current_prices[token_address] = price
                current_value += coin_qty * price
        except Exception as e:
            logger.error(f"Error fetching current price for {token_address}: {str(e)}")
            # Skip tokens that raise an exception
    
    # If no prices were fetched, we return a safe default
    if not current_value:
        return {
            "total_trades": total_trades,
            "total_volume": round(total_invested, 2),
            "apy": 0.0,
            "three_month_perf": 0.0,
            "six_month_perf": 0.0,
            "total_perf": 0.0,
        }
    
    # 4) Calculate current value for the trades made in the last 3 and 6 months
    # Instead of using raw amounts, we convert USDT allocation to coin quantity on each trade.
    three_month_current_value = sum(
        (t.amount / t.trade_price) * current_prices[t.token_address]
        for t in trades
        if t.amount and t.trade_price and t.trade_time >= three_months_ago and t.token_address in current_prices
    )
    six_month_current_value = sum(
        (t.amount / t.trade_price) * current_prices[t.token_address]
        for t in trades
        if t.amount and t.trade_price and t.trade_time >= six_months_ago and t.token_address in current_prices
    )
    
    # 5) Calculate overall performance metrics
    profit_loss = current_value - total_invested
    total_perf = (profit_loss / total_invested) * 100 if total_invested > 0 else 0.0
    
    three_month_perf = (
        ((three_month_current_value - three_month_invested) / three_month_invested) * 100
        if three_month_invested > 0 else 0.0
    )
    six_month_perf = (
        ((six_month_current_value - six_month_invested) / six_month_invested) * 100
        if six_month_invested > 0 else 0.0
    )
    
    # 6) Calculate APY (annual percentage yield) with a weighted average time factor
    first_trade_date = min(t.trade_time for t in trades)
    days_active = max(1, (current_time - first_trade_date).days)
    
    # Use weighted average of the invested USDT amounts over the active days
    if total_invested > 0:
        weighted_days = sum(
            (current_time - t.trade_time).days * t.amount for t in trades if t.amount
        ) / total_invested
        weighted_days = max(1, weighted_days)  # avoid division by zero
        ratio = current_value / total_invested
        apy = ((ratio ** (365.0 / weighted_days)) - 1.0) * 100.0
    else:
        apy = 0.0
    
    # 7) Return the summarized performance metrics
    return {
        "total_trades": total_trades,
        "total_volume": round(total_invested, 2),
        "apy": round(apy, 2),
        "three_month_perf": round(three_month_perf, 2),
        "six_month_perf": round(six_month_perf, 2),
        "total_perf": round(total_perf, 2),
    }


async def check_bot(bot_id: int):
    """Check bot conditions and execute trades using SQLAlchemy ORM"""
    async with async_session() as db:
        try:
            # Get the bot
            result = await db.execute(
                select(Bot).where(Bot.id == bot_id, Bot.status == "running")
            )
            bot = result.scalars().first()

            if not bot:
                logger.info(f"Bot {bot_id} not found or not running")
                return

            # Get all coins for this bot
            result = await db.execute(select(Coin).where(Coin.bot_id == bot_id))
            coins = result.scalars().all()
            
            dex = DexIntegration() 
            
            for coin in coins:
                try:
                    # Get current price and check against threshold
                    price_data = await dex.get_current_price("0x779877A7B0D9E8603169DdbD7836e478b4624789")
                    if not price_data:
                        logger.warning(f"No price data for {coin.token_address}, skipping")
                        continue

                    price_drop = price_data.get("price_drop_pct")
                    if price_drop is None:
                        logger.warning(
                            f"No price drop data for {coin.token_address}, skipping"
                        )
                        continue

                    logger.info(
                        f"Token {coin.token_address}: drop {price_drop}%, threshold {coin.threshold}%"
                    )

                    if True:
                        # Execute the trade
                        tx_hash = dex.execute_trade(
                            sell_token=WETH_ADDRESS,        # You have Sepolia ETH (WETH)
                            buy_token=LINK_ADDRESS,         # You want to buy USDC
                            amount=str(int(coin.amount * 1e18))  # Amount in wei (for 1 WETH, use 1e18)
                        )

                        # Record the trade
                        trade = Trade(
                            bot_id=bot_id,
                            coin_id=coin.id,
                            trade_time=datetime.now(timezone.utc).replace(tzinfo=None),
                            token_address=coin.token_address,
                            amount=coin.amount,
                            trade_price=price_data["current_price"],
                            transaction_hash=tx_hash,  # Fixed spelling here
                        )
                        db.add(trade)
                        logger.info(f"Trade executed for bot {bot_id}, coin {coin.id}")

                except Exception as e:
                    logger.error(f"Error processing coin {coin.id}: {str(e)}")
            
            # Update next execution time for bot
            next_time = (datetime.now() + parse_frequency(bot.frequency)).replace(tzinfo=None)
            bot.next_execution_time = next_time
            
            # Commit once after processing all coins
            await db.commit()

            # Calculate performance after trades
            performance = await calculate_bot_performance(bot_id, db)
            logger.info(f"Bot {bot_id} performance: {performance}")

            await create_or_update_bot_performance(db, bot_id, performance)

        except Exception as e:
            logger.error(f"Error checking bot {bot_id}: {str(e)}")
            await db.rollback()  # Rollback on error


def parse_frequency(frequency_str):
    """Parse frequency string into timedelta"""
    try:
        # If frequency is stored as an integer (minutes)
        if isinstance(frequency_str, int):
            return timedelta(minutes=frequency_str)

        # If frequency is stored as a string like "5 minute"
        num, unit = frequency_str.split()
        num = int(num)
        if unit.lower() in ("second", "seconds"):
            return timedelta(seconds=num)
        elif unit.lower() in ("minute", "minutes"):
            return timedelta(minutes=num)
        elif unit.lower() in ("hour", "hours"):
            return timedelta(hours=num)
        elif unit.lower() in ("day", "days"):
            return timedelta(days=num)
        elif unit.lower() in ("week", "weeks"):
            return timedelta(weeks=num)
        elif unit.lower() in ("month", "months"):
            return timedelta(days=num * 30)
        else:
            raise ValueError(f"Invalid frequency unit: {unit}")
    except Exception as e:
        logger.error(f"Error parsing frequency '{frequency_str}': {str(e)}")
        # Default to 1 day if parsing fails
        return timedelta(days=1)
