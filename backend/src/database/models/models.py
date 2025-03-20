from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase

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
    amount = Column(Float, nullable=False)
    bot = relationship("Bot", back_populates="trades")
    coin = relationship("Coin", back_populates="trades")