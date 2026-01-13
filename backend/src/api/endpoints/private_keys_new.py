"""
Private Keys / Wallets Management API
Treats each private key as a named wallet that can be used for trading
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel
from src.api.dependencies import get_db_session
from src.api.auth_utils import get_current_user
from src.database.models.models import User, PrivateKey
from src.utils.encryption import encryption_util
from eth_account import Account
from src.utils.solana_key_handler import SolanaKeyHandler
from solders.keypair import Keypair
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class PrivateKeyCreate(BaseModel):
    name: str
    private_key: str
    key_type: str  # "evm" or "solana"

class PrivateKeyUpdate(BaseModel):
    name: str

class PrivateKeyResponse(BaseModel):
    id: int
    name: str
    address: str
    key_type: str
    is_default: bool
    created_at: str
    
    class Config:
        from_attributes = True

def get_address_from_private_key(private_key: str, key_type: str) -> str:
    """Derive wallet address from private key"""
    try:
        if key_type == "solana":
            key_handler = SolanaKeyHandler()
            key_bytes = key_handler.parse_private_key(private_key)
            keypair = Keypair.from_bytes(key_bytes)
            return str(keypair.pubkey())
        else:  # EVM
            if not private_key.startswith('0x'):
                private_key = '0x' + private_key
            account = Account.from_key(private_key)
            return account.address
    except Exception as e:
        logger.error(f"Error deriving address: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid private key: {str(e)}")

@router.post("/", response_model=PrivateKeyResponse)
async def create_private_key(
    data: PrivateKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new named private key (wallet)"""
    try:
        # Validate key_type
        if data.key_type not in ["evm", "solana"]:
            raise HTTPException(status_code=400, detail="key_type must be 'evm' or 'solana'")
        
        # Derive address
        address = get_address_from_private_key(data.private_key, data.key_type)
        
        # Encrypt private key
        encrypted_key = encryption_util.encrypt_private_key(data.private_key)
        
        # Check if this is the first private key for this type
        result = await db.execute(
            select(PrivateKey).where(
                PrivateKey.user_id == current_user.id,
                PrivateKey.key_type == data.key_type
            )
        )
        existing = result.scalars().all()
        is_first = len(existing) == 0
        
        # Create new private key
        new_key = PrivateKey(
            user_id=current_user.id,
            name=data.name,
            encrypted_private_key=encrypted_key,
            key_type=data.key_type,
            address=address,
            is_default=1 if is_first else 0
        )
        
        db.add(new_key)
        await db.commit()
        await db.refresh(new_key)
        
        logger.info(f"Created private key '{data.name}' for user {current_user.address}")
        
        return PrivateKeyResponse(
            id=new_key.id,
            name=new_key.name,
            address=new_key.address,
            key_type=new_key.key_type,
            is_default=bool(new_key.is_default),
            created_at=new_key.created_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating private key: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[PrivateKeyResponse])
async def list_private_keys(
    key_type: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """List all private keys (wallets) for the user"""
    try:
        query = select(PrivateKey).where(PrivateKey.user_id == current_user.id)
        if key_type:
            query = query.where(PrivateKey.key_type == key_type)
        
        result = await db.execute(query.order_by(PrivateKey.created_at.desc()))
        keys = result.scalars().all()
        
        return [
            PrivateKeyResponse(
                id=key.id,
                name=key.name,
                address=key.address,
                key_type=key.key_type,
                is_default=bool(key.is_default),
                created_at=key.created_at.isoformat()
            )
            for key in keys
        ]
        
    except Exception as e:
        logger.error(f"Error listing private keys: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{key_id}", response_model=PrivateKeyResponse)
async def update_private_key(
    key_id: int,
    data: PrivateKeyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update private key name"""
    try:
        result = await db.execute(
            select(PrivateKey).where(
                PrivateKey.id == key_id,
                PrivateKey.user_id == current_user.id
            )
        )
        key = result.scalars().first()
        
        if not key:
            raise HTTPException(status_code=404, detail="Private key not found")
        
        key.name = data.name
        await db.commit()
        await db.refresh(key)
        
        return PrivateKeyResponse(
            id=key.id,
            name=key.name,
            address=key.address,
            key_type=key.key_type,
            is_default=bool(key.is_default),
            created_at=key.created_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating private key: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{key_id}")
async def delete_private_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a private key (wallet)"""
    try:
        result = await db.execute(
            select(PrivateKey).where(
                PrivateKey.id == key_id,
                PrivateKey.user_id == current_user.id
            )
        )
        key = result.scalars().first()
        
        if not key:
            raise HTTPException(status_code=404, detail="Private key not found")
        
        # Check if any bots are using this key
        from src.database.models.models import Bot
        result = await db.execute(
            select(Bot).where(Bot.private_key_id == key_id)
        )
        bots_using = result.scalars().all()
        
        if bots_using:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete. {len(bots_using)} bot(s) are using this wallet"
            )
        
        await db.delete(key)
        await db.commit()
        
        logger.info(f"Deleted private key {key_id} for user {current_user.address}")
        
        return {"message": "Private key deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting private key: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{key_id}/set-default")
async def set_default_private_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Set a private key as default for its type"""
    try:
        # Get the key
        result = await db.execute(
            select(PrivateKey).where(
                PrivateKey.id == key_id,
                PrivateKey.user_id == current_user.id
            )
        )
        key = result.scalars().first()
        
        if not key:
            raise HTTPException(status_code=404, detail="Private key not found")
        
        # Unset other defaults for this key_type
        result = await db.execute(
            select(PrivateKey).where(
                PrivateKey.user_id == current_user.id,
                PrivateKey.key_type == key.key_type,
                PrivateKey.id != key_id
            )
        )
        other_keys = result.scalars().all()
        for other_key in other_keys:
            other_key.is_default = 0
        
        # Set this as default
        key.is_default = 1
        await db.commit()
        
        return {"message": f"'{key.name}' set as default {key.key_type} wallet"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting default: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

