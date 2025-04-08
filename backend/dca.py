import os
import logging
from datetime import datetime, timedelta
from typing import Callable, Any
import asyncio
from src.services.market_data import MarketDataService


def get_current_price(token_address):
    # This is a placeholder for your actual implementation
    # When you uncomment the Web3 code, you can implement the actual price fetching
     # Placeholder for your actual market data fetching function
    md_service = MarketDataService()
    price = md_service.get_token_data(token_address)
    if price is None:
        print(f"Failed to fetch price for token: {token_address}")
        return None
    return price  # Placeholder value

p = asyncio.run(get_current_price("solana")) 
# Example usage, replace with actual token address
print(p['price_drop_pct']) # Example usage, replace with actual token address
print(p['current_price']) # Example usage, replace with actual token address
