import logging
from datetime import datetime, timedelta, timezone
from web3 import Web3
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from src.database.models.models import Bot, Coin, Trade
from src.database.connection import async_session
from src.dex.dex_integration import DexIntegration

from src.database.queries import create_or_update_bot_performance

# Import the price fetching function from dca.py
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from dca import get_current_price_gecko

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# async def get_current_price(token_address):
#     # This function doesn't need a DB session, so leave it as is
#     md_service = MarketDataService()
#     price = await md_service.get_token_data(token_id=token_address)
#     if price is None:
#         logger.error(f"Failed to fetch price for token: {token_address}")
#         return None
#     return price


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
    token_amounts = {}
    
    # Get chain_id from trades (use first trade's chain_id, or default to 10143)
    chain_id = trades[0].chain_id if trades and trades[0].chain_id else 10143
    
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
            # Use the same price fetching function that works in the trading logic
            price_data = get_current_price_gecko(token_address, chain_id)
            if price_data and "usdPrice" in price_data:
                price = price_data["usdPrice"]
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
            # Get the bot with user information
            result = await db.execute(
                select(Bot).where(Bot.id == bot_id, Bot.status == "running").options(joinedload(Bot.coins), joinedload(Bot.user))
            )
            bot = result.scalars().first()

            if not bot:
                logger.info(f"Bot {bot_id} not found or not running")
                return

            chain_id = bot.chain_id  
            # Create DexIntegration with user context for private key
            dex = await DexIntegration.create(
                chain_id=chain_id, 
                user_id=bot.user_id, 
                db=db, 
                rpc_url=bot.rpc_url
            )
            
            # Get all coins for this bot
            coins = bot.coins
            
            for coin in coins:
                try:
                    # Get current price and check against threshold using GeckoTerminal API
                    price_data = get_current_price_gecko(coin.token_address, chain_id)
                    if not price_data:
                        logger.warning(f"No price data for {coin.token_address}, skipping")
                        continue

                    current_price = price_data.get("usdPrice")
                    change_24h = price_data.get("24hChange")
                    
                    if change_24h is None:
                        logger.warning(
                            f"No 24h change data for {coin.token_address}, skipping"
                        )
                        continue

                    logger.info(
                        f"Token {coin.token_address}: current price ${current_price}, 24h change {change_24h}%, threshold {coin.threshold}%"
                    )

                    # Execute trade based on the evaluated condition
                    condition_met = await evaluate_trading_condition(coin, price_data, chain_id)
                    if condition_met:
                        logger.info(f"Trading condition met! Executing trade for {coin.token_address}")
                        # Execute the trade
                        tx_hash = dex.execute_trade(
                            buy_token=coin.token_address,
                            amount=int(coin.amount * 1e18),  # Amount in wei
                            chain_id=chain_id
                        )

                        # Record the trade with additional data
                        trade = Trade(
                            bot_id=bot_id,
                            coin_id=coin.id,
                            trade_time=datetime.now(timezone.utc).replace(tzinfo=None),
                            token_address=coin.token_address,
                            amount=coin.amount,
                            trade_price=current_price,
                            transaction_hash=tx_hash,
                            chain_id=chain_id  # Added chain_id from bot config
                        )
                        db.add(trade)
                        logger.info(f"Trade executed for bot {bot_id}, coin {coin.id}")
                    else:
                        logger.info(f"Trading condition not met for {coin.token_address}")

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


# Condition Evaluators for different trading strategies
async def evaluate_trading_condition(coin: Coin, price_data: dict, chain_id: int) -> bool:
    """
    Evaluate trading condition based on coin's condition_type and parameters
    """
    try:
        condition_type = getattr(coin, 'condition_type', 'price_drop')
        condition_params = getattr(coin, 'condition_params', {"threshold": coin.threshold})
        
        # If condition_params is None or empty, fall back to threshold
        if not condition_params:
            condition_params = {"threshold": coin.threshold}
        
        logger.info(f"Evaluating condition: {condition_type} with params: {condition_params}")
        
        if condition_type == "price_drop":
            return evaluate_price_drop_condition(coin, price_data, condition_params)
        elif condition_type == "rsi_oversold":
            return await evaluate_rsi_condition(coin, price_data, condition_params, chain_id)
        elif condition_type == "volume_spike":
            return await evaluate_volume_condition(coin, price_data, condition_params, chain_id)
        elif condition_type == "support_level":
            return evaluate_support_level_condition(coin, price_data, condition_params)
        elif condition_type == "moving_average_cross":
            return await evaluate_ma_cross_condition(coin, price_data, condition_params, chain_id)
        else:
            # Default to price drop for unknown condition types
            logger.warning(f"Unknown condition type: {condition_type}, defaulting to price_drop")
            return evaluate_price_drop_condition(coin, price_data, {"threshold": coin.threshold})
            
    except Exception as e:
        logger.error(f"Error evaluating trading condition: {str(e)}")
        # Fall back to original logic if anything fails
        change_24h = price_data.get("24hChange")
        if change_24h is not None:
            return change_24h < -coin.threshold
        return False


