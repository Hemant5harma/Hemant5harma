from pydantic import BaseModel
from typing import Optional, Dict, Any

class CoinCreate(BaseModel):
    token_address: str  # Address of the token
    amount: float       # Amount to trade
    threshold: float    # Price threshold for action (backward compatibility)
    condition_type: Optional[str] = "price_drop"  # Type of condition
    condition_params: Optional[Dict[str, Any]] = None  # Condition-specific parameters
    logic_operator: Optional[str] = "AND"  # Logic operator for multiple conditions

    def __init__(self, **data):
        super().__init__(**data)
        # If condition_params is not provided, use threshold for backward compatibility
        if self.condition_params is None:
            if self.condition_type == "price_drop":
                self.condition_params = {"threshold": self.threshold}
            else:
                self.condition_params = {"threshold": self.threshold}

class CoinResponse(BaseModel):
    id: int
    bot_id: int
    token_address: str
    amount: float
    threshold: float  # Keep for backward compatibility
    condition_type: str
    condition_params: Dict[str, Any]
    logic_operator: Optional[str]

    class Config:
        from_attributes = True