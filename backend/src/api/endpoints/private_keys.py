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
    balance: str = "0"  # Balance will be fetched separately
    
    class Config:
        from_attributes = True

def get_address_from_private_key(private_key: str, key_type: str) -> str:
    """Derive wallet address from private key"""
    try:
        if key_type == "solana":
            # SolanaKeyHandler accepts all formats: base58, hex, JSON array, etc.
            keypair = SolanaKeyHandler.create_keypair_from_private_key(private_key)
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
    chain_id: int = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """List all private keys (wallets) for the user with balances"""
    try:
        from src.utils.encryption import encryption_util
        from src.services.manual_trading import ManualTradingService
        from src.services.solana_manual_trading import SolanaManualTradingService
        from web3 import Web3
        import asyncio
        
        query = select(PrivateKey).where(PrivateKey.user_id == current_user.id)
        if key_type:
            query = query.where(PrivateKey.key_type == key_type)
        
        result = await db.execute(query.order_by(PrivateKey.created_at.desc()))
        keys = result.scalars().all()
        
        responses = []
        for key in keys:
            balance = "0"
            
            # Fetch balance if chain_id is provided
            if chain_id:
                try:
                    if key.key_type == "solana" and chain_id == 900:
                        # Solana balance - Fetch USDT (SPL token) balance using wallet address (no decryption needed)
                        from solana.rpc.async_api import AsyncClient
                        from solders.pubkey import Pubkey
                        
                        try:
                            client = AsyncClient("https://api.mainnet-beta.solana.com")
                            
                            # USDT mint address on Solana
                            usdt_mint = Pubkey.from_string("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB")
                            
                            # Compute Associated Token Account (ATA) for this wallet + USDT mint
                            # SPL Token Program ID
                            TOKEN_PROGRAM_ID = Pubkey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
                            # Associated Token Program ID
                            ASSOCIATED_TOKEN_PROGRAM_ID = Pubkey.from_string("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
                            owner_pk = Pubkey.from_string(key.address)
                            seeds = [bytes(owner_pk), bytes(TOKEN_PROGRAM_ID), bytes(usdt_mint)]
                            ata, _ = Pubkey.find_program_address(seeds, ASSOCIATED_TOKEN_PROGRAM_ID)

                            # Fetch token account balance for ATA
                            balance_response = await client.get_token_account_balance(ata)
                            value = getattr(balance_response, "value", None) or getattr(balance_response, "result", {}).get("value", None) if isinstance(balance_response, dict) else None

                            if value:
                                amount = getattr(value, "amount", None) if not isinstance(value, dict) else value.get("amount", "0")
                                decimals = getattr(value, "decimals", 6) if not isinstance(value, dict) else value.get("decimals", 6)
                                usdt_balance = int(amount) / (10 ** int(decimals))
                                balance = f"{usdt_balance:.4f} USDT"
                            else:
                                balance = "0.0000 USDT"
                            
                            await client.close()
                        except Exception as e:
                            logger.error(f"Error fetching Solana balance: {e}")
                            balance = "0 USDT"
                    
                    elif key.key_type == "evm" and chain_id != 900:
                        # EVM balance - get PURCHASE TOKEN balance (USDT for most, MON for Monad) using wallet address
                        # Reuse the same RPC configuration as manual trading service
                        try:
                            from src.services.manual_trading import ManualTradingService
                            evm_service = ManualTradingService()
                            rpc_urls = {cid: info["rpc"] for cid, info in evm_service.supported_chains.items()}
                        except Exception:
                            # Fallback RPC list
                            rpc_urls = {
                                1: "https://eth.llamarpc.com",
                                137: "https://polygon-rpc.com",
                                56: "https://bsc-dataseed.binance.org",
                                42161: "https://arb1.arbitrum.io/rpc",
                                8453: "https://mainnet.base.org",
                                10: "https://mainnet.optimism.io",
                                43114: "https://api.avax.network/ext/bc/C/rpc",
                                10143: "https://testnet-rpc.monad.xyz",  # Monad Testnet
                            }
                        
                        # USDT token addresses for each chain
                        usdt_addresses = {
                            1: "0xdac17f958d2ee523a2206206994597c13d831ec7",      # Ethereum
                            137: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",    # Polygon
                            56: "0x55d398326f99059ff775485246999027b3197955",     # BSC
                            42161: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",  # Arbitrum
                            8453: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",   # Base (USDC as fallback)
                            10: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",    # Optimism
                            43114: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", # Avalanche
                        }
                        
                        rpc_url = rpc_urls.get(chain_id)
                        if rpc_url:
                            try:
                                w3 = Web3(Web3.HTTPProvider(rpc_url))
                                wallet_address = w3.to_checksum_address(key.address)
                                
                                # Monad Testnet uses MON (native token) as purchase token
                                if chain_id == 10143:
                                    balance_wei = w3.eth.get_balance(wallet_address)
                                    balance_token = w3.from_wei(balance_wei, 'ether')
                                    balance = f"{float(balance_token):.4f} MON"
                                else:
                                    # Fetch USDT balance for other chains
                                    usdt_address = usdt_addresses.get(chain_id)
                                    if usdt_address:
                                        # ERC20 ABI for balanceOf
                                        erc20_abi = [
                                            {
                                                "constant": True,
                                                "inputs": [{"name": "_owner", "type": "address"}],
                                                "name": "balanceOf",
                                                "outputs": [{"name": "balance", "type": "uint256"}],
                                                "type": "function"
                                            },
                                            {
                                                "constant": True,
                                                "inputs": [],
                                                "name": "decimals",
                                                "outputs": [{"name": "", "type": "uint8"}],
                                                "type": "function"
                                            }
                                        ]
                                        
                                        # Create contract instance
                                        usdt_contract = w3.eth.contract(
                                            address=w3.to_checksum_address(usdt_address),
                                            abi=erc20_abi
                                        )
                                        
                                        # Get balance and decimals
                                        balance_raw = usdt_contract.functions.balanceOf(wallet_address).call()
                                        try:
                                            decimals = usdt_contract.functions.decimals().call()
                                        except:
                                            decimals = 6  # USDT typically has 6 decimals
                                        
                                        balance_token = balance_raw / (10 ** decimals)
                                        
                                        # Use appropriate symbol
                                        symbol = "USDC" if chain_id == 8453 else "USDT"
                                        balance = f"{float(balance_token):.4f} {symbol}"
                                    else:
                                        balance = "0 USDT"
                            except Exception as e:
                                logger.error(f"Error fetching token balance for chain {chain_id}: {e}")
                                balance = "0 USDT"
                except Exception as e:
                    logger.error(f"Error fetching balance for key {key.id}: {e}")
                    balance = "0"
            
            responses.append(
            PrivateKeyResponse(
                id=key.id,
                name=key.name,
                address=key.address,
                key_type=key.key_type,
                is_default=bool(key.is_default),
                    created_at=key.created_at.isoformat(),
                    balance=balance
                )
            )
        
        return responses
        
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

class PrivateKeyStatusResponse(BaseModel):
    has_evm_keys: bool
    has_solana_keys: bool
    evm_count: int
    solana_count: int

@router.get("/status", response_model=PrivateKeyStatusResponse)
async def get_private_key_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get status of user's private keys"""
    try:
        result = await db.execute(
            select(PrivateKey).where(PrivateKey.user_id == current_user.id)
        )
        keys = result.scalars().all()
        
        evm_keys = [k for k in keys if k.key_type == "evm"]
        solana_keys = [k for k in keys if k.key_type == "solana"]
        
        return PrivateKeyStatusResponse(
            has_evm_keys=len(evm_keys) > 0,
            has_solana_keys=len(solana_keys) > 0,
            evm_count=len(evm_keys),
            solana_count=len(solana_keys)
        )
        
    except Exception as e:
        logger.error(f"Error getting private key status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

