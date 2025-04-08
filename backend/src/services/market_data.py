import aiohttp
import time
import logging
from datetime import datetime , timezone
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class MarketDataService:
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.cache = {}
        self.cache_timeout = 300  # 5 minutes

    async def get_token_data(self, token_id: str) -> Optional[Dict[str, Any]]:
        """Get market data for a specific token."""
        # Normalize token_id (e.g., SOL -> solana)
        if token_id.lower() in ["sol", "solana"]:
            token_id = "solana"
        
        # Check cache
        cached_data = self.cache.get(token_id)
        if cached_data and (time.time() - cached_data['timestamp']) < self.cache_timeout:
            return cached_data['data']

        try:
            async with aiohttp.ClientSession() as session:
                # Get current price and 24h change
                price_url = f"{self.base_url}/simple/price"
                params = {"ids": token_id, "vs_currencies": "usd", "include_24hr_change": "true"}
                
                async with session.get(price_url, params=params) as response:
                    if response.status != 200:
                        logger.error(f"Error fetching price data: {response.status}")
                        return None
                        
                    price_data = await response.json()
                    if token_id not in price_data:
                        logger.error(f"Token {token_id} not found in response")
                        return None
                        
                    token_price_data = price_data[token_id]
                    
                # Get historical data for 7-day SMA
                history_url = f"{self.base_url}/coins/{token_id}/market_chart"
                params = {"vs_currency": "usd", "days": 7, "interval": "daily"}
                
                async with session.get(history_url, params=params) as response:
                    if response.status != 200:
                        logger.error(f"Error fetching history data: {response.status}")
                        return None
                        
                    history_data = await response.json()

            # Process data
            prices = [entry[1] for entry in history_data.get('prices', [])]
            if len(prices) < 2:
                logger.warning(f"Insufficient price data for {token_id}")
                return None

            current_price = token_price_data.get('usd')
            price_change_24h = token_price_data.get('usd_24h_change')
            
            if None in [current_price, price_change_24h]:
                logger.warning(f"Missing price data for {token_id}")
                return None

            sma = sum(prices) / len(prices)
            price_drop = ((prices[-2] - current_price) / prices[-2]) * 100 if prices[-2] > 0 else 0

            result = {
                "symbol": token_id.upper(),
                "current_price": current_price,
                "price_change_24h": price_change_24h,
                "sma_7day": round(sma, 2),
                "price_drop_pct": round(price_drop, 2),
                "last_updated": datetime.now(timezone.utc).isoformat()
            }

            # Cache the result
            self.cache[token_id] = {'data': result, 'timestamp': time.time()}
            return result

        except Exception as e:
            logger.error(f"Error fetching data for {token_id}: {str(e)}")
            return None
        
        