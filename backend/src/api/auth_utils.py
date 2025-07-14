import jwt
import time
from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.queries import get_user_by_address
from src.api.dependencies import get_db_session
from fastapi.security import OAuth2PasswordBearer


# You can store your secret key in a .env file
SECRET_KEY = "YOUR_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 360  # 1 hour

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")


def create_access_token(address: str, expires_delta: Optional[int] = None) -> str:
    """
    Creates a JWT token for the given user address, valid for `expires_delta` minutes.
    """
    if expires_delta is None:
        expires_delta = ACCESS_TOKEN_EXPIRE_MINUTES
    expire = time.time() + (expires_delta * 60)
    to_encode = {"sub": address, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db_session)
):
    """
    Decodes the JWT and retrieves the current user from database using the wallet address.
    """
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
