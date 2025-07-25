import os
import logging
from datetime import datetime, timedelta
from typing import Callable, Any, Optional
import asyncio
import requests
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.database.models.models import Bot

logger = logging.getLogger(__name__)

# Mapping for chain IDs to GeckoTerminal network strings
CHAIN_ID_TO_NETWORK = {
    1: "eth",           # Ethereum
    42161: "arbitrum",  # Arbitrum
    56: "bsc",          # Binance Smart Chain
    137: "polygon_pos", # Polygon PoS
    10: "optimism",     # Optimism
    43114: "avax", 
    900: "solana",     # Avalanche
    250: "fantom",      # Fantom
    25: "cronos",       # Cronos
    100: "xdai",        # Gnosis Chain (xDAI)
    1284: "moonbeam",   # Moonbeam
    1285: "moonriver",  # Moonriver
    10143: "monad-testnet",     # Monad
    # Add other chains as needed
}

class MarketDataService:
    """Market data service with database-driven network configuration"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_price_for_bot_token(self, bot_id: int, token_address: str):
        """
        Fetch token price using bot's network configuration from database.
        
        Args:
            bot_id: The bot ID to get network configuration from
            token_address: The token contract address
        
        Returns:
            Dictionary with 'usdPrice' and '24hChange', or None if failed
        """
        try:
            # Get bot's network configuration from database
            result = await self.db.execute(
                select(Bot.chain_id, Bot.network_name).where(Bot.id == bot_id)
            )
            bot_network = result.first()
            
            if not bot_network:
                logger.error(f"Bot {bot_id} not found in database")
                return None
            
            chain_id = bot_network.chain_id
            
            # Use the direct price fetching function with bot's chain_id
            return self.get_current_price_gecko(token_address, chain_id)
            
        except Exception as e:
            logger.error(f"Error fetching price for bot {bot_id}, token {token_address}: {e}")
            return None
    
    def get_current_price_gecko(self, token_address: str, chain_id: int = 1):
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
            logger.error(f"Unsupported chain ID: {chain_id}")
            return None
        
        # GeckoTerminal expects hex addresses lower-cased for EVM chains, but
        # Solana (base58) mint addresses are case-sensitive. Lower-casing them
        # will produce an invalid address and the API will return no data. We
        # therefore only apply the `.lower()` transformation for non-Solana
        # networks.

        is_solana = chain_id == 900 or network == "solana"
        address_for_query = token_address if is_solana else token_address.lower()

        url = (
            f"https://api.geckoterminal.com/api/v2/simple/networks/"
            f"{network}/token_price/{address_for_query}?include_24hr_price_change=true&include_24hr_vol=true"
        )
        try:
            response = requests.get(url, headers={"accept": "application/json"})
            response.raise_for_status()
            data = response.json()

            attributes = data.get("data", {}).get("attributes", {})

            # Keys from the API are lower-cased for EVM; for Solana they match
            # the exact mint address. Try both to be safe.
            key_lower = token_address.lower()
            price_dict = attributes.get("token_prices", {})
            change_dict = attributes.get("h24_price_change_percentage", {})

            price = price_dict.get(key_lower) or price_dict.get(token_address)
            change_24h = change_dict.get(key_lower) or change_dict.get(token_address)
            if price is not None:
                return {
                    "usdPrice": float(price),
                    "24hChange": float(change_24h) if change_24h is not None else None,
                }
            else:
                logger.error(f"Price data not found in response for {token_address} on {network}")
                return None
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed for {token_address} on {network}: {e}")
            return None
        except (KeyError, ValueError, TypeError) as e:
            logger.error(f"Failed to parse response for {token_address} on {network}: {e}")
            return None

    async def get_price_with_chain_id(self, token_address: str, chain_id: int):
        """
        Direct price fetch with chain_id (for backward compatibility)
        
        Args:
            token_address: The token contract address
            chain_id: The blockchain chain ID
        
        Returns:
            Dictionary with 'usdPrice' and '24hChange', or None if failed
        """
        return self.get_current_price_gecko(token_address, chain_id)


# Legacy function for backward compatibility
def get_current_price_gecko(token_address: str, chain_id: int = 1):
    """
    Legacy function for backward compatibility.
    This maintains the same interface as the original dca.py function.
    """
    # Create a temporary service instance without database dependency
    service = MarketDataService(db=None)
    return service.get_current_price_gecko(token_address, chain_id)


async def main():
    # Example usage
    token_address = "0xf817257fed379853cde0fa4f97ab987181b1e5ea" # USDC on Arbitrum
    # For testing the legacy function
    price_data = get_current_price_gecko(token_address, 10143)
    if price_data:
        print(f"Token Address: {token_address}")
        print(f"Current price: ${price_data['usdPrice']}")
        change_24h = price_data.get('24hChange')
        if change_24h is not None:
            print(f"24h Change: {change_24h}%")
        else:
            print("24h Change data not available.")
    else:
        print(f"Failed to fetch price data for {token_address}")

if __name__ == "__main__":
    asyncio.run(main())
        