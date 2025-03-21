from fastapi import FastAPI
from src.database.connection import init_db, engine
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.database.models.models import Base
from .endpoints import users, auth

app = FastAPI()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
        yield
    except Exception as e:
        raise

app = FastAPI(lifespan=lifespan)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
# app.include_router(bots.router, prefix="/bots", tags=["bots"])
# app.include_router(trades.router, prefix="/trades", tags=["trades"])

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/")
async def root():
    return {"message": "DCA Bot Platform API"}