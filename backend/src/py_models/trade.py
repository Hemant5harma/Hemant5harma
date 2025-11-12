from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TradeResponse(BaseModel):
    id: int
    bot_id: int
    coin_id: int
    trade_time: datetime
    trade_price: float
    token_address: str
    amount: float
    transaction_hash: str
    chain_id: Optional[int] = None
    network_name: Optional[str] = None
    # Optional fee information (computed from transaction status)
    fee_native: Optional[float] = None
    fee_currency: Optional[str] = None

    class Config:
        from_attributes = True