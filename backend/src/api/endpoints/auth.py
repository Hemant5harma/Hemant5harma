from fastapi import APIRouter, Depends, HTTPException
from web3 import Web3
from eth_account.messages import encode_defunct
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import get_db_session
from src.py_models.auth import AuthLoginRequest, AuthLoginResponse
from src.database.queries import get_user_by_address, create_user

router = APIRouter()

@router.post("/login", response_model=AuthLoginResponse)
async def login(auth_request: AuthLoginRequest, db: AsyncSession = Depends(get_db_session)):
    message = auth_request.message
    signature = auth_request.signature
    address = auth_request.address

    # Verify the signature using Web3
    try:
        message_encoded = encode_defunct(text=message)
        recovered_address = Web3().eth.account.recover_message(message_encoded, signature=signature)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Signature verification failed: {str(e)}")

    if recovered_address.lower() != address.lower():
        raise HTTPException(status_code=400, detail="Invalid signature for the given address")

    # Create user if not already exists
    user = await get_user_by_address(db, address)
    if not user:
        user = await create_user(db, address)
    
    return AuthLoginResponse(message="Login successful", user_id=user.id, address=user.address)
