from pydantic import BaseModel

class StrategyBase(BaseModel):
    amount: int
    interval: int

class StrategyCreate(StrategyBase):
    pass

class StrategyResponse(StrategyBase):
    tx_hash: str
    status: str

class TradeSignal(BaseModel):
    signal: str
    confidence: float
    current_price: float
    ma7: float
    ma30: float