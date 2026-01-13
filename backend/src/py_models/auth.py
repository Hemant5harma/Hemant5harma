from pydantic import BaseModel

class AuthLoginRequest(BaseModel):
    address: str  # Wallet address
    message: str  # Message that was signed
    signature: str  # Signature produced by the wallet

class SolanaAuthLoginRequest(BaseModel):
    address: str  # Solana wallet address (Base58)
    message: str  # Message that was signed
    signature: str  # Signature produced by the Solana wallet (hex string)

class AuthLoginResponse(BaseModel):
    message: str
    user_id: int
    address: str
