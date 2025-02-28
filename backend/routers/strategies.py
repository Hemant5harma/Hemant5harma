from fastapi import APIRouter, Depends
from models.schemas import StrategyCreate, StrategyResponse
from services.blockchain import BlockchainService

router = APIRouter()

@router.post("/strategies", response_model=StrategyResponse)
async def create_strategy(
    strategy: StrategyCreate,
    service: BlockchainService = Depends(BlockchainService)
):
    return await service.create_strategy(
        amount=strategy.amount,
        interval=strategy.interval
    )