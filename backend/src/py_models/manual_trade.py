from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ManualTradeRequest(BaseModel):
    """Request model for manual trades"""
    sell_token: str = Field(..., description="Address of the token to sell (use 'ETH' or '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' for native token)")
    buy_token: str = Field(..., description="Address of the token to buy")
    sell_amount: str = Field(..., description="Amount to sell in wei or token units")
    slippage_bps: Optional[int] = Field(default=100, description="Slippage tolerance in basis points (100 = 1%)")
    chain_id: int = Field(..., description="Chain ID of the network (e.g., 1 for Ethereum, 137 for Polygon, 10143 for Monad Testnet)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "sell_token": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                "buy_token": "0xA0b86a33E6417aEd136F0b5915b3E6E80B2d2BbF",
                "sell_amount": "1000000000000000000",
                "slippage_bps": 100,
                "chain_id": 1
            }
        }

class QuoteRequest(BaseModel):
    """Request model for getting trade quotes"""
    sell_token: str = Field(..., description="Address of the token to sell")
    buy_token: str = Field(..., description="Address of the token to buy")
    sell_amount: str = Field(..., description="Amount to sell in wei or token units")
    slippage_bps: Optional[int] = Field(default=100, description="Slippage tolerance in basis points")
    chain_id: int = Field(..., description="Chain ID of the network (supports Ethereum, Polygon, Arbitrum, Avalanche, BSC, Base, Optimism, Monad Testnet)")

class QuoteResponse(BaseModel):
    """Response model for trade quotes"""
    sell_token: str
    buy_token: str
    sell_amount: str
    buy_amount: str
    price: str
    estimated_gas: str
    gas_price: str
    slippage_bps: int
    chain_id: int
    network_name: Optional[str] = None
    expires_at: Optional[datetime] = None

class ManualTradeResponse(BaseModel):
    """Response model for executed manual trades"""
    transaction_hash: str
    sell_token: str
    buy_token: str
    sell_amount: str
    buy_amount: str
    gas_used: Optional[str] = None
    gas_price: Optional[str] = None
    status: str = "pending"
    timestamp: datetime
    chain_id: int
    network_name: Optional[str] = None

class TokenInfo(BaseModel):
    """Token information model"""
    address: str
    symbol: str
    name: str
    decimals: int
    balance: Optional[str] = None

class WalletBalanceRequest(BaseModel):
    """Request model for wallet balance check"""
    chain_id: int = Field(..., description="Chain ID of the network")
    tokens: Optional[list[str]] = Field(default=None, description="List of token addresses to check (optional)")

class WalletBalanceResponse(BaseModel):
    """Response model for wallet balances"""
    native_balance: str
    tokens: list[TokenInfo]
    chain_id: int
    network_name: Optional[str] = None

class DirectWalletBalanceRequest(BaseModel):
    """Request model for direct balance check using a provided private key"""
    chain_id: int = Field(..., description="Chain ID of the network (EVM chain IDs or 900 for Solana)")
    private_key: str = Field(..., description="Private key string (hex for EVM; base58/JSON/hex for Solana)")
    tokens: Optional[list[str]] = Field(default=None, description="Optional token list to check balances")

class NetworkInfo(BaseModel):
    """Network information model"""
    chain_id: int
    name: str
    rpc_url: str
    native_token: str
    block_explorer: Optional[str] = None
    is_testnet: bool = False

class SupportedNetworksResponse(BaseModel):
    """Response model for supported networks"""
    networks: list[NetworkInfo]