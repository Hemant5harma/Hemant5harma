from pydantic import BaseModel

class AuthLoginRequest(BaseModel):
    address: str  # Wallet address
    message: str  # Message that was signed
    signature: str  # Signature produced by the wallet

class AuthLoginResponse(BaseModel):
    message: str
    user_id: int
    address: str
