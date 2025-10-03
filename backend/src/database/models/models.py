from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime, timezone

# Base class for async SQLAlchemy models
class Base(AsyncAttrs, DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, unique=True, nullable=False)
    encrypted_eth_private_key = Column(String, nullable=True)  # ETH private key
    encrypted_solana_private_key = Column(String, nullable=True)  # Solana private key
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
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
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
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    bot = relationship("Bot", back_populates="performances")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # e.g., bot.started, bot.paused, bot.paused_insufficient_balance, bot.deleted, bot.resumed, trade.success, trade.failed
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    severity = Column(String, nullable=False, default="info")  # info|success|warning|error
    status = Column(String, nullable=False, default="unread")  # unread|read
    bot_id = Column(Integer, ForeignKey("bots.id", ondelete="SET NULL"), nullable=True)
    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="SET NULL"), nullable=True)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    read_at = Column(DateTime, nullable=True)