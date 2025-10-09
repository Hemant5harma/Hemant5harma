import os
import json
import logging
import requests
from typing import Optional, Dict, Any
from datetime import datetime
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from eth_account import Account, messages
from sqlalchemy.ext.asyncio import AsyncSession
from src.utils.encryption import encryption_util
from src.database.queries import get_user_private_key_by_type

logger = logging.getLogger(__name__)

class DexIntegration:
    """Dynamic DEX integration service using 0x API - supports any chain/user per request"""
    
    def __init__(self):
        self.api_key = os.getenv("ZEROX_API_KEY")
        self.infura_api_key = os.getenv("INFURA_API_KEY")
        self.base_url = "https://api.0x.org"
        
        if not self.api_key:
            raise Exception("ZEROX_API_KEY not found in environment variables")
        if not self.infura_api_key:
            raise Exception("INFURA_API_KEY not found in environment variables")
        
        # Supported chains by 0x API (same as manual_trading.py)
        self.supported_chains = {
            1: {"name": "Ethereum", "rpc": f"https://mainnet.infura.io/v3/{self.infura_api_key}"},
            137: {"name": "Polygon", "rpc": f"https://polygon-mainnet.infura.io/v3/{self.infura_api_key}"},
            42161: {"name": "Arbitrum", "rpc": f"https://arbitrum-mainnet.infura.io/v3/{self.infura_api_key}"},
            43114: {"name": "Avalanche", "rpc": f"https://avalanche-mainnet.infura.io/v3/{self.infura_api_key}"},
            56: {"name": "BSC", "rpc": f"https://bsc-mainnet.infura.io/v3/{self.infura_api_key}"},
            8453: {"name": "Base", "rpc": f"https://base-mainnet.infura.io/v3/{self.infura_api_key}"},
            10: {"name": "Optimism", "rpc": f"https://optimism-mainnet.infura.io/v3/{self.infura_api_key}"},
            10143: {"name": "Monad Testnet", "rpc": "https://testnet-rpc.monad.xyz"},
        }
        
        # USDT token addresses for each supported chain (for DCA bot purchases)
        self.usdt_tokens = {
            1: "0xdac17f958d2ee523a2206206994597c13d831ec7",      # Ethereum USDT
            137: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",    # Polygon USDT
            42161: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",  # Arbitrum USDT
            43114: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",  # Avalanche USDT
            56: "0x55d398326f99059ff775485246999027b3197955",     # BSC USDT
            8453: "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2",   # Base USDT
            10: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",    # Optimism USDT
            10143: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",  # Monad Testnet USDT
        }
    
    async def _setup_for_request(self, chain_id: int, user_id: int, db: AsyncSession) -> tuple[Web3, Account, str]:
        """Setup Web3 and user account for a specific request"""
        if chain_id not in self.supported_chains:
            raise Exception(f"Chain {chain_id} not supported by 0x API")
        
        # Setup Web3 for this chain
        chain_info = self.supported_chains[chain_id]
        web3 = Web3(Web3.HTTPProvider(chain_info["rpc"]))
        web3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        
        if not web3.is_connected():
            raise Exception(f"Failed to connect to {chain_info['name']} network")
        
        # Setup user account - use ETH private key for EVM chains
        encrypted_key = await get_user_private_key_by_type(db, user_id, 'eth')
        if not encrypted_key:
            raise Exception("No ETH private key found for user. Please add your ETH private key in Settings.")
        
        private_key = encryption_util.decrypt_private_key(encrypted_key)
        account = Account.from_key(private_key)
        wallet_address = account.address
        
        logger.info(f"DEX Setup for {chain_info['name']} - User: {user_id} - Wallet: {wallet_address}")
        return web3, account, wallet_address
    
    def _normalize_token_address(self, token: str) -> str:
        """Normalize token address"""
        if token.upper() == "ETH":
            return "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        return Web3.to_checksum_address(token)
    
    async def get_quote(self, buy_token: str, sell_amount: int, chain_id: int, user_id: int, db: AsyncSession, sell_token: str = None) -> Dict[str, Any]:
        """
        Get quote for token swap - dynamic chain and user
        
        Args:
            buy_token: Token address to buy
            sell_amount: Amount to sell in wei
            chain_id: Chain ID for the trade
            user_id: User ID for wallet access
            db: Database session
            sell_token: Token to sell (defaults to USDT for bot trades)
        
        Returns:
            Dict containing quote data
        """
        try:
            web3, account, wallet_address = await self._setup_for_request(chain_id, user_id, db)
            
            # Default to USDT if no sell_token specified (for DCA bot purchases)
            if sell_token is None:
                sell_token = self.usdt_tokens.get(chain_id, "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
            
            sell_token = self._normalize_token_address(sell_token)
            buy_token = self._normalize_token_address(buy_token)
            
            # Use 0x API for quote
            url = f"{self.base_url}/swap/permit2/quote"
            params = {
                "chainId": chain_id,
                "sellToken": sell_token,
                "buyToken": buy_token,
                "sellAmount": str(sell_amount),
                "taker": wallet_address,
                "slippageBps": "100"  # 1% slippage
            }
            
            headers = {
                "0x-api-key": self.api_key,
                "0x-version": "v2"
            }
            
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            return {
                "sell_token": sell_token,
                "buy_token": buy_token,
                "sell_amount": str(sell_amount),
                "buy_amount": data.get("buyAmount", "0"),
                "price": data.get("price", "0"),
                "estimated_gas": data.get("gas", "0"),
                "gas_price": data.get("gasPrice", "0"),
                "chain_id": chain_id,
                "network_name": self.supported_chains[chain_id]["name"],
                "quote_data": data  # Store full quote for execution
            }
            
        except Exception as e:
            logger.error(f"DEX quote failed: {e}")
            raise Exception(f"DEX quote failed: {str(e)}")
    
    async def execute_trade(self, buy_token: str, sell_amount: int, chain_id: int, user_id: int, db: AsyncSession, sell_token: str = None) -> str:
        """
        Execute token swap trade - dynamic chain and user
        
        Args:
            buy_token: Token address to buy
            sell_amount: Amount to sell in wei
            chain_id: Chain ID for the trade
            user_id: User ID for wallet access
            db: Database session
            sell_token: Token to sell (defaults to USDT for bot trades)
        
        Returns:
            Transaction hash of the executed trade
        """
        try:
            web3, account, wallet_address = await self._setup_for_request(chain_id, user_id, db)
            
            # Default to USDT if no sell_token specified (for DCA bot purchases)
            if sell_token is None:
                sell_token = self.usdt_tokens.get(chain_id, "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
            
            sell_token = self._normalize_token_address(sell_token)
            buy_token = self._normalize_token_address(buy_token)
            
            # Get quote with transaction data
            url = f"{self.base_url}/swap/permit2/quote"
            params = {
                "chainId": chain_id,
                "sellToken": sell_token,
                "buyToken": buy_token,
                "sellAmount": str(sell_amount),
                "taker": wallet_address,
                "slippageBps": "100"  # 1% slippage
            }
            
            headers = {
                "0x-api-key": self.api_key,
                "0x-version": "v2"
            }
            
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            quote_data = response.json()
            
            # Execute the transaction
            tx_hash = self._execute_transaction(quote_data, web3, account, wallet_address)
            
            logger.info(f"DEX trade executed: {tx_hash}")
            return tx_hash
            
        except Exception as e:
            logger.error(f"DEX trade execution failed: {e}")
            raise Exception(f"DEX trade execution failed: {str(e)}")
    
    def _execute_transaction(self, quote_data: dict, web3: Web3, account: Account, wallet_address: str) -> str:
        """Execute the transaction from 0x quote data"""
        try:
            transaction = quote_data.get("transaction", {})
            
            # Handle Permit2 signature if needed
            if "permit2" in quote_data:
                signature = self._sign_permit2(quote_data["permit2"], account)
                # Append signature to transaction data
                tx_data = transaction.get("data", "0x")
                if signature:
                    sig_bytes = bytes.fromhex(signature[2:] if signature.startswith("0x") else signature)
                    sig_len = len(sig_bytes).to_bytes(32, byteorder='big')
                    tx_data += sig_len.hex() + sig_bytes.hex()
                transaction["data"] = tx_data
            
            # Build final transaction
            tx = {
                "chainId": web3.eth.chain_id,
                "from": wallet_address,
                "to": Web3.to_checksum_address(transaction["to"]),
                "data": transaction.get("data", "0x"),
                "value": int(transaction.get("value", 0)),
                "gas": int(transaction.get("gas", 250000)),
                "nonce": web3.eth.get_transaction_count(wallet_address)
            }
            
            # Add gas pricing (EIP-1559 vs legacy)
            if "maxFeePerGas" in transaction and "maxPriorityFeePerGas" in transaction:
                tx["maxFeePerGas"] = int(transaction["maxFeePerGas"])
                tx["maxPriorityFeePerGas"] = int(transaction["maxPriorityFeePerGas"])
                tx["type"] = "0x2"
            elif "gasPrice" in transaction:
                tx["gasPrice"] = int(transaction["gasPrice"])
            else:
                tx["gasPrice"] = web3.eth.gas_price
            
            # Sign and send
            signed_tx = account.sign_transaction(tx)
            tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            return tx_hash.hex()
            
        except Exception as e:
            logger.error(f"DEX transaction execution failed: {e}")
            raise Exception(f"DEX transaction execution failed: {str(e)}")
    
    def _sign_permit2(self, permit2_data: dict, account: Account) -> str:
        """Sign Permit2 EIP-712 message"""
        try:
            message = messages.encode_structured_data(permit2_data)
            signed = Account.sign_message(message, private_key=account.key)
            return signed.signature.hex()
        except Exception as e:
            logger.error(f"Permit2 signing failed: {e}")
            return ""
    
    async def get_transaction_status(self, tx_hash: str, chain_id: int) -> Dict[str, Any]:
        """Get transaction status using public RPC - no authentication needed"""
        try:
            if chain_id not in self.supported_chains:
                return {
                    "transaction_hash": tx_hash,
                    "status": "error",
                    "error": f"Unsupported chain ID: {chain_id}",
                    "chain_id": chain_id
                }
            
            # Setup Web3 connection for status checking (no auth needed)
            chain_info = self.supported_chains[chain_id]
            web3 = Web3(Web3.HTTPProvider(chain_info["rpc"]))
            web3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
            
            if not web3.is_connected():
                return {
                    "transaction_hash": tx_hash,
                    "status": "error",
                    "error": f"Failed to connect to {chain_info['name']} network",
                    "chain_id": chain_id
                }
            
            # First try to get receipt
            try:
                receipt = web3.eth.get_transaction_receipt(tx_hash)
                tx = web3.eth.get_transaction(tx_hash)
                
                return {
                    "transaction_hash": tx_hash,
                    "status": "success" if receipt.status == 1 else "failed",
                    "block_number": receipt.blockNumber,
                    "gas_used": receipt.gasUsed,
                    "gas_price": tx.gasPrice,
                    "chain_id": chain_id
                }
            except Exception:
                # Transaction not mined yet
                try:
                    web3.eth.get_transaction(tx_hash)
                    return {
                        "transaction_hash": tx_hash,
                        "status": "pending",
                        "chain_id": chain_id
                    }
                except Exception:
                    return {
                        "transaction_hash": tx_hash,
                        "status": "not_found",
                        "chain_id": chain_id
                    }
                    
        except Exception as e:
            return {
                "transaction_hash": tx_hash,
                "status": "error",
                "error": str(e),
                "chain_id": chain_id
            }
    
    def get_supported_chains(self) -> Dict[int, Dict[str, str]]:
        """Get supported chains"""
        return self.supported_chains

# Legacy compatibility - for existing code that expects the old pattern
class DexIntegrationLegacy:
    """Legacy wrapper for backward compatibility"""
    
    def __init__(self, chain_id: int = 10143, user_id: int = None, db: AsyncSession = None, rpc_url: str = None):
        self.chain_id = chain_id
        self.user_id = user_id
        self.db = db
        self.dex = DexIntegration()
    
    async def setup_account(self):
        """Legacy setup method - no-op in new system"""
        pass
    
    @classmethod
    async def create(cls, chain_id: int = 10143, user_id: int = None, db: AsyncSession = None, rpc_url: str = None):
        """Factory method for backward compatibility"""
        instance = cls(chain_id=chain_id, user_id=user_id, db=db, rpc_url=rpc_url)
        await instance.setup_account()
        return instance

    def get_0x_quote(self, buy_token: str, amount: int, chain_id: int = None):
        """Legacy quote method - converts to async"""
        import asyncio
        if not self.db or not self.user_id:
            raise Exception("Database session and user_id required for new system")
        
        actual_chain_id = chain_id if chain_id is not None else self.chain_id
        
        # Run async method in sync context
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(
            self.dex.get_quote(buy_token, amount, actual_chain_id, self.user_id, self.db)
        )

    def execute_trade(self, buy_token: str, amount: int, chain_id: int = None):
        """Legacy execute method - converts to async"""
        import asyncio
        if not self.db or not self.user_id:
            raise Exception("Database session and user_id required for new system")
        
        actual_chain_id = chain_id if chain_id is not None else self.chain_id
        
        # Run async method in sync context
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(
            self.dex.execute_trade(buy_token, amount, actual_chain_id, self.user_id, self.db)
        )