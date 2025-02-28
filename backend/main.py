from fastapi import FastAPI
from core.config import settings
from routers import strategies, trades, data

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
async def startup_event():
    # Initialize Web3 connection
    from services.blockchain import init_web3
    init_web3()

app.include_router(strategies.router)
app.include_router(trades.router)
app.include_router(data.router)