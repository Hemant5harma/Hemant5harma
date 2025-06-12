from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime

# Base class for async SQLAlchemy models
class Base(AsyncAttrs, DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, unique=True, nullable=False)
    encrypted_private_key = Column(String, nullable=True)  # Encrypted private key for trading
    bots = relationship("Bot", back_populates="user", cascade="all, delete-orphan")
    manual_trades = relationship("ManualTrade", back_populates="user", cascade="all, delete-orphan")

class Bot(Base):
    __tablename__ = "bots"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    status = Column(String, nullable=False, default="paused")
    chain_id = Column(Integer, nullable=False, default=1)  # Default to Ethereum
    rpc_url = Column(String, nullable=True)  # Optional custom RPC URL
    network_name = Column(String, nullable=True)  # Network display name
    next_execution_time = Column(DateTime)
    user = relationship("User", back_populates="bots")
    coins = relationship("Coin", back_populates="bot", cascade="all, delete-orphan")
    trades = relationship("Trade", back_populates="bot", cascade="all, delete-orphan")
    performances = relationship("BotPerformance", back_populates="bot", cascade="all, delete-orphan", passive_deletes=True)

class Coin(Base):
    __tablename__ = "coins"
    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id", ondelete="CASCADE"), nullable=False)
    token_address = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)  # Keep for backward compatibility
    condition_type = Column(String, nullable=False, default="price_drop")
    condition_params = Column(JSON, nullable=False, default=lambda: {"threshold": 5.0})
    logic_operator = Column(String, nullable=True, default="AND")
    bot = relationship("Bot", back_populates="coins")
    trades = relationship("Trade", back_populates="coin", cascade="all, delete-orphan")

class Trade(Base):
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id", ondelete="CASCADE"), nullable=False)
    coin_id = Column(Integer, ForeignKey("coins.id", ondelete="CASCADE"), nullable=False)
    trade_time = Column(DateTime, nullable=False)
    token_address = Column(String, nullable=False)
    trade_price = Column(Float, nullable=False)
    transaction_hash = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    chain_id = Column(Integer, nullable=True)  # Chain ID for the trade
    network_name = Column(String, nullable=True)  # Network display name
    bot = relationship("Bot", back_populates="trades")
    coin = relationship("Coin", back_populates="trades")

class ManualTrade(Base):
    __tablename__ = "manual_trades"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sell_token = Column(String, nullable=False)
    buy_token = Column(String, nullable=False)
    sell_amount = Column(String, nullable=False)
    buy_amount = Column(String, nullable=False)
    transaction_hash = Column(String, nullable=False)
    gas_used = Column(String)
    gas_price = Column(String)
    status = Column(String, nullable=False, default="pending")
    slippage_bps = Column(Integer, nullable=False, default=100)
    chain_id = Column(Integer, nullable=False, default=1)  # Chain ID for multi-chain support
    network_name = Column(String, nullable=True)  # Network display name (e.g., "Ethereum", "Polygon")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="manual_trades")

class BotPerformance(Base):
    __tablename__ = "bot_performances"

    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id", ondelete="CASCADE"), nullable=False)
    total_trades = Column(Integer, default=0)
    total_volume = Column(Float, default=0.0)
    apy = Column(Float, default=0.0)
    trade_price = Column(Float, default=0.0)
    three_month_perf = Column(Float, default=0.0)
    six_month_perf = Column(Float, default=0.0)
    total_perf = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow)
    bot = relationship("Bot", back_populates="performances")