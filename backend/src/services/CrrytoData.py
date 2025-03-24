import requests
import logging
from typing import Dict, Optional

class CryptoData:
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"

    def get_token_data(self, symbol: str) -> Optional[Dict]:
        url = f"{self.base_url}/coins/markets"
        params = {
            "vs_currency": "usd",
            "ids": symbol.lower(),
            "order": "market_cap_desc",
            "per_page": 1,
            "page": 1,
            "sparkline": False
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if not data:
                logging.error(f"❌ Token {symbol} not found")
                return None

            token = data[0]
            close_price = token.get("current_price", None)

            if close_price is None:
                logging.error(f"❌ Current price for {symbol} not available")
                return None

            history_url = f"{self.base_url}/coins/{symbol.lower()}/market_chart"
            history_params = {"vs_currency": "usd", "days": 7, "interval": "daily"}
            history_response = requests.get(history_url, params=history_params)

            if history_response.status_code == 200:
                history_data = history_response.json()
                prices = [entry[1] for entry in history_data.get("prices", [])]

                if not prices:
                    logging.error(f"❌ Not enough historical data for {symbol} to calculate SMA")
                    return None

                sma = sum(prices) / len(prices)

                price_drop = (
                    ((prices[-2] - close_price) / prices[-2]) * 100
                    if len(prices) > 1 else 0
                )

                return {
                    "Symbol": token["symbol"].upper(),
                    "Name": token["name"],
                    "Close Prices (7 Days)": prices,
                    "SMA (7-day)": round(sma, 2),
                    "Latest Close Price": close_price,
                    "Actual Price Drop (%)": round(price_drop, 2),
                    "price_change_24": token.get("price_change_percentage_24h", None)
                }

            else:
                logging.error(f"❌ Failed to fetch historical data for {symbol}. Status code: {history_response.status_code}")
                return None

        except requests.exceptions.RequestException as e:
            logging.error(f"❌ API request failed: {e}")
            return None