from pydantic import BaseModel
from datetime import datetime

class TradeResponse(BaseModel):
    id: int
    bot_id: int
    coin_id: int
    trade_time: datetime
    trade_price: float
    token_address: str
    amount: float

    class Config:
        from_attributes = True