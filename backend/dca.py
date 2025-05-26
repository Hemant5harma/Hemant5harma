import os
import logging
from datetime import datetime, timedelta
from typing import Callable, Any
import asyncio
import requests

# Mapping for chain IDs to GeckoTerminal network strings
CHAIN_ID_TO_NETWORK = {
    1: "eth",           # Ethereum
    42161: "arbitrum",  # Arbitrum
    56: "bsc",          # Binance Smart Chain
    137: "polygon_pos", # Polygon PoS
    10: "optimism",     # Optimism
    43114: "avax",      # Avalanche
    250: "fantom",      # Fantom
    25: "cronos",       # Cronos
    100: "xdai",        # Gnosis Chain (xDAI)
    1284: "moonbeam",   # Moonbeam
    1285: "moonriver",  # Moonriver
    10143: "monad-testnet",     # Monad
    # Add other chains as needed
}

def get_current_price_gecko(token_address: str, chain_id: int = 1):
    """
    Fetches token price and 24h change from GeckoTerminal's simple API.
    
    Args:
        token_address: The token contract address
        chain_id: The blockchain chain ID (will be converted to network string)
    
    Returns a dictionary with 'usdPrice' and '24hChange', or None if failed.
    """
    # Convert chain_id to network string
    network = CHAIN_ID_TO_NETWORK.get(chain_id)
    if not network:
        print(f"Unsupported chain ID: {chain_id}")
        return None
    
    url = (
        f"https://api.geckoterminal.com/api/v2/simple/networks/"
        f"{network}/token_price/{token_address.lower()}?include_24hr_price_change=true"
    )
    try:
        response = requests.get(url, headers={"accept": "application/json"})
        response.raise_for_status()
        data = response.json()
        attributes = data.get("data", {}).get("attributes", {})
        price = attributes.get("token_prices", {}).get(token_address.lower())
        change_24h = attributes.get("h24_price_change_percentage", {}).get(token_address.lower())
        if price is not None:
            return {
                "usdPrice": float(price),
                "24hChange": float(change_24h) if change_24h is not None else None,
            }
        else:
            print(f"Price data not found in response for {token_address} on {network}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"API request failed for {token_address} on {network}: {e}")
        return None
    except (KeyError, ValueError, TypeError) as e:
        print(f"Failed to parse response for {token_address} on {network}: {e}")
        return None

async def main():
    # Example usage
    token_address = "0xf817257fed379853cde0fa4f97ab987181b1e5ea" # USDC on Arbitrum
    # chain_id = 42161 
    price_data = get_current_price_gecko(token_address, 10143)
    if price_data:
        print(f"Token Address: {token_address}")
        print(f"Current price: ${price_data['usdPrice']}")
        change_24h = price_data.get('24hChange')
        if change_24h is not None:
            print(f"24h Change: {change_24h}%")
            print(f"Price Drop %: {price_data.get('price_drop_pct', 0)}%")
        else:
            print("24h Change data not available.")
    else:
        print(f"Failed to fetch price data for {token_address} ")

if __name__ == "__main__":
    asyncio.run(main())
