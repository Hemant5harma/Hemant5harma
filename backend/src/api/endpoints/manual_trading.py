from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from src.services.manual_trading import ManualTradingService
from src.py_models.manual_trade import (
    QuoteRequest, QuoteResponse, ManualTradeRequest, 
    ManualTradeResponse, WalletBalanceResponse, WalletBalanceRequest,
    NetworkInfo, SupportedNetworksResponse
)
from src.database.queries import (
    create_manual_trade, get_manual_trades_by_user, 
    get_manual_trade_by_hash, update_manual_trade_status,
    get_user_by_address
)
from src.database.models.models import User
from src.api.auth_utils import get_current_user
from src.api.dependencies import get_db_session
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

def get_trading_service(
    chain_id: Optional[int] = None,
    rpc_url: Optional[str] = None
):
    """Dependency to get trading service instance for specific network"""
    if chain_id and rpc_url:
        return ManualTradingService.create_for_network(chain_id, rpc_url)
    return ManualTradingService()

@router.get("/networks", response_model=SupportedNetworksResponse)
async def get_supported_networks():
    """
    Get list of supported networks for manual trading.
    Returns network information including chain IDs and RPC URLs.
    """
    try:
        service = ManualTradingService()
        return service.get_supported_networks()
    except Exception as e:
        logger.error(f"Failed to get supported networks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/networks/{chain_id}/info", response_model=NetworkInfo)
async def get_network_info(
    chain_id: int,
    rpc_url: str = Query(..., description="RPC URL for the network")
):
    """
    Get information about a specific network.
    """
    try:
        service = ManualTradingService.create_for_network(chain_id, rpc_url)
        return service.get_network_info()
    except Exception as e:
        logger.error(f"Failed to get network info: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/quote", response_model=QuoteResponse)
async def get_quote(quote_request: QuoteRequest):
    """
    Get a quote for a potential trade without executing it.
    This is similar to Uniswap's preview functionality.
    Now supports any blockchain network by specifying chain_id and rpc_url.
    """
    try:
        trading_service = ManualTradingService.create_for_network(
            quote_request.chain_id, 
            quote_request.rpc_url
        )
        quote = trading_service.get_quote(quote_request)
        return quote
    except Exception as e:
        logger.error(f"Failed to get quote: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/execute", response_model=ManualTradeResponse)
async def execute_trade(
    trade_request: ManualTradeRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Execute a manual trade with specified sell token, buy token, and amount.
    This is the main trading endpoint similar to Uniswap's swap function.
    Now supports any blockchain network by specifying chain_id and rpc_url.
    """
    try:
        trading_service = ManualTradingService.create_for_network(
            trade_request.chain_id, 
            trade_request.rpc_url
        )
        result = trading_service.execute_manual_trade(trade_request)
        
        # Store trade in database for the authenticated user
        trade_data = {
            "sell_token": result.sell_token,
            "buy_token": result.buy_token,
            "sell_amount": result.sell_amount,
            "buy_amount": result.buy_amount,
            "transaction_hash": result.transaction_hash,
            "gas_used": result.gas_used,
            "gas_price": result.gas_price,
            "status": result.status,
            "slippage_bps": trade_request.slippage_bps,
            "chain_id": trade_request.chain_id,
            "network_name": result.network_name
        }
        await create_manual_trade(db, current_user.id, trade_data)
        
        return result
    except Exception as e:
        logger.error(f"Failed to execute trade: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/wallet/balances", response_model=WalletBalanceResponse)
async def get_wallet_balances(balance_request: WalletBalanceRequest):
    """
    Get wallet balances for native token and specified ERC20 tokens.
    Now supports any blockchain network by specifying chain_id and rpc_url.
    """
    try:
        trading_service = ManualTradingService.create_for_network(
            balance_request.chain_id, 
            balance_request.rpc_url
        )
        balances = trading_service.get_wallet_balances(balance_request)
        return balances
    except Exception as e:
        logger.error(f"Failed to get wallet balances: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/transaction/{tx_hash}")
async def get_transaction_status(
    tx_hash: str,
    chain_id: int = Query(..., description="Chain ID of the network"),
    rpc_url: str = Query(..., description="RPC URL for the network"),
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """
    Get the status and details of a transaction by hash.
    Now supports any blockchain network by specifying chain_id and rpc_url.
    """
    try:
        trading_service = ManualTradingService.create_for_network(chain_id, rpc_url)
        status = trading_service.get_transaction_status(tx_hash)
        
        # Update database record if status changed
        if status.get("status") in ["success", "failed"]:
            await update_manual_trade_status(
                db, tx_hash, status["status"], 
                str(status.get("gas_used", ""))
            )
        
        return status
    except Exception as e:
        logger.error(f"Failed to get transaction status: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history")
async def get_manual_trade_history(
    chain_id: Optional[int] = Query(None, description="Filter by chain ID"),
    limit: int = Query(50, description="Number of trades to return"),
    offset: int = Query(0, description="Number of trades to skip"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get manual trade history for the current user.
    Can filter by chain_id to show trades from specific networks.
    """
    try:
        # Use default service to get wallet address
        # default_service = ManualTradingService()
        # user = await get_user_by_address(db, default_service.wallet_address)
        # if not user:
        #     raise HTTPException(status_code=404, detail="User not found")
        
        trades = await get_manual_trades_by_user(db, current_user.id, limit, offset, chain_id)
        
        return [
            {
                "id": trade.id,
                "sell_token": trade.sell_token,
                "buy_token": trade.buy_token,
                "sell_amount": trade.sell_amount,
                "buy_amount": trade.buy_amount,
                "transaction_hash": trade.transaction_hash,
                "gas_used": trade.gas_used,
                "gas_price": trade.gas_price,
                "status": trade.status,
                "slippage_bps": trade.slippage_bps,
                "chain_id": getattr(trade, 'chain_id', None),
                "network_name": getattr(trade, 'network_name', None),
                "created_at": trade.created_at,
                "updated_at": trade.updated_at
            }
            for trade in trades
        ]
    except Exception as e:
        logger.error(f"Failed to get trade history: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/tokens/common")
async def get_common_tokens(
    chain_id: int = Query(..., description="Chain ID to get tokens for"),
    rpc_url: str = Query(..., description="RPC URL for the network")
) -> Dict[str, str]:
    """
    Get a list of common token symbols and their addresses for a specific network.
    Useful for populating dropdown menus in the UI.
    """
    try:
        trading_service = ManualTradingService.create_for_network(chain_id, rpc_url)
        return trading_service._get_common_tokens()
    except Exception as e:
        logger.error(f"Failed to get common tokens: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/health")
async def health_check(
    chain_id: Optional[int] = Query(None, description="Chain ID to check"),
    rpc_url: Optional[str] = Query(None, description="RPC URL to check")
):
    """Health check endpoint for manual trading service"""
    try:
        if chain_id and rpc_url:
            trading_service = ManualTradingService.create_for_network(chain_id, rpc_url)
        else:
            trading_service = ManualTradingService()
            
        # Check if web3 connection is working
        is_connected = trading_service.web3.is_connected()
        latest_block = trading_service.web3.eth.block_number
        
        return {
            "status": "healthy" if is_connected else "unhealthy",
            "web3_connected": is_connected,
            "latest_block": latest_block,
            "wallet_address": trading_service.wallet_address,
            "chain_id": trading_service.chain_id,
            "rpc_url": trading_service.rpc_url
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }