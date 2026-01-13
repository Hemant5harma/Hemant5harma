# DEPRECATED: This file has been moved to src/services/market_data.py
# This import is kept for backward compatibility only

from src.services.market_data import get_current_price_gecko

# Re-export the function for backward compatibility
__all__ = ['get_current_price_gecko']

print("Warning: dca.py is deprecated. Please use src.services.market_data instead.")
