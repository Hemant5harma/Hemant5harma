import threading
import logging
import csv
import time
from datetime import datetime
from typing import Dict, List
from src.py_models.coin import CoinResponse
from src.services.manager import MarketDataService

logger = logging.getLogger(__name__)

class DCABot:
    def __init__(self, bot_id: int, user_id: int, name: str, frequency: int, coin: CoinResponse):
        self.bot_id = bot_id
        self.user_id = user_id
        self.name = name
        self.frequency = frequency
        self.status = "paused"
        self.coin = coin
        self.running = False
        self.transactions = []
        self.solana_api = MarketDataService()
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.thread = None
        self._lock = threading.Lock()

    def start(self):
        with self._lock:
            if self.status == "running":
                return
            self.status = "running"
            self.running = True
            self.updated_at = datetime.now()

        def run_bot():
            while self.running:
                try:
                    self._check_buy_signal()
                    time.sleep(self.frequency * 60)
                except Exception as e:
                    logger.error(f"Bot {self.bot_id} error: {str(e)}", exc_info=True)
                    time.sleep(60)

        self.thread = threading.Thread(target=run_bot, daemon=True)
        self.thread.start()
        logger.info(f"Started SOL bot {self.bot_id}")

    def pause(self):
        with self._lock:
            self.status = "paused"
            self.running = False
            self.updated_at = datetime.now()
        logger.info(f"Paused SOL bot {self.bot_id}")

    def stop(self):
        with self._lock:
            self.status = "stopped"
            self.running = False
            self.updated_at = datetime.now()
        
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
        logger.info(f"Stopped SOL bot {self.bot_id}")

    def _check_buy_signal(self):
        try:
            data = self.solana_api.get_token_data()
            if not data or any(f not in data for f in ['current_price', 'price_change_24h']):
                return

            if data['price_change_24h'] < -self.coin.threshold:
                transaction = {
                    "bot_id": self.bot_id,
                    "timestamp": datetime.now().isoformat(),
                    "action": "BUY",
                    "amount": self.coin.amount,
                    "price": data['current_price'],
                    "price_change_24h": data['price_change_24h'],
                    "sma_7day": data['sma_7day']
                }
                
                with self._lock:
                    self.transactions.append(transaction)
                self._save_transaction(transaction)

        except Exception as e:
            logger.error(f"SOL buy signal error: {str(e)}", exc_info=True)

    def _save_transaction(self, transaction: dict):
        try:
            filename = f"solana_transactions_{self.bot_id}.csv"
            with open(filename, 'a', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=transaction.keys())
                if f.tell() == 0:
                    writer.writeheader()
                writer.writerow(transaction)
        except Exception as e:
            logger.error(f"Transaction save failed: {str(e)}")

    def get_status(self) -> dict:
        with self._lock:
            return {
                "id": self.bot_id,
                "user_id": self.user_id,
                "name": self.name,
                "status": self.status,
                "frequency": self.frequency,
                "coin": self.coin.dict(),
                "created_at": self.created_at,
                "updated_at": self.updated_at,
                "transactions_count": len(self.transactions)
            }