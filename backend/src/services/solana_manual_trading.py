import os
import json
import logging
import asyncio
import base64
import base58
import requests
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from src.py_models.manual_trade import (
    QuoteRequest, QuoteResponse, ManualTradeRequest, 
    ManualTradeResponse, TokenInfo, WalletBalanceResponse, WalletBalanceRequest,
    NetworkInfo, SupportedNetworksResponse
)
from src.utils.encryption import encryption_util
from src.utils.solana_key_handler import SolanaKeyHandler
from src.utils.solana_transaction_checker import SolanaTransactionChecker
from src.database.queries import get_user_private_key_by_type

# Import Solana libraries
from solana.rpc.async_api import AsyncClient
from solana.rpc.types import TxOpts, TokenAccountOpts
from solana.rpc.commitment import Confirmed, Finalized
from solders.keypair import Keypair
from solders.pubkey import Pubkey

logger = logging.getLogger(__name__)

class SolanaManualTradingService:
    """Dynamic Solana manual trading service using Jupiter API - mirrors ManualTradingService interface"""
    
    def __init__(self):
        self.rpc_endpoint = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")
        self.jupiter_quote_url = "https://quote-api.jup.ag/v6/quote"
        self.jupiter_swap_url = "https://quote-api.jup.ag/v6/swap"
        
        # Solana chain configuration
        self.supported_chains = {
            900: {"name": "Solana", "rpc": self.rpc_endpoint}
        }
        
        # Common Solana token mints with metadata
        self.common_tokens = {
            "SOL": {
                "mint": "So11111111111111111111111111111111111111112",
                "symbol": "SOL",
                "name": "Solana",
                "decimals": 9
            },
            "USDC": {
                "mint": "EPjFWdd5AufqSSqeM2qN8dLHFJx9oenfaXqv5UTtRr6cj",
                "symbol": "USDC",
                "name": "USD Coin",
                "decimals": 6
            },
            "USDT": {
                "mint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
                "symbol": "USDT",
                "name": "Tether",
                "decimals": 6
            },
            "RAY": {
                "mint": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
                "symbol": "RAY",
                "name": "Raydium",
                "decimals": 6
            },
            "SRM": {
                "mint": "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt",
                "symbol": "SRM",
                "name": "Serum",
                "decimals": 6
            }
        }
        
        logger.info("SolanaManualTradingService initialized with Jupiter API")
    
    def get_supported_networks(self) -> SupportedNetworksResponse:
        """Get supported Solana networks - mirrors ManualTradingService interface"""
        networks = []
        for chain_id, info in self.supported_chains.items():
            networks.append(NetworkInfo(
                chain_id=chain_id,
                name=info["name"],
                rpc_url=info["rpc"],
                native_token="So11111111111111111111111111111111111111112",  # SOL mint
                block_explorer="https://explorer.solana.com",
                is_testnet=False
            ))
        return SupportedNetworksResponse(networks=networks)
    
    async def _setup_for_request(self, chain_id: int, user_id: int, db: AsyncSession) -> tuple[AsyncClient, Keypair, str]:
        """Setup Solana client and user keypair - mirrors ManualTradingService pattern"""
        if chain_id not in self.supported_chains:
            raise Exception(f"Chain {chain_id} not supported by Solana manual trading")
        
        # Setup Solana AsyncClient
        chain_info = self.supported_chains[chain_id]
        client = AsyncClient(chain_info["rpc"])
        
        # Setup user keypair from encrypted Solana private key
        encrypted_key = await get_user_private_key_by_type(db, user_id, 'solana')
        if not encrypted_key:
            raise Exception("No Solana private key found for user. Please add your Solana private key in Settings.")
        
        private_key = encryption_util.decrypt_private_key(encrypted_key)
        
        # Use the comprehensive key handler to support all formats
        try:
            keypair = SolanaKeyHandler.create_keypair_from_private_key(private_key)
            logger.info("Successfully created Solana keypair using SolanaKeyHandler")
        except Exception as e:
            logger.error(f"Failed to create Solana keypair: {e}")
            # Log key format detection for debugging
            key_validation = SolanaKeyHandler.validate_key_format(private_key)
            logger.error(f"Key validation: {key_validation}")
            raise Exception(f"Failed to load Solana keypair: {str(e)}")
        
        wallet_pubkey = str(keypair.pubkey())
        
        logger.info(f"Solana Setup for {chain_info['name']} - User: {user_id} - Wallet: {wallet_pubkey}")
        return client, keypair, wallet_pubkey
    
    def _normalize_token_address(self, token: str) -> str:
        """Normalize token address for Solana"""
        # Handle common token symbols
        for symbol, token_info in self.common_tokens.items():
            if token.upper() == symbol:
                return token_info["mint"]
        
        # Handle SOL/Native token variations
        if token.upper() == "SOL" or token == "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee":
            return self.common_tokens["SOL"]["mint"]
        
        # Validate Solana address format
        try:
            Pubkey.from_string(token)
            return token
        except:
            raise Exception(f"Invalid Solana token address: {token}")
    
    async def get_quote(self, quote_request: QuoteRequest, user_id: int, db: AsyncSession) -> QuoteResponse:
        """Get quote using Jupiter API - mirrors ManualTradingService interface"""
        client = None
        try:
            chain_id = quote_request.chain_id
            client, keypair, wallet_pubkey = await self._setup_for_request(chain_id, user_id, db)
            
            sell_token = self._normalize_token_address(quote_request.sell_token)
            buy_token = self._normalize_token_address(quote_request.buy_token)
            
            # Use Jupiter API for quote
            params = {
                "inputMint": sell_token,
                "outputMint": buy_token,
                "amount": quote_request.sell_amount,
                "slippageBps": str(quote_request.slippage_bps or 100),
                "onlyDirectRoutes": "false",
                "asLegacyTransaction": "false"
            }
            
            response = requests.get(self.jupiter_quote_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if 'outAmount' not in data:
                raise Exception(f"Invalid Jupiter quote response: {data}")
            
            # Calculate price
            price = "0"
            if float(quote_request.sell_amount) > 0:
                price = str(float(data.get("outAmount", "0")) / float(quote_request.sell_amount))
            
            # Set quote expiration (Jupiter quotes are valid for ~30 seconds)
            expires_at = datetime.now() + timedelta(seconds=30)
            
            return QuoteResponse(
                sell_token=sell_token,
                buy_token=buy_token,
                sell_amount=quote_request.sell_amount,
                buy_amount=data.get("outAmount", "0"),
                price=price,
                estimated_gas="5000",  # Solana compute units
                gas_price="0.000005",  # Solana fees in SOL
                slippage_bps=quote_request.slippage_bps or 100,
                chain_id=chain_id,
                network_name=self.supported_chains[chain_id]["name"],
                expires_at=expires_at
            )
            
        except Exception as e:
            logger.error(f"Solana quote failed: {e}")
            raise Exception(f"Solana quote failed: {str(e)}")
        finally:
            if client:
                await client.close()
    
    async def execute_trade(self, trade_request: ManualTradeRequest, user_id: int, db: AsyncSession) -> ManualTradeResponse:
        """Execute trade using Jupiter API - mirrors ManualTradingService interface"""
        client = None
        try:
            chain_id = trade_request.chain_id
            client, keypair, wallet_pubkey = await self._setup_for_request(chain_id, user_id, db)
            
            sell_token = self._normalize_token_address(trade_request.sell_token)
            buy_token = self._normalize_token_address(trade_request.buy_token)
            
            # Step 1: Get quote with transaction data
            logger.info(f"Getting Jupiter quote for {trade_request.sell_amount} {sell_token} -> {buy_token}")
            params = {
                "inputMint": sell_token,
                "outputMint": buy_token,
                "amount": trade_request.sell_amount,
                "slippageBps": str(trade_request.slippage_bps or 100),
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
            
            # Step 3: Execute the transaction
            tx_signature = await self._execute_transaction(swap_result, client, keypair)
            
            # Step 4: Check transaction status immediately after sending
            logger.info("Checking transaction status for accurate result...")
            tx_checker = SolanaTransactionChecker(self.rpc_endpoint)
            status_result = await tx_checker.check_transaction_status(tx_signature, timeout_seconds=90)
            
            # Determine final status
            final_status = "pending"  # Default
            actual_gas_used = "5000"  # Default estimate
            
            if status_result["status"] == "success":
                final_status = "success"
                actual_gas_used = str(status_result.get("compute_units_consumed", 5000))
                logger.info(f"Trade completed successfully: {tx_signature}")
            elif status_result["status"] == "failed":
                final_status = "failed"
                logger.error(f"Trade failed: {status_result.get('error', 'Unknown error')}")
            elif status_result["status"] == "timeout":
                final_status = "pending"  # Keep as pending for timeout
                logger.warning(f"Trade status check timeout - marking as pending: {tx_signature}")
            else:
                final_status = "pending"
                logger.info(f"Trade status unclear - marking as pending: {tx_signature}")
            
            return ManualTradeResponse(
                transaction_hash=tx_signature,  # Using signature as transaction_hash for compatibility
                sell_token=sell_token,
                buy_token=buy_token,
                sell_amount=trade_request.sell_amount,
                buy_amount=quote_data.get("outAmount", "0"),
                gas_used=actual_gas_used,
                gas_price="0.000005",  # Solana fees
                status=final_status,  # Now returns accurate status
                timestamp=datetime.now(),
                chain_id=chain_id,
                network_name=self.supported_chains[chain_id]["name"]
            )
            
        except Exception as e:
            logger.error(f"Solana trade execution failed: {e}")
            raise Exception(f"Solana trade execution failed: {str(e)}")
        finally:
            if client:
                await client.close()
    
    async def _execute_transaction(self, swap_result: dict, client: AsyncClient, keypair: Keypair) -> str:
        """Execute the Solana transaction"""
        try:
            # Decode, sign, and send transaction
            serialized_tx = swap_result["swapTransaction"]
            transaction_bytes = base64.b64decode(serialized_tx)

            from solders.transaction import VersionedTransaction
            from solders import message

            # Deserialize VersionedTransaction
            raw_transaction = VersionedTransaction.from_bytes(transaction_bytes)

            # Sign the transaction message
            signature = keypair.sign_message(message.to_bytes_versioned(raw_transaction.message))

            # Populate transaction with signature
            signed_transaction = VersionedTransaction.populate(raw_transaction.message, [signature])

            logger.info("Sending signed Solana transaction...")
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

            return tx_signature

        except Exception as e:
            logger.error(f"Transaction execution failed: {e}")
            raise Exception(f"Transaction execution failed: {str(e)}")
    
    async def get_transaction_status(self, tx_hash: str, chain_id: int) -> Dict[str, Any]:
        """Get transaction status using comprehensive checker - mirrors ManualTradingService interface"""
        try:
            if chain_id not in self.supported_chains:
                return {
                    "transaction_hash": tx_hash,
                    "status": "error",
                    "error": f"Unsupported chain ID: {chain_id}",
                    "chain_id": chain_id
                }
            
            # Use the comprehensive transaction checker
            chain_info = self.supported_chains[chain_id]
            tx_checker = SolanaTransactionChecker(chain_info["rpc"])
            
            # Get comprehensive status (with shorter timeout for status checks)
            status_result = await tx_checker.check_transaction_status(tx_hash, timeout_seconds=30)
            
            # Map to our standard format
            result = {
                "transaction_hash": tx_hash,
                "status": status_result["status"],
                "chain_id": chain_id
            }
            
            # Add additional fields if available
            if "block_number" in status_result:
                result["block_number"] = status_result["block_number"]
            
            if "compute_units_consumed" in status_result:
                result["gas_used"] = str(status_result["compute_units_consumed"])
            elif "fee" in status_result:
                result["gas_used"] = "5000"  # Default estimate
            else:
                result["gas_used"] = "5000"  # Default estimate
            
            if "error" in status_result:
                result["error"] = status_result["error"]
            
            if "block_time" in status_result:
                result["block_time"] = status_result["block_time"]
            
            if "fee" in status_result:
                result["fee"] = status_result["fee"]
            
            logger.info(f"Transaction status for {tx_hash}: {result['status']}")
            return result
                
        except Exception as e:
            logger.error(f"Solana transaction status error for {tx_hash}: {e}")
            return {
                "transaction_hash": tx_hash,
                "status": "error",
                "error": str(e),
                "chain_id": chain_id
            }
    
    async def get_wallet_balances(self, balance_request: WalletBalanceRequest, user_id: int, db: AsyncSession) -> WalletBalanceResponse:
        """Get wallet balances for Solana - mirrors ManualTradingService interface"""
        client = None
        try:
            chain_id = balance_request.chain_id
            client, keypair, wallet_pubkey = await self._setup_for_request(chain_id, user_id, db)
            
            # Get SOL balance
            balance_response = await client.get_balance(keypair.pubkey())
            native_balance = str(balance_response.value)  # SOL balance in lamports
            
            # Get SPL token balances
            tokens = []
            if balance_request.tokens:
                for token_mint in balance_request.tokens:
                    # Skip SOL mint here; native SOL is returned separately
                    if token_mint == self.common_tokens["SOL"]:
                        continue
                    token_info = await self._get_spl_token_info(token_mint, client, keypair.pubkey())
                    if token_info:
                        tokens.append(token_info)
            
            return WalletBalanceResponse(
                native_balance=native_balance,
                tokens=tokens,
                chain_id=chain_id,
                network_name=self.supported_chains[chain_id]["name"]
            )
            
        except Exception as e:
            logger.error(f"Solana balance check failed: {e}")
            raise Exception(f"Solana balance check failed: {str(e)}")
        finally:
            if client:
                await client.close()
    
    async def _get_spl_token_info(self, token_mint: str, client: AsyncClient, wallet_pubkey: Pubkey) -> Optional[TokenInfo]:
        """Get SPL token information by querying token accounts and summing balances"""
        try:
            mint_pk = Pubkey.from_string(token_mint)

            # Find token accounts (jsonParsed to read balances directly)
            accounts_resp = await client.get_token_accounts_by_owner(
                owner=wallet_pubkey,
                opts=TokenAccountOpts(mint=mint_pk, encoding="jsonParsed")
            )
            accounts = getattr(accounts_resp, 'value', None) or []

            total = 0
            for acc in accounts:
                try:
                    # acc is dict with keys 'pubkey' and 'account'
                    parsed = acc.get('account', {}).get('data', {}).get('parsed', {})
                    info = parsed.get('info', {})
                    token_amount = info.get('tokenAmount', {})
                    amt_str = token_amount.get('amount', '0')
                    total += int(amt_str)
                except Exception as e:
                    logger.debug(f"Failed parsing token account: {e}")
                    continue
            total_amount = str(total)

            token_data = self._get_token_metadata(token_mint)
            return TokenInfo(
                address=token_mint,
                symbol=token_data.get("symbol", "UNKNOWN"),
                name=token_data.get("name", "Unknown Token"),
                decimals=token_data.get("decimals", 9),
                balance=total_amount
            )
        except Exception as e:
            logger.error(f"SPL token info failed for {token_mint}: {e}")
            return None
    
    def _get_token_metadata(self, token_mint: str) -> dict:
        """Get token metadata from common tokens list"""
        for symbol, token_info in self.common_tokens.items():
            if token_info["mint"] == token_mint:
                return token_info
        
        # Default metadata for unknown tokens
        return {
            "symbol": "UNKNOWN",
            "name": "Unknown Token",
            "decimals": 9
        } 