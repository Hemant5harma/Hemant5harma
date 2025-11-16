import jwt
import time
from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.queries import get_user_by_email, get_user_by_address
from src.api.dependencies import get_db_session
from fastapi.security import OAuth2PasswordBearer


# You can store your secret key in a .env file
SECRET_KEY = "YOUR_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 360  # 6 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ========================================
# EMAIL/PASSWORD AUTHENTICATION
# ========================================

def create_access_token(email: str = None, address: str = None, expires_delta: Optional[int] = None) -> str:
    """
    Creates a JWT token for the given user email or address, valid for `expires_delta` minutes.
    For email auth, use email parameter. For wallet auth (future), use address parameter.
    """
    if expires_delta is None:
        expires_delta = ACCESS_TOKEN_EXPIRE_MINUTES
    expire = time.time() + (expires_delta * 60)
    
    # Use email if provided, otherwise use address (for backward compatibility)
    identifier = email if email else address
    if not identifier:
        raise ValueError("Either email or address must be provided")
    
    to_encode = {"sub": identifier, "exp": expire, "type": "email" if email else "address"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db_session)
):
    """
    Decodes the JWT and retrieves the current user from database.
    Supports both email-based and wallet-based authentication.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        identifier: str = payload.get("sub")
        auth_type: str = payload.get("type", "email")  # Default to email
        
        if identifier is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    # Try to get user by email first (primary method)
    if auth_type == "email" or "@" in identifier:
        user = await get_user_by_email(db, identifier)
    else:
        # Fallback to wallet address for backward compatibility
        user = await get_user_by_address(db, identifier)
    
    if not user:
        raise credentials_exception
    return user


# ========================================
# WALLET AUTHENTICATION (COMMENTED OUT FOR FUTURE USE)
# ========================================
"""
# Old wallet-based authentication functions (kept for reference)

def create_access_token_wallet(address: str, expires_delta: Optional[int] = None) -> str:
    if expires_delta is None:
        expires_delta = ACCESS_TOKEN_EXPIRE_MINUTES
    expire = time.time() + (expires_delta * 60)
    to_encode = {"sub": address, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user_wallet(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db_session)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        address: str = payload.get("sub")
        if address is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = await get_user_by_address(db, address)
    if not user:
        raise credentials_exception
    return user
"""
