from pydantic import BaseModel, validator
from typing import Optional

class PrivateKeyRequest(BaseModel):
    private_key: str
    
    @validator('private_key')
    def validate_private_key_format(cls, v):
        """Validate private key format"""
        if not v:
            raise ValueError('Private key cannot be empty')
        
        # Remove 0x prefix if present
        clean_key = v[2:] if v.startswith('0x') else v
        
        # Check if it's exactly 64 hex characters
        if len(clean_key) != 64:
            raise ValueError('Private key must be exactly 64 hex characters')
        
        try:
            # Verify it's valid hex
            int(clean_key, 16)
        except ValueError:
            raise ValueError('Private key must contain only hex characters (0-9, a-f)')
        
        return v

class PrivateKeyResponse(BaseModel):
    has_private_key: bool
    message: str

class PrivateKeyDeleteResponse(BaseModel):
    success: bool
    message: str 