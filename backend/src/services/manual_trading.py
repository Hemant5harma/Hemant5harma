import os
import json
import logging
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

logger = logging.getLogger(__name__)

class ManualTradingService:
    """Manual trading service with multi-chain support"""
    
    def __init__(self, chain_id: int = None, rpc_url: str = None):
        # Load default configuration
        self.api_key = os.getenv("ZEROX_API_KEY")
        self.private_key = os.getenv("PRIVATE_KEY")
        self.base_url = "https://api.0x.org"
        
        # If chain_id and rpc_url are provided, use them; otherwise use defaults
        if chain_id and rpc_url:
            self._setup_network(chain_id, rpc_url)
        else:
            # Default fallback to environment or Ethereum
            self.chain_id = int(os.getenv("DEFAULT_CHAIN_ID", "1"))  # Default to Ethereum
            self.rpc_url = os.getenv("RPC_URL", "https://ethereum.publicnode.com")
            self._setup_network(self.chain_id, self.rpc_url)
        
        # Common token addresses by chain ID
        self.common_tokens_by_chain = {
            1: {  # Ethereum
                "ETH": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                "WETH": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                "USDC": "0xA0b86a33E6417aEd136F0b5915b3E6E80B2d2BbF",
                "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                "DAI": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            },
            137: {  # Polygon
                "MATIC": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                "WMATIC": "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
                "USDC": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
                "USDT": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
                "DAI": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
            },
            42161: {  # Arbitrum
                "ETH": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                "WETH": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
                "USDC": "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
                "USDT": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                "DAI": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
            },
            10143: {  # Monad Testnet
                "MON": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                "WETH": "0x4200000000000000000000000000000000000006",
                "USDC": "0xA0b86a33E6417aEd136F0b5915b3E6E80B2d2BbF",
                "USDT": "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
            }
        }
        
    def _setup_network(self, chain_id: int, rpc_url: str):
        """Setup network connection"""
        self.chain_id = chain_id
        self.rpc_url = rpc_url
        self.native_token = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        self.permit2_address = Web3.to_checksum_address("0x000000000022D473030F116dDEE9F6B43aC78BA3")
        
        # Setup Web3 connection
        self.web3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.web3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        
        if not self.web3.is_connected():
            raise Exception(f"Failed to connect to network {chain_id} at {rpc_url}")
            
        self.account = Account.from_key(self.private_key)
        self.wallet_address = self.account.address
        
    @classmethod
    def create_for_network(cls, chain_id: int, rpc_url: str):
        """Factory method to create service for specific network"""
        return cls(chain_id=chain_id, rpc_url=rpc_url)
    
    def get_network_info(self) -> NetworkInfo:
        """Get current network information"""
        network_names = {
            1: "Ethereum Mainnet",
            137: "Polygon",
            42161: "Arbitrum One",
            10143: "Monad Testnet",
            5: "Goerli Testnet",
            11155111: "Sepolia Testnet"
        }
        
        return NetworkInfo(
            chain_id=self.chain_id,
            name=network_names.get(self.chain_id, f"Chain {self.chain_id}"),
            rpc_url=self.rpc_url,
            native_token=self.native_token,
            is_testnet=self.chain_id in [5, 11155111, 10143]
        )
        
    def get_supported_networks(self) -> SupportedNetworksResponse:
        """Get list of supported networks"""
        networks = [
            NetworkInfo(
                chain_id=1,
                name="Ethereum Mainnet",
                rpc_url="https://ethereum.publicnode.com",
                native_token="0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                block_explorer="https://etherscan.io",
                is_testnet=False
            ),
            NetworkInfo(
                chain_id=137,
                name="Polygon",
                rpc_url="https://polygon.llamarpc.com",
                native_token="0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                block_explorer="https://polygonscan.com",
                is_testnet=False
            ),
            NetworkInfo(
                chain_id=42161,
                name="Arbitrum One",
                rpc_url="https://arbitrum.llamarpc.com",
                native_token="0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                block_explorer="https://arbiscan.io",
                is_testnet=False
            ),
            NetworkInfo(
                chain_id=10143,
                name="Monad Testnet",
                rpc_url="https://rpc.monad.xyz",
                native_token="0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                block_explorer="https://explorer.monad.xyz",
                is_testnet=True
            )
        ]
        return SupportedNetworksResponse(networks=networks)
        
    def _get_common_tokens(self) -> Dict[str, str]:
        """Get common tokens for current chain"""
        return self.common_tokens_by_chain.get(self.chain_id, {
            "ETH": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        })
        
    def _normalize_token_address(self, token: str) -> str:
        """Normalize token address - handle symbols and addresses"""
        common_tokens = self._get_common_tokens()
        if token.upper() in common_tokens:
            return common_tokens[token.upper()]
        return Web3.to_checksum_address(token)
    
    def get_quote(self, quote_request: QuoteRequest) -> QuoteResponse:
        """Get a quote for a trade without executing it"""
        try:
            # Create service instance for the requested network
            if quote_request.chain_id != self.chain_id or quote_request.rpc_url != self.rpc_url:
                service = self.create_for_network(quote_request.chain_id, quote_request.rpc_url)
                return service.get_quote(quote_request)
            
            sell_token = self._normalize_token_address(quote_request.sell_token)
            buy_token = self._normalize_token_address(quote_request.buy_token)
            
            # Use the existing 0x API quote method but adapt for any token pair
            quote_data = self._get_0x_quote_extended(
                sell_token=sell_token,
                buy_token=buy_token,
                sell_amount=int(quote_request.sell_amount),
                slippage_bps=quote_request.slippage_bps
            )
            
            network_info = self.get_network_info()
            
            return QuoteResponse(
                sell_token=sell_token,
                buy_token=buy_token,
                sell_amount=quote_request.sell_amount,
                buy_amount=str(quote_data.get('buyAmount', '0')),
                price=str(quote_data.get('price', '0')),
                estimated_gas=str(quote_data.get('gas', '0')),
                gas_price=str(quote_data.get('gasPrice', '0')),
                slippage_bps=quote_request.slippage_bps,
                chain_id=self.chain_id,
                network_name=network_info.name,
                expires_at=datetime.now() + timedelta(minutes=5)
            )
            
        except Exception as e:
            logger.error(f"Failed to get quote: {e}")
            raise Exception(f"Failed to get quote: {str(e)}")
    
    def _get_0x_quote_extended(self, sell_token: str, buy_token: str, sell_amount: int, slippage_bps: int = 100) -> Dict[str, Any]:
        """Extended version of get_0x_quote that supports any token pair"""
        url = f"{self.base_url}/swap/permit2/quote"
        params = {
            "chainId": self.chain_id,
            "sellToken": sell_token,
            "buyToken": buy_token,
            "sellAmount": str(sell_amount),
            "taker": self.wallet_address,
            "slippageBps": str(slippage_bps)
        }
        headers = {
            "0x-api-key": self.api_key,
            "0x-version": "v2"
        }
        
        import requests
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()
    
    def execute_manual_trade(self, trade_request: ManualTradeRequest) -> ManualTradeResponse:
        """Execute a manual trade with any token pair"""
        try:
            # Create service instance for the requested network
            if trade_request.chain_id != self.chain_id or trade_request.rpc_url != self.rpc_url:
                service = self.create_for_network(trade_request.chain_id, trade_request.rpc_url)
                return service.execute_manual_trade(trade_request)
            
            sell_token = self._normalize_token_address(trade_request.sell_token)
            buy_token = self._normalize_token_address(trade_request.buy_token)
            sell_amount = int(trade_request.sell_amount)
            
            logger.info(f"Executing manual trade: {sell_amount} {sell_token} -> {buy_token} on chain {self.chain_id}")
            
            # Get quote first to get buy amount
            quote_data = self._get_0x_quote_extended(
                sell_token=sell_token,
                buy_token=buy_token,
                sell_amount=sell_amount,
                slippage_bps=trade_request.slippage_bps
            )
            
            # Execute the trade using the extended method
            tx_hash = self._execute_trade_extended(
                sell_token=sell_token,
                buy_token=buy_token,
                sell_amount=sell_amount,
                slippage_bps=trade_request.slippage_bps
            )
            
            if not tx_hash:
                raise Exception("Trade execution failed")
            
            network_info = self.get_network_info()
            
            return ManualTradeResponse(
                transaction_hash=tx_hash,
                sell_token=sell_token,
                buy_token=buy_token,
                sell_amount=trade_request.sell_amount,
                buy_amount=str(quote_data.get('buyAmount', '0')),
                gas_used=str(quote_data.get('gas', '0')),
                gas_price=str(quote_data.get('gasPrice', '0')),
                status="pending",
                timestamp=datetime.now(),
                chain_id=self.chain_id,
                network_name=network_info.name
            )
            
        except Exception as e:
            logger.error(f"Failed to execute manual trade: {e}")
            raise Exception(f"Failed to execute manual trade: {str(e)}")
    
    def sign_permit2(self, permit_data: dict) -> str:
        """Sign Permit2 EIP-712 message"""
        message = messages.encode_structured_data(
            primaryType='Permit2',
            domain=permit_data['domain'],
            message=permit_data['message'],
            types=permit_data['types']
        )
        signed = Account.sign_message(message, private_key=self.private_key)
        return signed.signature.hex()
    
    def _execute_trade_extended(self, sell_token: str, buy_token: str, sell_amount: int, slippage_bps: int = 100) -> Optional[str]:
        """Extended version of execute_trade that supports any token pair"""
        try:
            quote = self._get_0x_quote_extended(sell_token, buy_token, sell_amount, slippage_bps)
            tx_obj = quote.get('transaction', quote)

            # Handle Permit2 signature if needed
            if quote.get('permit2Data'):
                signature = self.sign_permit2(quote['permit2Data'])
                signature_bytes = bytes.fromhex(signature[2:] if signature.startswith('0x') else signature)
                sig_len = len(signature_bytes)
                sig_len_bytes = sig_len.to_bytes(32, byteorder='big')
                sig_len_hex = sig_len_bytes.hex()
                transaction_data = (
                    tx_obj['data'].lstrip('0x') +
                    sig_len_hex +
                    signature_bytes.hex()
                )
                transaction_data = '0x' + transaction_data
            else:
                transaction_data = tx_obj['data']

            # Build transaction
            tx = {
                'chainId': tx_obj.get('chainId', self.chain_id),
                'from': tx_obj.get('from', self.wallet_address),
                'to': Web3.to_checksum_address(tx_obj['to']),
                'data': transaction_data,
                'value': int(tx_obj.get('value', 0)),
                'gas': int(tx_obj.get('gas', 0)),
                'nonce': self.web3.eth.get_transaction_count(self.wallet_address),
            }

            # Add gas pricing
            if 'maxFeePerGas' in tx_obj and 'maxPriorityFeePerGas' in tx_obj:
                tx['maxFeePerGas'] = int(tx_obj['maxFeePerGas'])
                tx['maxPriorityFeePerGas'] = int(tx_obj['maxPriorityFeePerGas'])
                tx['type'] = '0x2'
            elif 'gasPrice' in tx_obj:
                tx['gasPrice'] = int(tx_obj['gasPrice'])

            # Sign and send transaction
            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.raw_transaction)
            return tx_hash.hex()
            
        except Exception as e:
            logger.error(f"Failed to execute extended trade: {e}")
            return None
    
    def get_wallet_balances(self, balance_request: WalletBalanceRequest) -> WalletBalanceResponse:
        """Get wallet balances for native token and specified ERC20 tokens"""
        try:
            # Create service instance for the requested network
            if balance_request.chain_id != self.chain_id or balance_request.rpc_url != self.rpc_url:
                service = self.create_for_network(balance_request.chain_id, balance_request.rpc_url)
                return service.get_wallet_balances(balance_request)
            
            # Get native token balance
            native_balance = self.web3.eth.get_balance(self.wallet_address)
            
            # Get ERC20 token balances
            tokens = []
            token_addresses = balance_request.tokens if balance_request.tokens else []
            
            # Add common tokens if no specific tokens requested
            if not token_addresses:
                token_addresses = [addr for addr in self._get_common_tokens().values() if addr != self.native_token]
            
            for address in token_addresses:
                try:
                    token_info = self._get_token_info(address)
                    if token_info:
                        tokens.append(token_info)
                except Exception as e:
                    logger.warning(f"Failed to get balance for {address}: {e}")
                    # Add token info without balance
                    tokens.append(TokenInfo(
                        address=address,
                        symbol="UNKNOWN",
                        name="Unknown Token",
                        decimals=18,
                        balance="0"
                    ))
            
            network_info = self.get_network_info()
            
            return WalletBalanceResponse(
                native_balance=str(native_balance),
                tokens=tokens,
                chain_id=self.chain_id,
                network_name=network_info.name
            )
            
        except Exception as e:
            logger.error(f"Failed to get wallet balances: {e}")
            raise Exception(f"Failed to get wallet balances: {str(e)}")
    
    def _get_token_info(self, token_address: str) -> Optional[TokenInfo]:
        """Get token information including balance"""
        try:
            # ERC20 contract ABI for basic functions
            erc20_abi = [
                {"constant": True, "inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "type": "function"},
                {"constant": True, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "type": "function"},
                {"constant": True, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function"},
                {"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"}
            ]
            
            contract = self.web3.eth.contract(
                address=Web3.to_checksum_address(token_address),
                abi=erc20_abi
            )
            
            name = contract.functions.name().call()
            symbol = contract.functions.symbol().call()
            decimals = contract.functions.decimals().call()
            balance = contract.functions.balanceOf(self.wallet_address).call()
            
            return TokenInfo(
                address=token_address,
                symbol=symbol,
                name=name,
                decimals=decimals,
                balance=str(balance)
            )
            
        except Exception as e:
            logger.error(f"Failed to get token info for {token_address}: {e}")
            return None
    
    def get_transaction_status(self, tx_hash: str, chain_id: int = None, rpc_url: str = None) -> Dict[str, Any]:
        """Get transaction status and details"""
        try:
            # Use different network if specified
            if chain_id and rpc_url and (chain_id != self.chain_id or rpc_url != self.rpc_url):
                service = self.create_for_network(chain_id, rpc_url)
                return service.get_transaction_status(tx_hash)
            
            tx_receipt = self.web3.eth.get_transaction_receipt(tx_hash)
            tx = self.web3.eth.get_transaction(tx_hash)
            
            return {
                "transaction_hash": tx_hash,
                "status": "success" if tx_receipt.status == 1 else "failed",
                "block_number": tx_receipt.blockNumber,
                "gas_used": tx_receipt.gasUsed,
                "gas_price": tx.gasPrice,
                "from": tx["from"],
                "to": tx["to"],
                "value": str(tx.value),
                "chain_id": self.chain_id
            }
        except Exception as e:
            logger.warning(f"Failed to get transaction status for {tx_hash}: {e}")
            return {
                "transaction_hash": tx_hash,
                "status": "pending",
                "error": str(e),
                "chain_id": self.chain_id if hasattr(self, 'chain_id') else None
            }