import logging
from datetime import datetime, timedelta, timezone
from web3 import Web3
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from src.database.models.models import Bot, Coin, Trade
from src.database.connection import async_session
from src.dex.unified_dex_router import UnifiedDexRouter
from src.services.manager import BotManager
from src.services.DCABot import JobManager
from src.py_models.manual_trade import WalletBalanceRequest
from src.services.notifications import NotificationService

from src.database.queries import create_or_update_bot_performance

# Import the market data service
from src.services.market_data import MarketDataService, get_current_price_gecko

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
    
    # Create market data service instance
    market_service = MarketDataService(db)
    
    # Retrieve current prices for each token and compute overall portfolio value
    for token_address, coin_qty in token_amounts.items():
        try:
            # Use the market data service with chain_id
            price_data = await market_service.get_price_with_chain_id(token_address, chain_id)
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
    """Check bot conditions and execute trades using SQLAlchemy ORM
    
    Logic-level approach: Bot checks every minute, but only evaluates conditions
    if enough time has passed since the last trade (based on bot.frequency).
    """
    async with async_session() as db:
        try:
            # Get the bot with user information and trades
            result = await db.execute(
                select(Bot).where(Bot.id == bot_id, Bot.status == "running")
                .options(joinedload(Bot.coins), joinedload(Bot.user), joinedload(Bot.trades))
            )
            bot = result.scalars().first()

            if not bot:
                logger.info(f"Bot {bot_id} not found or not running")
                return
            
            # Logic-level frequency check: Calculate time windows based on bot start time
            # Bot can trade once per time window (e.g., once per 24 hours from start time)
            # Windows are calculated from bot.start_time, not from when trade executes
            if not bot.start_time:
                # If start_time is not set, set it now (for existing bots)
                bot.start_time = datetime.now(timezone.utc).replace(tzinfo=None)
                await db.commit()
            
            current_time = datetime.now(timezone.utc).replace(tzinfo=None)
            required_interval = parse_frequency(bot.frequency)
            
            # Calculate which time window we're currently in
            # Window 0: [start_time, start_time + frequency)
            # Window 1: [start_time + frequency, start_time + 2*frequency)
            # Window 2: [start_time + 2*frequency, start_time + 3*frequency)
            # etc.
            time_since_start = current_time - bot.start_time
            current_window = int(time_since_start.total_seconds() / required_interval.total_seconds())
            current_window_start = bot.start_time + timedelta(seconds=current_window * required_interval.total_seconds())
            current_window_end = current_window_start + required_interval
            
            # Check if bot has already traded in the current window
            if bot.trades:
                # Get the most recent trade
                last_trade = max(bot.trades, key=lambda t: t.trade_time)
                last_trade_time = last_trade.trade_time
                
                # Check if last trade was in the current window
                if current_window_start <= last_trade_time < current_window_end:
                    # Already traded in this window, skip until next window
                    bot.next_execution_time = current_window_end
                    await db.commit()
                    logger.info(
                        f"Bot {bot_id} skipping check: already traded in current window "
                        f"[{current_window_start} to {current_window_end}]. "
                        f"Next window starts at {current_window_end}"
                    )
                    return
            
            # Bot can trade in this window (either no previous trades, or last trade was in a previous window)
            
            # Enough time has passed (or no previous trades), proceed with normal checking

            chain_id = bot.chain_id  
            # Create UnifiedDexRouter instance (supports both EVM and Solana)
            dex_router = UnifiedDexRouter()
            
            # Get all coins for this bot
            coins = bot.coins
            
            # USDT token addresses for each chain (for DCA bot purchases)
            usdt_tokens = {
                900: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",  # Solana USDT (correct mint)
                1: "0xdac17f958d2ee523a2206206994597c13d831ec7",      # Ethereum USDT
                137: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",    # Polygon USDT
                42161: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",  # Arbitrum USDT
                43114: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",  # Avalanche USDT
                56: "0x55d398326f99059ff775485246999027b3197955",     # BSC USDT
                8453: "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2",   # Base USDT
                10: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",    # Optimism USDT
                10143: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",  # Monad Testnet USDT
            }
            
            # Get USDT token address for this chain
            usdt_token = usdt_tokens.get(chain_id)
            
            # USDT has 6 decimals on ALL chains including Solana
            usdt_decimals = 6
            usdt_multiplier = 10 ** usdt_decimals
            
            # Determine unit multiplier per chain (lamports for Solana, wei for EVM) - kept for compatibility
            unit_multiplier = 10 ** 9 if chain_id == 900 else 10 ** 18
            
            # Check both native balance (for gas) and USDT balance (for trading)
            try:
                # Get native balance for gas fees
                balance_request = WalletBalanceRequest(chain_id=chain_id, tokens=None)
                balances = await dex_router.get_wallet_balances(balance_request, bot.user_id, db)
                native_balance_smallest = int(balances.native_balance)
                
                # Get USDT balance for trading
                usdt_balance_smallest = 0
                if usdt_token:
                    usdt_balance_request = WalletBalanceRequest(chain_id=chain_id, tokens=[usdt_token])
                    usdt_balances = await dex_router.get_wallet_balances(usdt_balance_request, bot.user_id, db)
                    # Extract USDT balance from tokens list
                    if usdt_balances.tokens:
                        for token_info in usdt_balances.tokens:
                            if token_info.address.lower() == usdt_token.lower():
                                usdt_balance_smallest = int(token_info.balance)
                                logger.info(f"Bot {bot_id} - USDT balance: {usdt_balance_smallest} (raw), {usdt_balance_smallest / usdt_multiplier:.6f} USDT")
                                break
                    else:
                        logger.warning(f"Bot {bot_id} - No USDT balance returned for token {usdt_token}")
                    
            except Exception as e:
                logger.error(f"Failed to get wallet balance for bot {bot_id}: {e}")
                # If it's a connection error, pause the bot temporarily to avoid spam
                if "ConnectionResetError" in str(e) or "Connection" in str(e):
                    logger.warning(f"Connection issue detected for bot {bot_id}, pausing temporarily")
                    try:
                        BotManager().pause_job(bot_id)
                        bot.status = "paused"
                        await db.commit()
                    except Exception:
                        pass
                    return
                native_balance_smallest = 0
                usdt_balance_smallest = 0
            
            # If no native balance at all, pause the bot and exit early (need native token for gas fees)
            if native_balance_smallest <= 0:
                logger.warning(f"No native balance detected for bot {bot_id}; pausing bot (need for gas fees).")
                try:
                    BotManager().pause_job(bot_id)
                except Exception:
                    pass
                bot.status = "paused"
                await db.commit()
                # Notify: paused due to insufficient balance (zero)
                try:
                    native_symbol = "SOL" if chain_id == 900 else ("MON" if chain_id == 10143 else "ETH")
                    message = f"Bot '{bot.name}' paused: zero {native_symbol} balance (needed for gas fees)"
                    
                    await NotificationService.emit(
                        db,
                        user_id=bot.user_id,
                        type="bot.paused_insufficient_balance",
                        title="Bot paused: insufficient balance",
                        message=message,
                        severity="warning",
                        bot_id=bot_id,
                        extra_data={
                            "available_native": 0, 
                            "required_usd": 0, 
                            "chain_id": chain_id,
                            "native_symbol": native_symbol
                        },
                    )
                except Exception:
                    pass
                return
            
            # Track if any trade was executed during this check
            trade_executed = False
            
            for coin in coins:
                try:
                    # Create market data service instance
                    market_service = MarketDataService(db)
                    
                    # Get price data for the token using bot's network configuration
                    price_data = await market_service.get_price_for_bot_token(bot_id, coin.token_address)
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
                        # Check sufficient USDT balance before executing (we now use USDT to buy tokens)
                        required_amount = int(coin.amount * usdt_multiplier) if coin.amount else 0
                        if usdt_balance_smallest < required_amount:
                            logger.warning(
                                f"Insufficient USDT balance for bot {bot_id}: have {usdt_balance_smallest}, need {required_amount}. Pausing bot."
                            )
                            try:
                                BotManager().pause_job(bot_id)
                            except Exception:
                                pass
                            bot.status = "paused"
                            await db.commit()
                            # Notify: paused due to insufficient balance
                            try:
                                # Convert to user-friendly amounts
                                required_usd = coin.amount if coin.amount else 0  # This is already in USD
                                available_usdt = usdt_balance_smallest / usdt_multiplier  # Convert to USDT amount
                                
                                # Determine currency display
                                if chain_id == 10143:  # Monad testnet
                                    currency_display = "MON"  # Use MON for Monad testnet
                                else:
                                    currency_display = "USDT"
                                
                                # Format the message with user-friendly amounts and bot name
                                message = f"Bot '{bot.name}' paused: needed ${required_usd:.2f} {currency_display}, available {available_usdt:.6f} {currency_display}"
                                
                                await NotificationService.emit(
                                    db,
                                    user_id=bot.user_id,
                                    type="bot.paused_insufficient_balance",
                                    title="Bot paused: insufficient balance",
                                    message=message,
                                    severity="warning",
                                    bot_id=bot_id,
                                    extra_data={
                                        "available_usdt": available_usdt, 
                                        "required_usd": required_usd, 
                                        "token": coin.token_address, 
                                        "chain_id": chain_id,
                                        "currency_display": currency_display
                                    },
                                )
                            except Exception:
                                pass
                            return

                        tx_hash = await dex_router.execute_bot_trade(
                            buy_token=coin.token_address,
                            sell_amount=required_amount,
                            chain_id=chain_id,
                            user_id=bot.user_id,
                            db=db
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
                        trade_executed = True
                        logger.info(f"Trade executed for bot {bot_id}, coin {coin.id}")
                    else:
                        logger.info(f"Trading condition not met for {coin.token_address}")

                except Exception as e:
                    logger.error(f"Error processing coin {coin.id}: {str(e)}")
            
            # If a trade was executed, pause the bot until the next window starts
            # This reduces server load by stopping checks until the next time window
            if trade_executed:
                # Calculate next window start time based on bot.start_time and frequency
                current_time = datetime.now(timezone.utc).replace(tzinfo=None)
                required_interval = parse_frequency(bot.frequency)
                time_since_start = current_time - bot.start_time
                current_window = int(time_since_start.total_seconds() / required_interval.total_seconds())
                next_window_start = bot.start_time + timedelta(seconds=(current_window + 1) * required_interval.total_seconds())
                
                bot.next_execution_time = next_window_start
                
                # Pause the bot to reduce server load
                try:
                    BotManager().pause_job(bot_id)
                    bot.status = "paused"
                    
                    # Schedule resume at the start of the next window
                    job_manager = JobManager(scheduler_manager=BotManager())
                    await job_manager.schedule_resume_at_time(bot_id, next_window_start)
                    
                    logger.info(
                        f"Trade executed for bot {bot_id} in window {current_window}. "
                        f"Bot paused until next window starts at {next_window_start} "
                        f"(based on start time {bot.start_time})"
                    )
                except Exception as e:
                    logger.error(f"Error pausing bot {bot_id} after trade: {str(e)}")
            
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
    """Parse frequency string into timedelta
    
    Supports all timeframes:
    - every minute, every 5 minutes, every 15 minutes
    - hourly (1 hour), every 4 hours
    - daily (1 day)
    - weekly (1 week)
    - monthly (1 month), every 3 months, every 6 months
    - yearly (1 year)
    """
    try:
        # If frequency is stored as an integer (minutes)
        if isinstance(frequency_str, int):
            return timedelta(minutes=frequency_str)

        # If frequency is stored as a string like "5 minute" or "1 hour"
        num, unit = frequency_str.split()
        num = int(num)
        unit_lower = unit.lower()
        
        if unit_lower in ("second", "seconds"):
            return timedelta(seconds=num)
        elif unit_lower in ("minute", "minutes"):
            return timedelta(minutes=num)
        elif unit_lower in ("hour", "hours"):
            return timedelta(hours=num)
        elif unit_lower in ("day", "days"):
            return timedelta(days=num)
        elif unit_lower in ("week", "weeks"):
            return timedelta(weeks=num)
        elif unit_lower in ("month", "months"):
            return timedelta(days=num * 30)  # Approximate month as 30 days
        elif unit_lower in ("year", "years"):
            return timedelta(days=num * 365)  # Approximate year as 365 days
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
