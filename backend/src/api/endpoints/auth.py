from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from src.api.dependencies import get_db_session
from src.py_models.user import UserRegister, UserLogin, UserResponse
from src.database.queries import get_user_by_email, create_user_with_email
from src.api.auth_utils import create_access_token
from pydantic import ValidationError

# Password hashing context - Using Argon2 (no password length limit, more secure than bcrypt)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

router = APIRouter()

def hash_password(password: str) -> str:
    """
    Hash a password using Argon2.
    Argon2 has no password length limit and is more secure than bcrypt.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash using Argon2.
    """
    return pwd_context.verify(plain_password, hashed_password)

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db_session)):
    """
    Register a new user with email and password.
    """
    try:
        # Check if user already exists
        existing_user = await get_user_by_email(db, user_data.email.lower())
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash the password
        password_hash = hash_password(user_data.password)
        
        # Create the user
        user = await create_user_with_email(
            db=db,
            email=user_data.email.lower(),
            password_hash=password_hash,
            name=user_data.name
        )
        
        # Generate JWT token
        access_token = create_access_token(email=user.email)
        
        # Future: Send verification email (commented out for now)
        # await send_verification_email(user.email, user.id)
        
        return {
            "message": "Registration successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "email_verified": user.email_verified
            }
        }
    
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=dict)
async def email_login(login_data: UserLogin, db: AsyncSession = Depends(get_db_session)):
    """
    Login with email and password.
    """
    try:
        # Get user by email
        user = await get_user_by_email(db, login_data.email.lower())
        
        if not user or not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Generate JWT token
        access_token = create_access_token(email=user.email)
        
        return {
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "email_verified": user.email_verified
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

# ========================================
# WALLET AUTHENTICATION (COMMENTED OUT FOR FUTURE USE)
# ========================================
"""
from web3 import Web3
from eth_account.messages import encode_defunct
from src.py_models.auth import AuthLoginRequest, AuthLoginResponse
from src.database.queries import get_user_by_address, create_user

@router.post("/wallet_login", response_model=AuthLoginResponse)
async def wallet_login(auth_request: AuthLoginRequest, db: AsyncSession = Depends(get_db_session)):
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
"""

# ========================================
# EMAIL VERIFICATION (FOR FUTURE USE)
# ========================================
"""
import secrets
from datetime import datetime, timedelta

# Store verification tokens temporarily (in production, use Redis or database)
verification_tokens = {}

def generate_verification_token(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expiry = datetime.utcnow() + timedelta(hours=24)
    verification_tokens[token] = {"user_id": user_id, "expiry": expiry}
    return token

async def send_verification_email(email: str, user_id: int):
    token = generate_verification_token(user_id)
    verification_link = f"https://yourdomain.com/verify-email?token={token}"
    # Send email with verification link
    # Implementation depends on your email service (SendGrid, AWS SES, etc.)
    pass

@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db_session)):
    if token not in verification_tokens:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    token_data = verification_tokens[token]
    if datetime.utcnow() > token_data["expiry"]:
        del verification_tokens[token]
        raise HTTPException(status_code=400, detail="Token expired")
    
    user_id = token_data["user_id"]
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.email_verified = 1
    await db.commit()
    
    del verification_tokens[token]
    return {"message": "Email verified successfully"}
"""
