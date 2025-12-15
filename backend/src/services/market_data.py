import os
import logging
from datetime import datetime, timedelta
from typing import Callable, Any, Optional, Dict
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

# Mapping from token symbols to CoinPaprika coin IDs (for major tokens)
# This is a partial mapping - we'll try CoinPaprika first, fallback to GeckoTerminal
TOKEN_SYMBOL_TO_COINPAPRIKA_ID = {
    "BTC": "btc-bitcoin",
    "ETH": "eth-ethereum",
    "BNB": "bnb-bnb",
    "SOL": "sol-solana",
    "USDT": "usdt-tether",
    "USDC": "usdc-usd-coin",
    "DAI": "dai-dai",
    "MATIC": "matic-polygon",
    "AVAX": "avax-avalanche",
    "LINK": "link-chainlink",
    "UNI": "uni-uniswap",
    "WBTC": "wbtc-wrapped-bitcoin",
    "WETH": "weth-wrapped-ether",
    "MON": "mon-monad",
    "WSOL": "sol-solana",  # Wrapped SOL maps to SOL
    "WBNB": "bnb-bnb",  # Wrapped BNB maps to BNB
    "BTCB": "btc-bitcoin",  # Bitcoin BEP20 maps to BTC
    # Add more as needed
}

# Mapping from frequency string to CoinPaprika interval
def frequency_to_coinpaprika_interval(frequency_str: str) -> str:
    """
    Convert frequency string to CoinPaprika interval.
    
    Args:
        frequency_str: Frequency like "15 minute", "1 hour", "6 hour", "24 hour", "7 day", etc.
    
    Returns:
        CoinPaprika interval string: "15m", "30m", "1h", "6h", "24h", "7d", "30d", "1y"
    """
    try:
        if isinstance(frequency_str, int):
            # If frequency is stored as minutes
            minutes = frequency_str
            if minutes <= 15:
                return "15m"
            elif minutes <= 30:
                return "30m"
            elif minutes <= 60:
                return "1h"
            elif minutes <= 360:  # 6 hours
                return "6h"
            else:
                return "24h"
        
        # Parse frequency string like "15 minute", "1 hour", etc.
        parts = frequency_str.lower().split()
        if len(parts) < 2:
            return "24h"  # Default to 24h
        
        num = int(parts[0])
        unit = parts[1].rstrip('s')  # Remove plural 's'
        
        if unit == "second" or unit == "sec":
            total_seconds = num
            if total_seconds <= 900:  # 15 minutes
                return "15m"
            elif total_seconds <= 1800:  # 30 minutes
                return "30m"
            elif total_seconds <= 3600:  # 1 hour
                return "1h"
            else:
                return "6h"
        elif unit == "minute" or unit == "min":
            total_minutes = num
            if total_minutes <= 15:
                return "15m"
            elif total_minutes <= 30:
                return "30m"
            elif total_minutes <= 60:
                return "1h"
            elif total_minutes <= 360:  # 6 hours
                return "6h"
            else:
                return "24h"
        elif unit == "hour" or unit == "hr":
            if num <= 1:
                return "1h"
            elif num <= 6:
                return "6h"
            elif num <= 24:
                return "24h"
            else:
                return "24h"  # Default to 24h for longer periods
        elif unit == "day":
            if num <= 7:
                return "7d"
            elif num <= 30:
                return "30d"
            else:
                return "30d"
        elif unit == "week":
            if num <= 4:
                return "7d"
            else:
                return "30d"
        elif unit == "month":
            if num <= 12:
                return "30d"
            else:
                return "1y"
        elif unit == "year":
            return "1y"
        else:
            return "24h"  # Default
    except Exception as e:
        logger.warning(f"Error parsing frequency '{frequency_str}': {e}, defaulting to 24h")
        return "24h"

