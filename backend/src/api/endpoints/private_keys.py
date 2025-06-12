from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import get_db_session
from src.api.auth_utils import get_current_user
from src.py_models.private_key import PrivateKeyRequest, PrivateKeyResponse, PrivateKeyDeleteResponse
from src.database.queries import update_user_private_key, get_user_private_key, delete_user_private_key
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
    """Save user's private key in encrypted format"""
    try:
        # Validate private key format
        if not encryption_util.validate_private_key(request.private_key):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid private key format. Must be 64 hex characters."
            )
        
        # Encrypt the private key
        encrypted_key = encryption_util.encrypt_private_key(request.private_key)
        
        # Save to database
        await update_user_private_key(db, current_user.id, encrypted_key)
        
        logger.info(f"Private key saved for user {current_user.address}")
        
        return PrivateKeyResponse(
            has_private_key=True,
            message="Private key saved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save private key for user {current_user.address}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save private key"
        )

@router.get("/status", response_model=PrivateKeyResponse)
async def get_private_key_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Check if user has a private key saved"""
    try:
        encrypted_key = await get_user_private_key(db, current_user.id)
        has_key = encrypted_key is not None
        
        return PrivateKeyResponse(
            has_private_key=has_key,
            message="Private key found" if has_key else "No private key saved"
        )
        
    except Exception as e:
        logger.error(f"Failed to check private key status for user {current_user.address}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check private key status"
        )

@router.delete("/delete", response_model=PrivateKeyDeleteResponse)
async def delete_private_key(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete user's private key"""
    try:
        success = await delete_user_private_key(db, current_user.id)
        
        if success:
            logger.info(f"Private key deleted for user {current_user.address}")
            return PrivateKeyDeleteResponse(
                success=True,
                message="Private key deleted successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete private key for user {current_user.address}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete private key"
        ) 