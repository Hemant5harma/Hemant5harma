from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import get_db_session
from src.api.auth_utils import get_current_user
from src.py_models.private_key import PrivateKeyRequest, PrivateKeyResponse, PrivateKeyDeleteResponse, PrivateKeyStatusResponse
from src.database.queries import (
    update_user_private_key_by_type, 
    get_user_private_key_by_type, 
    delete_user_private_key_by_type,
    get_user_private_key_status
)
from src.utils.encryption import encryption_util
from src.database.models.models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/save", response_model=PrivateKeyResponse)
async def save_private_key(
    request: PrivateKeyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Save user's private key in encrypted format for specific blockchain"""
    try:
        # Validate private key format based on type
        if request.key_type == 'eth':
            # ETH private key validation
            clean_key = request.private_key.strip().replace('0x', '')
            if len(clean_key) != 64 or not all(c in '0123456789abcdefABCDEF' for c in clean_key):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid ETH private key format. Must be 64 hex characters."
                )
        elif request.key_type == 'solana':
            # Basic Solana private key validation (can be Base58 or hex)
            clean_key = request.private_key.strip()
            if len(clean_key) < 32:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid Solana private key format."
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid key type. Must be 'eth' or 'solana'."
            )
        
        logger.info(f"Saving {request.key_type} private key for user {current_user.address}")
        
        # Encrypt the private key
        encrypted_key = encryption_util.encrypt_private_key(request.private_key)
        
        # Save to database
        await update_user_private_key_by_type(db, current_user.id, encrypted_key, request.key_type)
        
        logger.info(f"{request.key_type.upper()} private key saved for user {current_user.address}")
        
        return PrivateKeyResponse(
            has_private_key=True,
            message=f"{request.key_type.upper()} private key saved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save {request.key_type} private key for user {current_user.address}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save {request.key_type} private key"
        )

@router.get("/status", response_model=PrivateKeyStatusResponse)
async def get_private_key_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Check status of both ETH and Solana private keys"""
    try:
        status_dict = await get_user_private_key_status(db, current_user.id)
        
        return PrivateKeyStatusResponse(
            eth_key=status_dict['eth_key'],
            solana_key=status_dict['solana_key'],
            message="Private key status retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to check private key status for user {current_user.address}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check private key status"
        )

@router.delete("/delete/{key_type}", response_model=PrivateKeyDeleteResponse)
async def delete_private_key(
    key_type: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete user's private key for specific blockchain"""
    try:
        if key_type not in ['eth', 'solana']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid key type. Must be 'eth' or 'solana'."
            )
        
        success = await delete_user_private_key_by_type(db, current_user.id, key_type)
        
        if success:
            logger.info(f"{key_type.upper()} private key deleted for user {current_user.address}")
            return PrivateKeyDeleteResponse(
                success=True,
                message=f"{key_type.upper()} private key deleted successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete {key_type} private key for user {current_user.address}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete {key_type} private key"
        ) 