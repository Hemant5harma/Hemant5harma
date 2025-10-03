from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.dex.unified_dex_router import UnifiedDexRouter
from src.py_models.manual_trade import (
    QuoteRequest, QuoteResponse, ManualTradeRequest, 
    ManualTradeResponse, WalletBalanceResponse, WalletBalanceRequest,
    DirectWalletBalanceRequest,
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
from src.services.notifications import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/networks", response_model=SupportedNetworksResponse)
async def get_supported_networks():
    """
    Get list of supported networks for manual trading.
    Returns network information including chain IDs and RPC URLs (EVM + Solana).
    """
    try:
        router = UnifiedDexRouter()
        return router.get_supported_networks()
    except Exception as e:
        logger.error(f"Failed to get supported networks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quote", response_model=QuoteResponse)
async def get_quote(
    quote_request: QuoteRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get a quote for a potential trade without executing it.
    Frontend specifies chain_id in the request - no need for rpc_url anymore.
    """
    try:
        router = UnifiedDexRouter()
        quote = await router.get_quote(quote_request, current_user.id, db)
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
    Frontend specifies chain_id in the request - supports all 0x networks.
    """
    try:
        router = UnifiedDexRouter()
        result = await router.execute_manual_trade(trade_request, current_user.id, db)
        
        # For Solana, the service already returns accurate status after comprehensive checking
        # For EVM chains, we need to do an additional status check
        import asyncio
        initial_status = result.status if result.status else "pending"
        
        # Only do additional status check for non-Solana chains
        if trade_request.chain_id != 900:  # Not Solana
            try:
                await asyncio.sleep(2)  # Standard delay for EVM
                
                # Check transaction status
                status_result = await router.get_transaction_status(result.transaction_hash, trade_request.chain_id)
                blockchain_status = status_result.get("status")
                logger.info(f"Immediate status check for {result.transaction_hash} (chain {trade_request.chain_id}): {blockchain_status}")
                
                # Map blockchain status to our status
                if blockchain_status in ["confirmed", "success", "finalized"]:
                    initial_status = "success"
                    logger.info(f"Trade {result.transaction_hash} confirmed immediately")
                elif blockchain_status in ["failed", "error"]:
                    initial_status = "failed"
                    logger.info(f"Trade {result.transaction_hash} failed immediately")
                else:
                    logger.info(f"Trade {result.transaction_hash} still pending after immediate check")
            except Exception as e:
                logger.info(f"Could not get immediate status for {result.transaction_hash}: {e}")
                # Continue with pending status
        else:
            # For Solana, log the status returned by the service
            logger.info(f"Solana trade {result.transaction_hash} status from service: {initial_status}")
        
        # Store trade in database for the authenticated user
        trade_data = {
            "sell_token": result.sell_token,
            "buy_token": result.buy_token,
            "sell_amount": result.sell_amount,
            "buy_amount": result.buy_amount,
            "transaction_hash": result.transaction_hash,
            "gas_used": result.gas_used,
            "gas_price": result.gas_price,
            "status": initial_status,
            "slippage_bps": trade_request.slippage_bps,
            "chain_id": trade_request.chain_id,
            "network_name": result.network_name
        }
        await create_manual_trade(db, current_user.id, trade_data)
        
        # Update the result status to reflect what we stored
        result.status = initial_status

        # Emit notifications ONLY for definitive statuses (success/failed), NOT for pending
        # This prevents premature notifications before the final trade result is known
        try:
            if initial_status == "success":
                # Format token addresses to be more user-friendly
                sell_token_display = result.sell_token[:8] + "..." if len(result.sell_token) > 20 else result.sell_token
                buy_token_display = result.buy_token[:8] + "..." if len(result.buy_token) > 20 else result.buy_token
                
                await NotificationService.emit(
                    db,
                    user_id=current_user.id,
                    type="trade.success",
                    title="Trade executed successfully",
                    message=f"Swap completed on {result.network_name}",
                    severity="success",
                    extra_data={
                        "tx_hash": result.transaction_hash,
                        "chain_id": trade_request.chain_id,
                        "network": result.network_name,
                        "sell_token": sell_token_display,
                        "buy_token": buy_token_display,
                    },
                )
                logger.info(f"Sent success notification for trade {result.transaction_hash}")
            elif initial_status == "failed":
                await NotificationService.emit(
                    db,
                    user_id=current_user.id,
                    type="trade.failed",
                    title="Trade failed",
                    message=f"Swap failed on {result.network_name}",
                    severity="error",
                    extra_data={
                        "tx_hash": result.transaction_hash,
                        "chain_id": trade_request.chain_id,
                        "network": result.network_name,
                    },
                )
                logger.info(f"Sent failed notification for trade {result.transaction_hash}")
            else:
                # Pending status - no notification sent, will be updated when status is confirmed
                logger.info(f"Trade {result.transaction_hash} is pending, notification will be sent when final status is determined")
        except Exception as e:
            logger.error(f"Failed to emit trade notification: {e}")
        
        return result
    except Exception as e:
        logger.error(f"Failed to execute trade: {e}")
        try:
            await NotificationService.emit(
                db,
                user_id=current_user.id,
                type="trade.failed",
                title="Trade failed",
                message=str(e),
                severity="error",
                extra_data={"chain_id": getattr(trade_request, 'chain_id', None)},
            )
        except Exception as notification_error:
            logger.error(f"Failed to emit trade failure notification: {notification_error}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/transaction/{tx_hash}")
async def get_transaction_status(
    tx_hash: str,
    chain_id: int = Query(..., description="Chain ID of the network"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get the status and details of a transaction by hash.
    Frontend specifies chain_id - no need for rpc_url anymore.
    """
    try:
        router = UnifiedDexRouter()
        status = await router.get_transaction_status(tx_hash, chain_id)
        
        # Update database record if status changed and send notification
        if status.get("status") in ["success", "failed"]:
            # First check if trade was previously pending
            from src.database.queries import get_manual_trade_by_hash
            trade = await get_manual_trade_by_hash(db, tx_hash)
            was_pending = trade and trade.status == "pending"
            
            # Update status in database
            await update_manual_trade_status(
                db, tx_hash, status["status"], 
                str(status.get("gas_used", ""))
            )
            
            # Send notification if status changed from pending to final
            if was_pending and trade:
                try:
                    network_name = trade.network_name if hasattr(trade, 'network_name') else "blockchain"
                    if status["status"] == "success":
                        await NotificationService.emit(
                            db,
                            user_id=current_user.id,
                            type="trade.success",
                            title="Trade executed successfully",
                            message=f"Swap confirmed on {network_name}",
                            severity="success",
                            extra_data={
                                "tx_hash": tx_hash,
                                "chain_id": chain_id,
                            },
                        )
                    elif status["status"] == "failed":
                        await NotificationService.emit(
                            db,
                            user_id=current_user.id,
                            type="trade.failed",
                            title="Trade failed",
                            message=f"Swap failed on {network_name}",
                            severity="error",
                            extra_data={
                                "tx_hash": tx_hash,
                                "chain_id": chain_id,
                            },
                        )
                except Exception as notif_error:
                    logger.error(f"Failed to send status change notification: {notif_error}")
        
        return status
    except Exception as e:
        logger.error(f"Failed to get transaction status: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/wallet/balances", response_model=WalletBalanceResponse)
async def get_wallet_balances(
    balance_request: WalletBalanceRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get wallet balances for native token and specified ERC20 tokens.
    Frontend specifies chain_id in the request.
    """
    try:
        router = UnifiedDexRouter()
        balances = await router.get_wallet_balances(balance_request, current_user.id, db)
        return balances
    except Exception as e:
        logger.error(f"Failed to get wallet balances: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/wallet/balances-by-key", response_model=WalletBalanceResponse)
async def get_wallet_balances_by_key(
    balance_request: DirectWalletBalanceRequest,
):
    """
    Get wallet balances using a directly provided private key (no user auth).
    Supports EVM chains (hex private key) and Solana (base58/JSON/hex formats).
    """
    try:
        # Route directly without DB or current_user; services will use provided key
        # We'll dynamically create services like ManualTradingService/SolanaManualTradingService
        chain_id = balance_request.chain_id
        tokens = balance_request.tokens or []

        if chain_id == 900:
            # Solana flow
            from src.services.solana_manual_trading import SolanaManualTradingService
            from src.utils.solana_key_handler import SolanaKeyHandler
            from solana.rpc.async_api import AsyncClient
            from solders.pubkey import Pubkey
            import base64

            service = SolanaManualTradingService()
            client = AsyncClient(service.supported_chains[900]["rpc"])
            try:
                keypair = SolanaKeyHandler.create_keypair_from_private_key(balance_request.private_key)
                # Native SOL balance
                sol_balance = await client.get_balance(keypair.pubkey())
                native_balance = str(sol_balance.value)

                # Token balances
                token_infos = []
                if tokens:
                    for token_mint in tokens:
                        try:
                            info = await service._get_spl_token_info(token_mint, client, keypair.pubkey())
                            if info:
                                token_infos.append(info)
                        except Exception:
                            continue

                return WalletBalanceResponse(
                    native_balance=native_balance,
                    tokens=token_infos,
                    chain_id=900,
                    network_name=service.supported_chains[900]["name"],
                )
            finally:
                await client.close()
        else:
            # EVM flow
            from web3 import Web3
            from web3.middleware import ExtraDataToPOAMiddleware
            from eth_account import Account
            from src.services.manual_trading import ManualTradingService

            evm = ManualTradingService()
            if chain_id not in evm.supported_chains:
                raise HTTPException(status_code=400, detail=f"Chain {chain_id} not supported")
            rpc = evm.supported_chains[chain_id]["rpc"]
            web3 = Web3(Web3.HTTPProvider(rpc))
            web3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

            # Private key may have 0x prefix
            account = Account.from_key(balance_request.private_key)
            address = account.address

            # Native balance
            native_balance = str(web3.eth.get_balance(address))

            # ERC20 balances
            token_infos = []
            if tokens:
                token_infos = []
                erc20_abi = [
                    {"constant": True, "inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "type": "function"},
                    {"constant": True, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "type": "function"},
                    {"constant": True, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function"},
                    {"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"}
                ]
                for token_address in tokens:
                    try:
                        contract = web3.eth.contract(
                            address=Web3.to_checksum_address(token_address),
                            abi=erc20_abi,
                        )
                        token_infos.append({
                            "address": token_address,
                            "symbol": contract.functions.symbol().call(),
                            "name": contract.functions.name().call(),
                            "decimals": contract.functions.decimals().call(),
                            "balance": str(contract.functions.balanceOf(address).call()),
                        })
                    except Exception:
                        continue

            # Normalize to TokenInfo list
            from src.py_models.manual_trade import TokenInfo
            tokens_model = [TokenInfo(**ti) if isinstance(ti, dict) else ti for ti in token_infos]
            return WalletBalanceResponse(
                native_balance=native_balance,
                tokens=tokens_model,
                chain_id=chain_id,
                network_name=evm.supported_chains[chain_id]["name"],
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get balances by key: {e}")
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
    Automatically checks and updates pending transaction statuses.
    """
    try:
        trades = await get_manual_trades_by_user(db, current_user.id, limit, offset, chain_id)
        
        # Check and update status for pending trades
        router = UnifiedDexRouter()
        for trade in trades:
            if trade.status == "pending":
                try:
                    logger.info(f"Checking status for pending trade {trade.id} (tx: {trade.transaction_hash}, chain: {trade.chain_id})")
                    # Check transaction status on blockchain
                    status_result = await router.get_transaction_status(trade.transaction_hash, trade.chain_id)
                    blockchain_status = status_result.get("status")
                    logger.info(f"Blockchain returned status '{blockchain_status}' for trade {trade.id}")
                    
                    # Map blockchain status to our status
                    if blockchain_status in ["confirmed", "success", "finalized"]:
                        await update_manual_trade_status(db, trade.transaction_hash, "success", str(status_result.get("gas_used", "")))
                        trade.status = "success"  # Update in-memory object for response
                        logger.info(f"Updated trade {trade.id} status to success")
                        
                        # Send success notification for pending trade that succeeded
                        try:
                            await NotificationService.emit(
                                db,
                                user_id=current_user.id,
                                type="trade.success",
                                title="Trade executed successfully",
                                message=f"Swap confirmed on {trade.network_name}",
                                severity="success",
                                extra_data={
                                    "tx_hash": trade.transaction_hash,
                                    "chain_id": trade.chain_id,
                                    "network": trade.network_name,
                                },
                            )
                            logger.info(f"Sent delayed success notification for trade {trade.transaction_hash}")
                        except Exception as notif_error:
                            logger.error(f"Failed to send success notification for trade {trade.id}: {notif_error}")
                            
                    elif blockchain_status in ["failed", "error"]:
                        await update_manual_trade_status(db, trade.transaction_hash, "failed", str(status_result.get("gas_used", "")))
                        trade.status = "failed"  # Update in-memory object for response
                        logger.info(f"Updated trade {trade.id} status to failed")
                        
                        # Send failed notification for pending trade that failed
                        try:
                            await NotificationService.emit(
                                db,
                                user_id=current_user.id,
                                type="trade.failed",
                                title="Trade failed",
                                message=f"Swap failed on {trade.network_name}",
                                severity="error",
                                extra_data={
                                    "tx_hash": trade.transaction_hash,
                                    "chain_id": trade.chain_id,
                                    "network": trade.network_name,
                                },
                            )
                            logger.info(f"Sent delayed failed notification for trade {trade.transaction_hash}")
                        except Exception as notif_error:
                            logger.error(f"Failed to send failed notification for trade {trade.id}: {notif_error}")
                            
                    else:
                        logger.info(f"Trade {trade.id} still pending (status: {blockchain_status})")
                except Exception as e:
                    logger.warning(f"Failed to check status for trade {trade.id}: {e}")
                    # Continue with other trades even if one fails
        
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

@router.get("/health")
async def health_check():
    """Health check endpoint for manual trading service"""
    try:
        service = ManualTradingService()
        supported_networks = service.get_supported_networks()
        
        return {
            "status": "healthy",
            "service": "manual_trading",
            "supported_networks": len(supported_networks.networks),
            "networks": [net.name for net in supported_networks.networks]
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))