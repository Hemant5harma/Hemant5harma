import os
import logging
from datetime import datetime, timedelta
from typing import Callable, Any
import asyncio
from src.services.market_data import MarketDataService
from moralis import evm_api

api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjU2MzUzOGFjLWY5MGUtNGExZi1hZGFmLTM4MGM3Y2M0Nzk0YyIsIm9yZ0lkIjoiNDQxMTkyIiwidXNlcklkIjoiNDUzOTEzIiwidHlwZUlkIjoiNDdlYzI1Y2UtNDk5Mi00OTYyLWIzZjEtOGJiOThiNjI0NmMxIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDQ0MDMzNzksImV4cCI6NDkwMDE2MzM3OX0.DXsemRq-G-GgH-PXffRmIwdGNpn7cJ06VNDbaGfEYDs"

def get_current_price(token_address: str):
    """
    Fetches token price from Moralis using EVM API.
    Returns the entire price object from Moralis, or None if failed.
    """
    # Customize chain and other params as necessary
    params = {
        "chain": "eth",
        "include": "percent_change",
        "address": token_address.lower(),
    }
    try:
        result = evm_api.token.get_token_price(api_key=api_key, params=params)
        return result
    except Exception as e:
        print(f"Failed to fetch price for {token_address}: {e}")
        return None

async def main():
    # Example usage
    token_address = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"
    price_data = get_current_price(token_address)
    if price_data is not None:
        print(f"Price drop %: {price_data.get('24hrPercentChange')}")
        print(f"Current price: {price_data.get('usdPrice')}")

if __name__ == "__main__":
    asyncio.run(main())
