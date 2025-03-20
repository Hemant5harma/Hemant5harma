from pydantic import BaseModel

class CoinCreate(BaseModel):
    token_address: str  # Address of the token
    amount: float       # Amount to trade
    threshold: float    # Price threshold for action

class CoinResponse(BaseModel):
    id: int
    bot_id: int
    token_address: str
    amount: float
    threshold: float

    class Config:
        from_attributes = True