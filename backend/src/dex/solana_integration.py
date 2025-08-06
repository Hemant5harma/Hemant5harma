import os
import json
import logging
import asyncio
import base64
import base58
import requests
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from src.utils.encryption import encryption_util
from src.database.queries import get_user_private_key_by_type

# Import Solana libraries
from solana.rpc.async_api import AsyncClient
from solana.rpc.types import TxOpts
from solana.rpc.commitment import Confirmed, Finalized
from solders.keypair import Keypair
from solders.pubkey import Pubkey

logger = logging.getLogger(__name__)

class SolanaIntegration:
    """Dynamic Solana integration service using Jupiter API - matches DexIntegration interface"""
    
    def __init__(self):
        self.rpc_endpoint = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")
        self.jupiter_quote_url = "https://quote-api.jup.ag/v6/quote"
        self.jupiter_swap_url = "https://quote-api.jup.ag/v6/swap"
        
        # Common Solana token mints
        self.common_tokens = {
            "SOL": "So11111111111111111111111111111111111111112",  # Wrapped SOL
            "USDC": "EPjFWdd5AufqSSqeM2qN8dLHFJx9oenfaXqv5UTtRr6cj",
            "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            "RAY": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
            "SRM": "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"
        }
        
        logger.info("SolanaIntegration initialized with Jupiter API")
    
    async def _setup_for_request(self, chain_id: int, user_id: int, db: AsyncSession) -> tuple[AsyncClient, Keypair, str]:
        """Setup Solana client and user keypair for a specific request - mirrors DexIntegration pattern"""
        if chain_id != 900:  # Solana chain ID
            raise Exception(f"Chain {chain_id} not supported by Solana integration")
        
        # Setup Solana AsyncClient
        client = AsyncClient(self.rpc_endpoint)
        
        # Setup user keypair from encrypted Solana private key
        encrypted_key = await get_user_private_key_by_type(db, user_id, 'solana')
        if not encrypted_key:
            raise Exception("No Solana private key found for user. Please add your Solana private key in Settings.")
        
        private_key = encryption_util.decrypt_private_key(encrypted_key)
        
        # Handle Solana private key format with better error handling
        try:
            decoded_key = None
            
            # Try to decode as base58 (Solana format) - most common
            if len(private_key) == 88:  # Base58 encoded private key
                try:
                    decoded_key = base58.b58decode(private_key)
                    logger.info("Private key decoded as base58 format")
                except Exception as e:
                    logger.warning(f"Failed to decode as base58: {e}")
            
            # If base58 failed or not base58 length, try hex format
            if decoded_key is None:
                # Handle hex format
                if private_key.startswith('0x'):
                    private_key = private_key[2:]
                
                # Validate hex format
                try:
                    # Check if it's valid hex
                    int(private_key, 16)
                    # Pad to 64 characters if needed
                    private_key = private_key.zfill(64)
                    decoded_key = bytes.fromhex(private_key)
                    logger.info("Private key decoded as hex format")
                except ValueError as e:
                    raise ValueError(f"Invalid hex format in private key: {str(e)}")
            
            # Handle different key lengths
            if decoded_key is None:
                raise ValueError("Could not decode private key in any supported format")
            elif len(decoded_key) == 32:
                keypair = Keypair.from_seed(decoded_key)
                logger.info("Created keypair from 32-byte seed")
            elif len(decoded_key) == 64:
                keypair = Keypair.from_bytes(decoded_key)
                logger.info("Created keypair from 64-byte keypair bytes")
            else:
                raise ValueError(f"Invalid private key length: {len(decoded_key)} bytes (expected 32 or 64)")
                
        except Exception as e:
            logger.error(f"Private key processing failed: {e}")
            logger.error(f"Private key length: {len(private_key)}")
            logger.error(f"Private key starts with: {private_key[:10]}...")
            raise Exception(f"Failed to load Solana keypair: {str(e)}")
        
        wallet_pubkey = str(keypair.pubkey())
        
        logger.info(f"Solana Setup - User: {user_id} - Wallet: {wallet_pubkey}")
        return client, keypair, wallet_pubkey
    
    def _normalize_token_address(self, token: str) -> str:
        """Normalize token address for Solana - converts common symbols to mint addresses"""
        # Handle common token symbols
        if token.upper() in self.common_tokens:
            return self.common_tokens[token.upper()]
        
        # Handle SOL/Native token
        if token.upper() == "SOL" or token == "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee":
            return self.common_tokens["SOL"]
        
        # Return as-is if it looks like a valid Solana address
        try:
            Pubkey.from_string(token)
            return token
        except:
            raise Exception(f"Invalid Solana token address: {token}")
    
    async def get_quote(self, buy_token: str, sell_amount: int, chain_id: int, user_id: int, db: AsyncSession, sell_token: str = None) -> Dict[str, Any]:
        """
        Get quote for Solana token swap using Jupiter API - mirrors DexIntegration interface
        
        Args:
            buy_token: Token mint address to buy
            sell_amount: Amount to sell in smallest units (lamports for SOL)
            chain_id: Chain ID (must be 900 for Solana)
            user_id: User ID for wallet access
            db: Database session
            sell_token: Token to sell (defaults to SOL)
        
        Returns:
            Dict containing quote data compatible with DexIntegration format
        """
        client = None
        try:
            client, keypair, wallet_pubkey = await self._setup_for_request(chain_id, user_id, db)
            
            # Default to SOL if no sell_token specified
            if sell_token is None:
                sell_token = self.common_tokens["SOL"]
            
            sell_token = self._normalize_token_address(sell_token)
            buy_token = self._normalize_token_address(buy_token)
            
            # Use Jupiter API for quote
            params = {
                "inputMint": sell_token,
                "outputMint": buy_token,
                "amount": str(sell_amount),
                "slippageBps": "100",  # 1% slippage
                "onlyDirectRoutes": "false",
                "asLegacyTransaction": "false"
            }
            
            response = requests.get(self.jupiter_quote_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if 'outAmount' not in data:
                raise Exception(f"Invalid Jupiter quote response: {data}")
            
            # Format response to match DexIntegration interface
            return {
                "sell_token": sell_token,
                "buy_token": buy_token,
                "sell_amount": str(sell_amount),
                "buy_amount": data.get("outAmount", "0"),
                "price": str(float(data.get("outAmount", "0")) / float(sell_amount)),
                "estimated_gas": "5000",  # Solana compute units (estimate)
                "gas_price": "0.000005",  # Solana fees are much lower
                "chain_id": chain_id,
                "network_name": "Solana",
                "quote_data": data  # Store full quote for execution
            }
            
        except Exception as e:
            logger.error(f"Solana quote failed: {e}")
            raise Exception(f"Solana quote failed: {str(e)}")
        finally:
            if client:
                await client.close()
    
    async def execute_trade(self, buy_token: str, sell_amount: int, chain_id: int, user_id: int, db: AsyncSession, sell_token: str = None) -> str:
        """
        Execute Solana token swap trade - mirrors DexIntegration interface
        
        Args:
            buy_token: Token mint address to buy
            sell_amount: Amount to sell in smallest units
            chain_id: Chain ID (must be 900 for Solana)
            user_id: User ID for wallet access
            db: Database session
            sell_token: Token to sell (defaults to SOL)
        
        Returns:
            Transaction signature (equivalent to transaction hash)
        """
        client = None
        try:
            client, keypair, wallet_pubkey = await self._setup_for_request(chain_id, user_id, db)
            
            # Default to SOL if no sell_token specified
            if sell_token is None:
                sell_token = self.common_tokens["SOL"]
            
            sell_token = self._normalize_token_address(sell_token)
            buy_token = self._normalize_token_address(buy_token)
            
            # Step 1: Get quote
            logger.info(f"Getting Jupiter quote for {sell_amount} {sell_token} -> {buy_token}")
            params = {
                "inputMint": sell_token,
                "outputMint": buy_token,
                "amount": str(sell_amount),
                "slippageBps": "100",
                "onlyDirectRoutes": "false",
                "asLegacyTransaction": "false"
            }
            
            quote_response = requests.get(self.jupiter_quote_url, params=params, timeout=30)
            quote_response.raise_for_status()
            quote_data = quote_response.json()
            
            # Step 2: Build swap transaction
            logger.info("Building Jupiter swap transaction")
            swap_data = {
                "quoteResponse": quote_data,
                "userPublicKey": wallet_pubkey,
                "wrapAndUnwrapSol": True,
                "dynamicComputeUnitLimit": True,
                "prioritizationFeeLamports": "auto"
            }
            
            swap_response = requests.post(
                self.jupiter_swap_url,
                json=swap_data,
                timeout=30,
                headers={"Content-Type": "application/json"}
            )
            swap_response.raise_for_status()
            swap_result = swap_response.json()
            
            if "swapTransaction" not in swap_result:
                raise Exception(f"No transaction in Jupiter response: {swap_result}")
            
            # Step 3: Execute transaction
            logger.info("Executing Solana transaction")
            serialized_tx = swap_result["swapTransaction"]
            transaction_bytes = base64.b64decode(serialized_tx)

            # Deserialize VersionedTransaction
            from solders.transaction import VersionedTransaction
            from solders import message

            raw_transaction = VersionedTransaction.from_bytes(transaction_bytes)

            # Sign the transaction message
            signature = keypair.sign_message(message.to_bytes_versioned(raw_transaction.message))

            # Populate transaction with signature
            signed_transaction = VersionedTransaction.populate(raw_transaction.message, [signature])

            tx_opts = TxOpts(
                skip_preflight=False,
                preflight_commitment=Confirmed,
                max_retries=3
            )

            # Send the signed transaction
            send_response = await client.send_raw_transaction(
                bytes(signed_transaction),
                opts=tx_opts
            )
            
            tx_signature = str(send_response.value)
            logger.info(f"Solana transaction sent: {tx_signature}")
            
            # Step 4: Confirm transaction
            logger.info("Waiting for Solana confirmation...")
            confirmed = await self._confirm_transaction(client, tx_signature)
            
            if confirmed:
                logger.info("Solana swap completed successfully!")
                logger.info(f"Explorer: https://explorer.solana.com/tx/{tx_signature}")
            else:
                logger.warning("Solana transaction confirmation timeout")
            
            return tx_signature
            
        except Exception as e:
            logger.error(f"Solana trade execution failed: {e}")
            raise Exception(f"Solana trade execution failed: {str(e)}")
        finally:
            if client:
                await client.close()
    
    async def _confirm_transaction(self, client: AsyncClient, signature: str, max_retries: int = 30) -> bool:
        """Confirm Solana transaction"""
        try:
            from solders.signature import Signature
            sig = Signature.from_string(signature)
            
            for i in range(max_retries):
                if i % 5 == 0:
                    logger.info(f"Checking Solana confirmation... ({i+1}/{max_retries})")
                
                tx_response = await client.get_transaction(
                    sig,
                    encoding="json",
                    commitment=Confirmed,
                    max_supported_transaction_version=0
                )
                
                if tx_response.value is not None:
                    logger.info("Solana transaction confirmed!")
                    return True
                
                await asyncio.sleep(2)
            
            return False
            
        except Exception as e:
            logger.error(f"Solana confirmation check failed: {e}")
            return False 