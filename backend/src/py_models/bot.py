from pydantic import BaseModel, Field
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
    chain_id: int = Field(default=1, description="Chain ID of the network (e.g., 1 for Ethereum, 137 for Polygon)")
    rpc_url: Optional[str] = Field(default=None, description="Optional custom RPC URL for the network")
    network_name: Optional[str] = Field(default=None, description="Display name of the network")
    coins: List[CoinCreate]

class BotUpdate(BaseModel):
    name: Optional[str] = None
    frequency: Optional[str] = None
    status: Optional[str] = None
    chain_id: Optional[int] = None
    rpc_url: Optional[str] = None
    network_name: Optional[str] = None

class BotNetworkUpdate(BaseModel):
    chain_id: int = Field(..., description="New chain ID for the bot")
    rpc_url: Optional[str] = Field(default=None, description="New RPC URL for the bot")
    network_name: Optional[str] = Field(default=None, description="New network display name")

class BotResponse(BaseModel):
    id: int
    user_id: int
    name: str
    frequency: str
    status: str
    chain_id: int
    rpc_url: Optional[str] = None
    network_name: Optional[str] = None
    next_execution_time: Optional[datetime]
    coins: List[CoinResponse] = []
    performance: Optional[PerformanceResponse] = None

    class Config:
        from_attributes = True

class MultiChainBotStats(BaseModel):
    """Statistics for bots across different chains"""
    total_bots: int
    active_bots: int
    bots_by_chain: dict  # chain_id -> count
    total_volume: float
    total_trades: int