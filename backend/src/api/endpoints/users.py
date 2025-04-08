from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.queries import create_user, get_user_by_address
from src.py_models.user import UserCreate, UserResponse
from src.api.dependencies import get_db_session
from src.api.auth_utils import create_access_token, get_current_user
from web3 import Web3
from eth_account.messages import encode_defunct
from src.py_models.auth import AuthLoginRequest

router = APIRouter()

@router.post("/", response_model=UserResponse)
async def create_new_user(user: UserCreate, db: AsyncSession = Depends(get_db_session)):
    existing_user = await get_user_by_address(db, user.address)
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this address already exists")
    db_user = await create_user(db, user.address)
    return db_user

@router.post("/login")
async def generate_user_token(address: str, db: AsyncSession = Depends(get_db_session)):
    """
    Generates a JWT access token for an existing wallet address.
    """
    user = await get_user_by_address(db, address)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token = create_access_token(address=user.address)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/{address}", response_model=UserResponse)
async def get_user(address: str, db: AsyncSession = Depends(get_db_session)):
    user = await get_user_by_address(db, address)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/me")
async def read_users_me(authorization: str = Header(None), db: AsyncSession = Depends(get_db_session)):
    """
    Example endpoint requiring JWT in the `Authorization` header:
    Authorization: Bearer <JWT_TOKEN>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ")[1]
    current_user = await get_current_user(token, db)
    return {"address": current_user.address}

@router.post("/metamask_login")
async def metamask_login(auth_request: AuthLoginRequest, db: AsyncSession = Depends(get_db_session)):
    message_encoded = encode_defunct(text=auth_request.message)
    recovered_address = Web3().eth.account.recover_message(message_encoded, signature=auth_request.signature)
    if recovered_address.lower() != auth_request.address.lower():
        raise HTTPException(status_code=400, detail="Invalid signature")
    user = await get_user_by_address(db, auth_request.address)
    if not user:
        user = await create_user(db, auth_request.address)
    token = create_access_token(address=user.address)
    return {"access_token": token, "token_type": "bearer"}