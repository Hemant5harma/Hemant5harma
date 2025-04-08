from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
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
    bots = relationship("Bot", back_populates="user", cascade="all, delete-orphan")

class Bot(Base):
    __tablename__ = "bots"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    status = Column(String, nullable=False, default="paused")
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
    threshold = Column(Float, nullable=False)
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
    bot = relationship("Bot", back_populates="trades")
    coin = relationship("Coin", back_populates="trades")

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