class MarketDataService:
    """Market data service with database-driven network configuration"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    def get_price_change_coinpaprika(self, coin_id: str, interval: str = "24h", quote: str = "USD") -> Optional[Dict]:
        """
        Fetches current price + percent change for a coin from CoinPaprika.
        
        Args:
            coin_id: CoinPaprika coin ID (e.g., "btc-bitcoin", "eth-ethereum")
            interval: Time interval for percent change (e.g., "15m", "30m", "1h", "6h", "24h", "7d", "30d", "1y")
            quote: Quote currency (default: "USD")
        
        Returns:
            Dictionary with 'price' and 'percent_change', or None if failed
        """
        url = f"https://api.coinpaprika.com/v1/tickers/{coin_id}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            quotes = data.get("quotes", {})
            q = quotes.get(quote.upper())
            
            if not q:
                logger.warning(f"No quote data for {coin_id} in {quote}")
                return None
            
            percent_change_key = f"percent_change_{interval}"
            percent_change = q.get(percent_change_key)
            price = q.get("price")
            
            if price is None:
                logger.warning(f"No price data for {coin_id}")
                return None
            
            return {
                "price": float(price),
                "percent_change": float(percent_change) if percent_change is not None else None,
                "interval": interval
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"CoinPaprika API request failed for {coin_id}: {e}")
            return None
        except (KeyError, ValueError, TypeError) as e:
            logger.error(f"Failed to parse CoinPaprika response for {coin_id}: {e}")
            return None
    
    def search_coinpaprika_by_symbol(self, symbol: str) -> Optional[str]:
        """
        Search CoinPaprika for a coin ID by symbol.
        This is a simplified search - for production, you might want to cache results.
        
        Args:
            symbol: Token symbol (e.g., "BTC", "ETH", "USDT")
        
        Returns:
            CoinPaprika coin ID if found, None otherwise
        """
        # First check our static mapping
        coin_id = TOKEN_SYMBOL_TO_COINPAPRIKA_ID.get(symbol.upper())
        if coin_id:
            return coin_id
        
        # Try searching CoinPaprika API (limited to avoid rate limits)
        # For now, we'll rely on the static mapping and fallback to GeckoTerminal
        # In production, you might want to implement a more sophisticated search
        try:
            url = f"https://api.coinpaprika.com/v1/search?q={symbol.upper()}&c=currencies"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                items = data.get("currencies", [])
                if items:
                    # Return the first match (most relevant)
                    return items[0].get("id")
        except Exception as e:
            logger.debug(f"CoinPaprika search failed for {symbol}: {e}")
        
        return None
    
    async def get_price_for_bot_token(self, bot_id: int, token_address: str, frequency: Optional[str] = None):
        """
        Fetch token price using bot's network configuration from database.
        Uses frequency-based price change (CoinPaprika) or falls back to GeckoTerminal (24h).
        
        Args:
            bot_id: The bot ID to get network configuration from
            token_address: The token contract address
            frequency: Trading frequency string (e.g., "1 hour", "6 hour", "24 hour")
        
        Returns:
            Dictionary with 'usdPrice' and price change (key depends on source), or None if failed
        """
        try:
            # Get bot's network configuration from database
            result = await self.db.execute(
                select(Bot.chain_id, Bot.network_name, Bot.frequency).where(Bot.id == bot_id)
            )
            bot_data = result.first()
            
            if not bot_data:
                logger.error(f"Bot {bot_id} not found in database")
                return None
            
            chain_id = bot_data.chain_id
            bot_frequency = frequency or bot_data.frequency
            
            # Determine the appropriate interval based on frequency
            interval = frequency_to_coinpaprika_interval(bot_frequency) if bot_frequency else "24h"
            
            # Strategy: Prioritize based on interval and token identification
            # - If interval is NOT 24h AND we can identify token → Try CoinPaprika first (has frequency-based data)
            # - If interval is 24h OR we can't identify token → Try GeckoTerminal first (works with addresses)
            
            # Attempt to identify token by checking common token addresses
            token_symbol = self._get_token_symbol_from_address(token_address, chain_id)
            
            # If we have a non-24h interval and can identify the token, prioritize CoinPaprika
            if interval != "24h" and token_symbol:
                coin_id = self.search_coinpaprika_by_symbol(token_symbol)
                if coin_id:
                    logger.info(f"Using CoinPaprika for {token_symbol} ({token_address}) with {interval} interval")
                    price_data = self.get_price_change_coinpaprika(coin_id, interval)
                    if price_data:
                        # Convert to expected format
                        return {
                            "usdPrice": price_data["price"],
                            "24hChange": price_data["percent_change"],  # This will be the frequency-based change
                            "changeInterval": interval,
                            "source": "coinpaprika"
                        }
                    # If CoinPaprika failed, fall through to try GeckoTerminal
            
            # Try GeckoTerminal (works directly with addresses, but only has 24h data)
            price_data = self.get_current_price_gecko(token_address, chain_id, interval)
            if price_data:
                price_data["changeInterval"] = "24h"  # GeckoTerminal only provides 24h
                price_data["source"] = "geckoterminal"
                # If we needed a different interval, log a warning
                if interval != "24h":
                    logger.warning(
                        f"GeckoTerminal returned 24h data for {token_address}, but requested interval was {interval}. "
                        f"Consider using CoinPaprika for frequency-based intervals."
                    )
                return price_data
            
            # If GeckoTerminal failed and we haven't tried CoinPaprika yet, try it now
            if token_symbol:
                coin_id = self.search_coinpaprika_by_symbol(token_symbol)
                if coin_id:
                    logger.info(f"GeckoTerminal failed for {token_address}, trying CoinPaprika with coin_id: {coin_id}")
                    price_data = self.get_price_change_coinpaprika(coin_id, interval)
                    if price_data:
                        # Convert to expected format
                        return {
                            "usdPrice": price_data["price"],
                            "24hChange": price_data["percent_change"],  # This will be the frequency-based change
                            "changeInterval": interval,
                            "source": "coinpaprika"
                        }
            
            # Both sources failed - log and return None
            logger.warning(
                f"Failed to fetch price data for {token_address} on chain {chain_id} "
                f"from both GeckoTerminal and CoinPaprika"
            )
            return None
            
        except Exception as e:
            logger.error(f"Error fetching price for bot {bot_id}, token {token_address}: {e}")
            return None
    
    def _get_token_symbol_from_address(self, token_address: str, chain_id: int) -> Optional[str]:
        """
        Get token symbol from address using a mapping of common tokens.
        This is a simplified approach - in production, use a token registry API.
        
        Args:
            token_address: Token contract address
            chain_id: Chain ID
        
        Returns:
            Token symbol if found, None otherwise
        """
        # Common token address mappings by chain
        # Expanded mapping with tokens from all supported networks
        # All addresses stored in lowercase for case-insensitive matching
        common_tokens = {
            # Ethereum Mainnet
            1: {
                "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
                "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
                "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "WBTC",
                "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
                "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
                "0x514910771af9ca656af840dff83e8264ecf986ca": "LINK",
                "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": "UNI",
                "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ETH",  # Native ETH
            },
            # Polygon
            137: {
                "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": "USDT",
                "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": "USDC",
                "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6": "WBTC",
                "0x7ceb23fd6f88b48c8f58f96b81b6c2f8f2f8f8f8": "WETH",
                "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "MATIC",  # Native MATIC
            },
            # BSC
            56: {
                "0x55d398326f99059ff775485246999027b3197955": "USDT",
                "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": "USDC",
                "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c": "BTCB",
                "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": "WBNB",
                "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "BNB",  # Native BNB
            },
            # Arbitrum
            42161: {
                "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "USDT",
                "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": "USDC",
                "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f": "WBTC",
                "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": "WETH",
                "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": "DAI",
                "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ETH",  # Native ETH
            },
            # Avalanche
            43114: {
                "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7": "USDT",
                "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": "USDC",
                "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "AVAX",  # Native AVAX
            },
            # Optimism
            10: {
                "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": "USDT",
                "0x7f5c764cbc14f9669b88837ca1490cca17c31607": "USDC",
                "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ETH",  # Native ETH
            },
            # Base
            8453: {
                "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": "USDT",
                "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "USDC",
                "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ETH",  # Native ETH
            },
            # Monad Testnet
            10143: {
                "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "MON",  # Native MON
                "0xf817257fed379853cde0fa4f97ab987181b1e5ea": "USDC",
                "0x88b8e2161dedc77ef4ab7585569d2415a1c1055d": "USDT",
                "0xcf5a6076cfa32686c0df13abada2b40dec133f1d": "WBTC",
                "0x5387c85a4965769f6b0df430638a1388493486f1": "WSOL",  # This is the token that was failing!
            },
            # Solana (case-sensitive, so keep original case)
            900: {
                "So11111111111111111111111111111111111111112": "SOL",  # Native SOL
                "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "USDT",
                "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
            },
        }
        
        chain_tokens = common_tokens.get(chain_id, {})
        # Case-insensitive lookup for EVM chains (lowercase addresses)
        # Solana addresses are case-sensitive, so check both original and lowercase
        if chain_id == 900:  # Solana
            # Check exact match first (case-sensitive for Solana)
            if token_address in chain_tokens:
                return chain_tokens[token_address]
        else:
            # For EVM chains, normalize to lowercase
            token_address_lower = token_address.lower()
            if token_address_lower in chain_tokens:
                return chain_tokens[token_address_lower]
            # Also check original case as fallback
            if token_address in chain_tokens:
                return chain_tokens[token_address]
        
        return None
    
    def get_current_price_gecko(self, token_address: str, chain_id: int = 1, interval: str = "24h"):
        """
        Fetches token price and 24h change from GeckoTerminal's simple API.
        Note: GeckoTerminal only provides 24h change, so interval parameter is for compatibility.
        
        Args:
            token_address: The token contract address
            chain_id: The blockchain chain ID (will be converted to network string)
            interval: Time interval (for compatibility, but GeckoTerminal only supports 24h)
        
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
            # Add timeout and retry logic to prevent connection issues
            response = requests.get(
                url, 
                headers={"accept": "application/json"},
                timeout=10,  # 10 second timeout
            )
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
        except requests.exceptions.HTTPError as e:
            # Handle 404 and other HTTP errors gracefully
            if e.response.status_code == 404:
                logger.debug(f"Token {token_address} not found on GeckoTerminal for {network} (404)")
            else:
                logger.warning(f"GeckoTerminal API HTTP error for {token_address} on {network}: {e}")
            return None
        except requests.exceptions.RequestException as e:
            logger.warning(f"GeckoTerminal API request failed for {token_address} on {network}: {e}")
            return None
        except (KeyError, ValueError, TypeError) as e:
            logger.warning(f"Failed to parse GeckoTerminal response for {token_address} on {network}: {e}")
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
        