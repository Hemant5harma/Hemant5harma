import logging
from typing import Dict, Any, Optional, Union
from sqlalchemy.ext.asyncio import AsyncSession

# Import EVM services
from src.dex.dex_integration import DexIntegration
from src.services.manual_trading import ManualTradingService

# Import Solana services
from src.dex.solana_integration import SolanaIntegration
from src.services.solana_manual_trading import SolanaManualTradingService

# Import models
from src.py_models.manual_trade import (
    QuoteRequest, QuoteResponse, ManualTradeRequest, 
    ManualTradeResponse, WalletBalanceRequest, WalletBalanceResponse,
    SupportedNetworksResponse
)

logger = logging.getLogger(__name__)

class UnifiedDexRouter:
    """
    Unified router that automatically detects blockchain type and routes to appropriate service.
    Provides seamless integration between EVM (0x API) and Solana (Jupiter API) trading.
    """
    
    def __init__(self):
        # Initialize all services
        self.evm_dex_service = DexIntegration()
        self.evm_manual_service = ManualTradingService()
        self.solana_dex_service = SolanaIntegration()
        self.solana_manual_service = SolanaManualTradingService()
        
        # Chain ID mapping
        self.SOLANA_CHAIN_ID = 900
        self.EVM_CHAIN_IDS = {1, 137, 42161, 43114, 56, 8453, 10, 10143}  # All supported EVM chains
        
        logger.info("UnifiedDexRouter initialized with EVM and Solana support")
    
    def _is_solana_chain(self, chain_id: int) -> bool:
        """Detect if chain_id represents Solana blockchain"""
        return chain_id == self.SOLANA_CHAIN_ID
    
    def _is_evm_chain(self, chain_id: int) -> bool:
        """Detect if chain_id represents an EVM blockchain"""
        return chain_id in self.EVM_CHAIN_IDS
    
    async def get_quote(self, quote_request: QuoteRequest, user_id: int, db: AsyncSession) -> QuoteResponse:
        """
        Unified quote endpoint - automatically routes to Solana or EVM based on chain_id
        
        Args:
            quote_request: Quote request (compatible with both EVM and Solana)
            user_id: User ID
            db: Database session
            
        Returns:
            QuoteResponse with unified format
        """
        try:
            chain_id = quote_request.chain_id
            
            if self._is_solana_chain(chain_id):
                logger.info(f"Routing quote to Solana (Jupiter) - Chain ID: {chain_id}")
                return await self.solana_manual_service.get_quote(quote_request, user_id, db)
            
            elif self._is_evm_chain(chain_id):
                logger.info(f"Routing quote to EVM (0x API) - Chain ID: {chain_id}")
                return await self.evm_manual_service.get_quote(quote_request, user_id, db)
            
            else:
                raise Exception(f"Unsupported chain ID: {chain_id}")
                
        except Exception as e:
            logger.error(f"Unified quote failed: {e}")
            raise
    
    async def execute_manual_trade(self, trade_request: ManualTradeRequest, user_id: int, db: AsyncSession) -> ManualTradeResponse:
        """
        Unified manual trade execution - automatically routes to Solana or EVM
        
        Args:
            trade_request: Trade request (compatible with both EVM and Solana)
            user_id: User ID
            db: Database session
            
        Returns:
            ManualTradeResponse with unified format
        """
        try:
            chain_id = trade_request.chain_id
            
            if self._is_solana_chain(chain_id):
                logger.info(f"Routing manual trade to Solana (Jupiter) - Chain ID: {chain_id}")
                return await self.solana_manual_service.execute_trade(trade_request, user_id, db)
            
            elif self._is_evm_chain(chain_id):
                logger.info(f"Routing manual trade to EVM (0x API) - Chain ID: {chain_id}")
                return await self.evm_manual_service.execute_trade(trade_request, user_id, db)
            
            else:
                raise Exception(f"Unsupported chain ID: {chain_id}")
                
        except Exception as e:
            logger.error(f"Unified manual trade failed: {e}")
            raise
    
    async def execute_bot_trade(self, buy_token: str, sell_amount: int, chain_id: int, user_id: int, db: AsyncSession, sell_token: str = None) -> str:
        """
        Unified bot trade execution - automatically routes to Solana or EVM
        
        Args:
            buy_token: Token to buy
            sell_amount: Amount to sell (in smallest units)
            chain_id: Chain ID
            user_id: User ID
            db: Database session
            sell_token: Token to sell (optional)
            
        Returns:
            Transaction hash/signature
        """
        try:
            if self._is_solana_chain(chain_id):
                logger.info(f"Routing bot trade to Solana (Jupiter) - Chain ID: {chain_id}")
                return await self.solana_dex_service.execute_trade(
                    buy_token=buy_token,
                    sell_amount=sell_amount,
                    chain_id=chain_id,
                    user_id=user_id,
                    db=db,
                    sell_token=sell_token
                )
            
            elif self._is_evm_chain(chain_id):
                logger.info(f"Routing bot trade to EVM (0x API) - Chain ID: {chain_id}")
                return await self.evm_dex_service.execute_trade(
                    buy_token=buy_token,
                    sell_amount=sell_amount,
                    chain_id=chain_id,
                    user_id=user_id,
                    db=db,
                    sell_token=sell_token
                )
            
            else:
                raise Exception(f"Unsupported chain ID: {chain_id}")
                
        except Exception as e:
            logger.error(f"Unified bot trade failed: {e}")
            raise
    
    async def get_bot_quote(self, buy_token: str, sell_amount: int, chain_id: int, user_id: int, db: AsyncSession, sell_token: str = None) -> Dict[str, Any]:
        """
        Unified bot quote - automatically routes to Solana or EVM
        
        Args:
            buy_token: Token to buy
            sell_amount: Amount to sell (in smallest units)
            chain_id: Chain ID
            user_id: User ID
            db: Database session
            sell_token: Token to sell (optional)
            
        Returns:
            Quote data with unified format
        """
        try:
            if self._is_solana_chain(chain_id):
                logger.info(f"Routing bot quote to Solana (Jupiter) - Chain ID: {chain_id}")
                return await self.solana_dex_service.get_quote(
                    buy_token=buy_token,
                    sell_amount=sell_amount,
                    chain_id=chain_id,
                    user_id=user_id,
                    db=db,
                    sell_token=sell_token
                )
            
            elif self._is_evm_chain(chain_id):
                logger.info(f"Routing bot quote to EVM (0x API) - Chain ID: {chain_id}")
                return await self.evm_dex_service.get_quote(
                    buy_token=buy_token,
                    sell_amount=sell_amount,
                    chain_id=chain_id,
                    user_id=user_id,
                    db=db,
                    sell_token=sell_token
                )
            
            else:
                raise Exception(f"Unsupported chain ID: {chain_id}")
                
        except Exception as e:
            logger.error(f"Unified bot quote failed: {e}")
            raise
    
    async def get_wallet_balances(self, balance_request: WalletBalanceRequest, user_id: int, db: AsyncSession) -> WalletBalanceResponse:
        """
        Unified wallet balance check - automatically routes to Solana or EVM
        
        Args:
            balance_request: Balance request
            user_id: User ID
            db: Database session
            
        Returns:
            WalletBalanceResponse with unified format
        """
        try:
            chain_id = balance_request.chain_id
            
            if self._is_solana_chain(chain_id):
                logger.info(f"Routing balance check to Solana - Chain ID: {chain_id}")
                return await self.solana_manual_service.get_wallet_balances(balance_request, user_id, db)
            
            elif self._is_evm_chain(chain_id):
                logger.info(f"Routing balance check to EVM - Chain ID: {chain_id}")
                return await self.evm_manual_service.get_wallet_balances(balance_request, user_id, db)
            
            else:
                raise Exception(f"Unsupported chain ID: {chain_id}")
                
        except Exception as e:
            logger.error(f"Unified balance check failed: {e}")
            raise
    
    def get_supported_networks(self) -> SupportedNetworksResponse:
        """
        Get all supported networks (EVM + Solana)
        
        Returns:
            Combined list of supported networks
        """
        try:
            # Get EVM networks
            evm_networks = self.evm_manual_service.get_supported_networks()
            
            # Get Solana networks
            solana_networks = self.solana_manual_service.get_supported_networks()
            
            # Combine networks
            all_networks = evm_networks.networks + solana_networks.networks
            
            return SupportedNetworksResponse(networks=all_networks)
            
        except Exception as e:
            logger.error(f"Failed to get supported networks: {e}")
            # Return minimal fallback
            from src.py_models.manual_trade import NetworkInfo
            fallback_networks = [
                NetworkInfo(
                    chain_id=1,
                    name="Ethereum",
                    rpc_url="https://mainnet.infura.io/v3/YOUR_KEY",
                    native_token="0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                    is_testnet=False
                ),
                NetworkInfo(
                    chain_id=900,
                    name="Solana",
                    rpc_url="https://api.mainnet-beta.solana.com",
                    native_token="So11111111111111111111111111111111111111112",
                    is_testnet=False
                )
            ]
            return SupportedNetworksResponse(networks=fallback_networks)
    
    async def get_transaction_status(self, tx_hash: str, chain_id: int) -> Dict[str, Any]:
        """
        Unified transaction status check - automatically routes to Solana or EVM
        
        Args:
            tx_hash: Transaction hash/signature
            chain_id: Chain ID
            
        Returns:
            Transaction status with unified format
        """
        try:
            if self._is_solana_chain(chain_id):
                logger.info(f"Routing tx status to Solana - Chain ID: {chain_id}")
                return await self.solana_manual_service.get_transaction_status(tx_hash, chain_id)
            
            elif self._is_evm_chain(chain_id):
                logger.info(f"Routing tx status to EVM - Chain ID: {chain_id}")
                return await self.evm_manual_service.get_transaction_status(tx_hash, chain_id)
            
            else:
                return {
                    "transaction_hash": tx_hash,
                    "status": "error",
                    "error": f"Unsupported chain ID: {chain_id}",
                    "chain_id": chain_id
                }
                
        except Exception as e:
            logger.error(f"Unified transaction status check failed: {e}")
            return {
                "transaction_hash": tx_hash,
                "status": "error",
                "error": str(e),
                "chain_id": chain_id
            }
    
    def get_blockchain_info(self, chain_id: int) -> Dict[str, Any]:
        """
        Get blockchain information
        
        Args:
            chain_id: Chain ID
            
        Returns:
            Blockchain information
        """
        if self._is_solana_chain(chain_id):
            return {
                "chain_id": chain_id,
                "blockchain": "solana",
                "name": "Solana",
                "native_token": "SOL",
                "api_provider": "Jupiter",
                "explorer": "https://explorer.solana.com"
            }
        elif self._is_evm_chain(chain_id):
            # Map chain IDs to network names
            evm_networks = {
                1: {"name": "Ethereum", "native": "ETH"},
                137: {"name": "Polygon", "native": "MATIC"},
                42161: {"name": "Arbitrum", "native": "ETH"},
                43114: {"name": "Avalanche", "native": "AVAX"},
                56: {"name": "BSC", "native": "BNB"},
                8453: {"name": "Base", "native": "ETH"},
                10: {"name": "Optimism", "native": "ETH"},
                10143: {"name": "Monad Testnet", "native": "MON"}
            }
            
            network_info = evm_networks.get(chain_id, {"name": "Unknown EVM", "native": "ETH"})
            
            return {
                "chain_id": chain_id,
                "blockchain": "evm",
                "name": network_info["name"],
                "native_token": network_info["native"],
                "api_provider": "0x API",
                "explorer": "https://etherscan.io"  # Would be chain-specific in production
            }
        else:
            return {
                "chain_id": chain_id,
                "blockchain": "unknown",
                "name": "Unsupported",
                "error": f"Chain ID {chain_id} not supported"
            } 