import asyncio
import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.queries import get_bot_by_id, get_coins_by_bot
from src.services.market_data import MarketDataService
from src.services.DCABot import DCABot

logger = logging.getLogger(__name__)

class BotManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(BotManager, cls).__new__(cls)
            cls._instance.active_tasks = {}
            cls._instance.market_data = MarketDataService()
            cls._instance.active_bots: Dict[int, DCABot] = {}
            cls._instance.lock = threading.Lock()
            cls._instance.next_bot_id = 1
        return cls._instance

    def _get_next_bot_id(self) -> int:
        with self.lock:
            bot_id = self.next_bot_id
            self.next_bot_id += 1
            return bot_id

    def add_bot(self, bot: DCABot):
        with self.lock:
            self.active_bots[bot.bot_id] = bot

    def remove_bot(self, bot_id: int):
        with self.lock:
            if bot_id in self.active_bots:
                bot = self.active_bots.pop(bot_id)
                bot.stop()

    def get_bot(self, bot_id: int) -> Optional[DCABot]:
        with self.lock:
            return self.active_bots.get(bot_id)

    def list_bots(self) -> List[DCABot]:
        with self.lock:
            return list(self.active_bots.values())
    
    async def start_bot(self, bot_id: int) -> bool:
        """Start a bot if it's not already running."""
        # Check if already running
        if bot_id in self.active_tasks and not self.active_tasks[bot_id].done():
            logger.info(f"Bot {bot_id} is already running")
            return False
        
        # Start the bot task
        self.active_tasks[bot_id] = asyncio.create_task(
            self._run_bot_loop(bot_id)
        )
        logger.info(f"Started bot {bot_id}")
        return True
    
    async def pause_bot(self, bot_id: int) -> bool:
        """Pause a running bot."""
        if bot_id in self.active_tasks and not self.active_tasks[bot_id].done():
            self.active_tasks[bot_id].cancel()
            logger.info(f"Paused bot {bot_id}")
            return True
        return False
    
    async def _run_bot_loop(self, bot_id: int):
        """Main loop for bot execution."""
        from src.api.dependencies import get_db
        
        while True:
            try:
                # Get a new DB session each loop iteration
                async for db in get_db():
                    try:
                        # Check if bot is still marked as running
                        bot = await get_bot_by_id(db, bot_id)
                        if not bot or bot.status != "running":
                            logger.info(f"Bot {bot_id} status changed, stopping loop")
                            break
                        
                        # Check buy signals
                        await self._check_buy_signals(db, bot)
                        
                        # Sleep until next execution
                        await asyncio.sleep(bot.frequency * 60)
                    except Exception as e:
                        logger.error(f"Error in bot {bot_id} execution: {str(e)}")
                        await asyncio.sleep(60)  # Wait a minute before retry
            
            except asyncio.CancelledError:
                logger.info(f"Bot {bot_id} task cancelled")
                break
            
            except Exception as e:
                logger.error(f"Unexpected error in bot {bot_id} loop: {str(e)}")
                await asyncio.sleep(60)
    
    async def _check_buy_signals(self, db: AsyncSession, bot):
        """Check for buy signals on all coins of a bot."""
        coins = await get_coins_by_bot(db, bot.id)
        
        for coin in coins:
            try:
                # Get market data for the token
                token_data = await self.market_data.get_token_data(coin.token_address)
                
                if not token_data:
                    logger.warning(f"No market data for {coin.token_address}")
                    continue
                
                # Check buy conditions
                if token_data['price_change_24h'] < -coin.threshold:
                    logger.info(f"Buy signal for bot {bot.id}, token {coin.token_address}")
                    
                    # Record transaction
                    await create_transaction(
                        db,
                        bot_id=bot.id,
                        token_address=coin.token_address,
                        action="BUY",
                        amount=coin.amount,
                        token_price=token_data['current_price'],
                        price_change_24h=token_data['price_change_24h']
                    )
            
            except Exception as e:
                logger.error(f"Error checking buy signal for {coin.token_address}: {str(e)}")

# Create a singleton instance
bot_manager = BotManager()