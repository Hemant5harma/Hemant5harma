from pydantic import BaseModel
from typing import List
from .coin import CoinCreate, CoinResponse

class BotCreate(BaseModel):
    name: str           # Bot name
    frequency: str      # Frequency of operation (e.g., "1 hour")
    coins: List[CoinCreate]  # List of coins managed by the bot

class BotResponse(BaseModel):
    id: int
    user_id: int
    name: str
    frequency: str
    status: str
    next_execution_time: str | None
    coins: List[CoinResponse] = []

    class Config:
        from_attributes = True