def evaluate_price_drop_condition(coin: Coin, price_data: dict, condition_params: dict) -> bool:
    """
    Evaluate price drop condition
    Expected params: {"threshold": 5.0}
    """
    change_24h = price_data.get("24hChange")
    threshold = condition_params.get("threshold", coin.threshold)
    
    if change_24h is None:
        logger.warning(f"No 24h change data for {coin.token_address}")
        return False
    
    result = change_24h < -threshold
    logger.info(f"Price drop condition: 24h change {change_24h}% < -{threshold}% = {result}")
    return result


async def evaluate_rsi_condition(coin: Coin, price_data: dict, condition_params: dict, chain_id: int) -> bool:
    """
    Evaluate RSI oversold condition
    Expected params: {"rsi_threshold": 30, "timeframe": "1h"}
    
    Note: This is a simplified implementation. In production, you would fetch actual RSI data
    from a technical analysis API or calculate it from historical price data.
    """
    rsi_threshold = condition_params.get("rsi_threshold", 30)
    timeframe = condition_params.get("timeframe", "1h")
    
    # Simplified RSI simulation based on 24h price change
    # In reality, you'd calculate RSI from price history
    change_24h = price_data.get("24hChange", 0)
    
    # Simulate RSI: if price dropped significantly, assume oversold conditions
    simulated_rsi = max(10, 50 + (change_24h * 2))  # Rough simulation
    
    result = simulated_rsi < rsi_threshold
    logger.info(f"RSI condition: Simulated RSI {simulated_rsi:.1f} < {rsi_threshold} = {result}")
    return result


async def evaluate_volume_condition(coin: Coin, price_data: dict, condition_params: dict, chain_id: int) -> bool:
    """
    Evaluate volume spike condition
    Expected params: {"volume_multiplier": 2.0, "timeframe": "24h"}
    """
    volume_multiplier = condition_params.get("volume_multiplier", 2.0)
    timeframe = condition_params.get("timeframe", "24h")
    
    # Get volume data from price_data if available
    current_volume = price_data.get("volume", 0)
    
    # For simplification, we'll use a heuristic based on price change
    # In production, you'd compare with historical volume averages
    change_24h = abs(price_data.get("24hChange", 0))
    
    # Assume volume spike if price change is significant
    volume_spike_threshold = 10  # If price moved more than 10%, assume volume spike
    result = change_24h > volume_spike_threshold
    
    logger.info(f"Volume condition: Price change {change_24h}% indicates volume spike = {result}")
    return result


def evaluate_support_level_condition(coin: Coin, price_data: dict, condition_params: dict) -> bool:
    """
    Evaluate support level condition
    Expected params: {"support_price": 1.25, "tolerance": 0.02}
    """
    support_price = condition_params.get("support_price", 0)
    tolerance = condition_params.get("tolerance", 0.02)  # 2% tolerance
    
    current_price = price_data.get("usdPrice", 0)
    
    if support_price == 0 or current_price == 0:
        logger.warning(f"Invalid support price {support_price} or current price {current_price}")
        return False
    
    # Check if current price is at or near support level
    price_diff = abs(current_price - support_price) / support_price
    result = price_diff <= tolerance and current_price <= support_price * (1 + tolerance)
    
    logger.info(f"Support level condition: Price ${current_price:.4f} near support ${support_price:.4f} (±{tolerance*100}%) = {result}")
    return result


async def evaluate_ma_cross_condition(coin: Coin, price_data: dict, condition_params: dict, chain_id: int) -> bool:
    """
    Evaluate moving average crossover condition
    Expected params: {"fast_ma": 20, "slow_ma": 50, "timeframe": "1h"}
    
    Note: This is a simplified implementation. In production, you would calculate
    actual moving averages from historical price data.
    """
    fast_ma = condition_params.get("fast_ma", 20)
    slow_ma = condition_params.get("slow_ma", 50)
    timeframe = condition_params.get("timeframe", "1h")
    
    # Simplified simulation based on price momentum
    # In reality, you'd calculate actual MAs from historical data
    change_24h = price_data.get("24hChange", 0)
    
    # Simulate bullish crossover: if price has been dropping but showing recovery signs
    # Look for oversold conditions that might indicate a bounce
    momentum_threshold = -5  # If price dropped more than 5% but less than 15%, assume potential crossover
    result = -15 < change_24h < momentum_threshold
    
    logger.info(f"MA Cross condition: 24h change {change_24h}% indicates potential bullish crossover = {result}")
    return result
