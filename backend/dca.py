import time
import logging
import csv
import uuid
from datetime import datetime
import threading
from typing import List, Dict, Optional
from .CrrytoData import crytodata

class DCABot:
    def __init__(self, symbols: List[str], initial_amount: int = 100, is_single_bot: bool = True):
        self.symbols = symbols
        self.running = {symbol: True for symbol in symbols}
        self.crypto_api = crytodata()
        self.bot_id = str(uuid.uuid4())
        self.initial_amount = initial_amount
        self.total_spent = {symbol: 0 for symbol in symbols}
        self.transactions = []
        self.is_single_bot = is_single_bot
        self.threads = {}

    def check_buy_signal(self, symbol: str) -> None:
        if not self.running[symbol]:
            return

        token_data = self.crypto_api.get_token_data(symbol)
        if token_data is None:
            return

        price_change_24 = token_data.get("price_change_24", None)
        live_price = token_data['Latest Close Price']

        if price_change_24 is None:
            logging.error(f"❌ Price change data for {symbol} not available.")
            return

        logging.info(f"📈 {symbol.upper()} Live price: {live_price} USD with its 24h price change: {price_change_24}%")

        try:
            if float(price_change_24) < -1:
                amount_to_buy = self.initial_amount
                self.total_spent[symbol] += amount_to_buy
                action = "BUY"
                print(f"🔥 BUY {symbol.upper()} NOW! Live price: {live_price} | 24h Price Change: {price_change_24}% | Amount Spent: {amount_to_buy} USD")
            else:
                amount_to_buy = 0
                action = "No Buy"
                print(f"⏳ No buy signal for {symbol}. 24h Price Change is not less than -1%. Change: {price_change_24}%")

            transaction = {
                "Bot ID": self.bot_id,
                "Time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "Symbol": symbol.upper(),
                "Live Price": live_price,
                "24h Price Change (%)": price_change_24,
                "Amount Spent": amount_to_buy,
                "Total Spent": self.total_spent[symbol],
                "Action": action
            }
            self.transactions.append(transaction)
            self.save_to_csv(transaction, symbol)

        except ValueError:
            logging.error(f"❌ Invalid price change value for {symbol}: {price_change_24}")

    def save_to_csv(self, transaction: Dict, symbol: str) -> None:
        filename = "bot_transactions.csv" if self.is_single_bot else f"bot_transactions_{symbol}.csv"

        try:
            with open(filename, 'r'):
                file_exists = True
        except FileNotFoundError:
            file_exists = False

        with open(filename, mode='a', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=transaction.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(transaction)

    def start(self, frequency: int = 1) -> None:
        for symbol in self.symbols:
            def run_symbol():
                while self.running[symbol]:
                    self.check_buy_signal(symbol)
                    time.sleep(frequency * 60)

            self.threads[symbol] = threading.Thread(target=run_symbol)
            self.threads[symbol].start()
            

    def pause(self, symbol: Optional[str] = None) -> None:
        if symbol:
            if symbol in self.running:
                self.running[symbol] = False
                logging.info(f"🛑 Bot paused for {symbol.upper()}.")
        else:
            for symbol in self.symbols:
                self.running[symbol] = False
                logging.info("🛑 Bot paused for all symbols.")

    def delete(self) -> None:
        self.pause()
        logging.info("🛑 Bot instance deleted.")