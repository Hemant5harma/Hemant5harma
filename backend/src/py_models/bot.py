from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .coin import CoinCreate, CoinResponse

class PerformanceResponse(BaseModel):
    total_trades: int
    total_volume: float
    apy: float
    three_month_perf: float
    six_month_perf: float
    total_perf: float

class BotCreate(BaseModel):
    name: str
    frequency: str
    coins: List[CoinCreate]

class BotResponse(BaseModel):
    id: int
    user_id: int
    name: str
    frequency: str
    status: str
    next_execution_time: Optional[datetime]
    coins: List[CoinResponse] = []
    performance: Optional[PerformanceResponse] = None  # Added field

    class Config:
        from_attributes = True