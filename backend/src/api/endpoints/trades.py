from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.queries import get_trades_by_bot, get_bot_by_id
from src.py_models.trade import TradeResponse
from src.api.dependencies import get_db_session
from typing import List

router = APIRouter()

@router.get("/{bot_id}/history", response_model=List[TradeResponse])
async def get_trades(bot_id: int, db: AsyncSession = Depends(get_db_session)):
    bot = await get_bot_by_id(db, bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    trades = await get_trades_by_bot(db, bot_id)
    return [TradeResponse.model_validate(trade) for trade in trades]