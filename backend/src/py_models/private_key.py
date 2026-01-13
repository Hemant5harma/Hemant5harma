from pydantic import BaseModel, validator
from typing import Optional, Literal

class PrivateKeyRequest(BaseModel):
    private_key: str
    key_type: Literal['eth', 'solana']
    
    @validator('private_key')
    def validate_private_key_format(cls, v):
        """Validate private key format - basic validation, specific validation done by encryption util"""
        if not v:
            raise ValueError('Private key cannot be empty')
        
        # Basic length check - will be validated more thoroughly by encryption util
        clean_key = v.strip()
        if len(clean_key) < 32:
            raise ValueError('Private key appears to be too short')
        
        return v

class PrivateKeyResponse(BaseModel):
    has_private_key: bool
    message: str

class PrivateKeyStatusResponse(BaseModel):
    eth_key: bool
    solana_key: bool  
    message: str

class PrivateKeyDeleteResponse(BaseModel):
    success: bool
    message: str 