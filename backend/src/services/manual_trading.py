import os
import json
import logging
import requests
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from eth_account import Account, messages
from src.py_models.manual_trade import (
    QuoteRequest, QuoteResponse, ManualTradeRequest, 
    ManualTradeResponse, TokenInfo, WalletBalanceResponse, WalletBalanceRequest,
    NetworkInfo, SupportedNetworksResponse
)
from src.utils.encryption import encryption_util
from src.database.queries import get_user_private_key
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

class ManualTradingService:
    """Dynamic manual trading service using 0x API - supports any chain/user per request"""
    
    def __init__(self):
        self.api_key = os.getenv("ZEROX_API_KEY")
        self.infura_api_key = os.getenv("INFURA_API_KEY")
        self.base_url = "https://api.0x.org"
        
        if not self.api_key:
            raise Exception("ZEROX_API_KEY not found in environment variables")
        if not self.infura_api_key:
            raise Exception("INFURA_API_KEY not found in environment variables")
        
        # Supported chains by 0x API (including Monad testnet)
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
    
    def get_supported_networks(self) -> SupportedNetworksResponse:
        """Get supported networks"""
        networks = []
        for chain_id, info in self.supported_chains.items():
            networks.append(NetworkInfo(
                chain_id=chain_id,
                name=info["name"],
                rpc_url=info["rpc"],
                native_token="0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                is_testnet=(chain_id == 10143)  # Only Monad testnet is testnet
            ))
        return SupportedNetworksResponse(networks=networks)
    
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
        
        # Setup user account
        encrypted_key = await get_user_private_key(db, user_id)
        if not encrypted_key:
            raise Exception("No private key found for user")
        
        private_key = encryption_util.decrypt_private_key(encrypted_key)
        account = Account.from_key(private_key)
        wallet_address = account.address
        
        logger.info(f"Setup for {chain_info['name']} - User: {user_id} - Wallet: {wallet_address}")
        return web3, account, wallet_address
        
    def _normalize_token_address(self, token: str) -> str:
        """Normalize token address"""
        if token.upper() == "ETH":
            return "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        return Web3.to_checksum_address(token)
    
    async def get_quote(self, quote_request: QuoteRequest, user_id: int, db: AsyncSession) -> QuoteResponse:
        """Get quote using 0x API - dynamic chain and user"""
        try:
            chain_id = quote_request.chain_id
            web3, account, wallet_address = await self._setup_for_request(chain_id, user_id, db)
            
            sell_token = self._normalize_token_address(quote_request.sell_token)
            buy_token = self._normalize_token_address(quote_request.buy_token)
            
            # Use 0x API for quote
            url = f"{self.base_url}/swap/permit2/price"
            params = {
                "chainId": chain_id,
                "sellToken": sell_token,
                "buyToken": buy_token,
                "sellAmount": quote_request.sell_amount,
                "taker": wallet_address,
                "slippageBps": quote_request.slippage_bps or 100
            }
            
            headers = {
                "0x-api-key": self.api_key,
                "0x-version": "v2"
            }
            
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            return QuoteResponse(
                sell_token=sell_token,
                buy_token=buy_token,
                sell_amount=quote_request.sell_amount,
                buy_amount=data.get("buyAmount", "0"),
                price=data.get("price", "0"),
                estimated_gas=data.get("gas", "0"),
                gas_price=data.get("gasPrice", "0"),
                slippage_bps=quote_request.slippage_bps or 100,
                chain_id=chain_id,
                network_name=self.supported_chains[chain_id]["name"],
                expires_at=datetime.now() + timedelta(minutes=2)
            )
            
        except Exception as e:
            logger.error(f"Quote failed: {e}")
            raise Exception(f"Quote failed: {str(e)}")
    
    async def execute_trade(self, trade_request: ManualTradeRequest, user_id: int, db: AsyncSession) -> ManualTradeResponse:
        """Execute trade using 0x API - dynamic chain and user"""
        try:
            chain_id = trade_request.chain_id
            web3, account, wallet_address = await self._setup_for_request(chain_id, user_id, db)
            
            sell_token = self._normalize_token_address(trade_request.sell_token)
            buy_token = self._normalize_token_address(trade_request.buy_token)
            
            # Get quote with transaction data
            url = f"{self.base_url}/swap/permit2/quote"
            params = {
                "chainId": chain_id,
                "sellToken": sell_token,
                "buyToken": buy_token,
                "sellAmount": trade_request.sell_amount,
                "taker": wallet_address,
                "slippageBps": trade_request.slippage_bps or 100
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
            
            return ManualTradeResponse(
                transaction_hash=tx_hash,
                sell_token=sell_token,
                buy_token=buy_token,
                sell_amount=trade_request.sell_amount,
                buy_amount=quote_data.get("buyAmount", "0"),
                gas_used=quote_data.get("gas", "0"),
                gas_price=quote_data.get("gasPrice", "0"),
                status="pending",
                timestamp=datetime.now(),
                chain_id=chain_id,
                network_name=self.supported_chains[chain_id]["name"]
            )
            
        except Exception as e:
            logger.error(f"Trade execution failed: {e}")
            raise Exception(f"Trade execution failed: {str(e)}")
    
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
            
            # Add gas pricing
            if "gasPrice" in transaction:
                tx["gasPrice"] = int(transaction["gasPrice"])
            else:
                tx["gasPrice"] = web3.eth.gas_price
            
            # Sign and send
            signed_tx = account.sign_transaction(tx)
            tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            return tx_hash.hex()
            
        except Exception as e:
            logger.error(f"Transaction execution failed: {e}")
            raise Exception(f"Transaction execution failed: {str(e)}")
    
    def _sign_permit2(self, permit2_data: dict, account: Account) -> str:
        """Sign Permit2 EIP-712 message"""
        try:
            message = messages.encode_structured_data(permit2_data)
            signed = Account.sign_message(message, private_key=account.key)
            return signed.signature.hex()
        except Exception as e:
            logger.error(f"Permit2 signing failed: {e}")
            return ""
    
    async def get_transaction_status(self, tx_hash: str, chain_id: int, user_id: int, db: AsyncSession) -> Dict[str, Any]:
        """Get transaction status - dynamic chain"""
        try:
            web3, account, wallet_address = await self._setup_for_request(chain_id, user_id, db)
            
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
                "transaction_hash": "0x" + tx_hash,
                "status": "error",
                "error": str(e),
                "chain_id": chain_id
            }
    
    async def get_wallet_balances(self, balance_request: WalletBalanceRequest, user_id: int, db: AsyncSession) -> WalletBalanceResponse:
        """Get wallet balances - dynamic chain and user"""
        try:
            chain_id = balance_request.chain_id
            web3, account, wallet_address = await self._setup_for_request(chain_id, user_id, db)
            
            # Get native token balance
            native_balance = web3.eth.get_balance(wallet_address)
            
            # Get ERC20 token balances
            tokens = []
            if balance_request.tokens:
                for token_address in balance_request.tokens:
                    token_info = self._get_token_info(token_address, web3, wallet_address)
                    if token_info:
                        tokens.append(token_info)
            
            return WalletBalanceResponse(
                native_balance=str(native_balance),
                tokens=tokens,
                chain_id=chain_id,
                network_name=self.supported_chains[chain_id]["name"]
            )
            
        except Exception as e:
            logger.error(f"Balance check failed: {e}")
            raise Exception(f"Balance check failed: {str(e)}")
    
    def _get_token_info(self, token_address: str, web3: Web3, wallet_address: str) -> Optional[TokenInfo]:
        """Get ERC20 token info"""
        try:
            erc20_abi = [
                {"constant": True, "inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "type": "function"},
                {"constant": True, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "type": "function"},
                {"constant": True, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function"},
                {"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"}
            ]
            
            contract = web3.eth.contract(
                address=Web3.to_checksum_address(token_address),
                abi=erc20_abi
            )
            
            return TokenInfo(
                address=token_address,
                symbol=contract.functions.symbol().call(),
                name=contract.functions.name().call(),
                decimals=contract.functions.decimals().call(),
                balance=str(contract.functions.balanceOf(wallet_address).call())
            )
            
        except Exception as e:
            logger.error(f"Token info failed for {token_address}: {e}")
            return None