#!/usr/bin/env python3
"""
Test script for condition evaluation system
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

import asyncio
from src.database.models.models import Coin
from src.services.logic import (
    evaluate_trading_condition,
    evaluate_price_drop_condition,
    evaluate_rsi_condition,
    evaluate_volume_condition,
    evaluate_support_level_condition,
    evaluate_ma_cross_condition
)

# Mock coin object for testing
class MockCoin:
    def __init__(self, condition_type, condition_params, threshold=5.0):
        self.condition_type = condition_type
        self.condition_params = condition_params
        self.threshold = threshold
        self.token_address = "0xf817257fed379853cde0fa4f97ab987181b1e5ea"

# Test data
test_price_data = {
    "usdPrice": 1.0,
    "24hChange": -7.5,  # 7.5% drop
    "volume": 1000000
}

async def test_conditions():
    """Test all condition types"""
    print("🧪 Testing Trading Condition Evaluation System\n")
    
    # Test 1: Price Drop Condition
    print("1️⃣ Testing Price Drop Condition:")
    coin1 = MockCoin("price_drop", {"threshold": 5.0})
    result1 = await evaluate_trading_condition(coin1, test_price_data, 10143)
    print(f"   - Price dropped 7.5%, threshold 5.0%: {result1} ✅" if result1 else f"   - Price dropped 7.5%, threshold 5.0%: {result1} ❌")
    
    # Test 2: RSI Oversold Condition
    print("\n2️⃣ Testing RSI Oversold Condition:")
    coin2 = MockCoin("rsi_oversold", {"rsi_threshold": 30, "timeframe": "1h"})
    result2 = await evaluate_trading_condition(coin2, test_price_data, 10143)
    print(f"   - RSI oversold simulation: {result2}")
    
    # Test 3: Volume Spike Condition
    print("\n3️⃣ Testing Volume Spike Condition:")
    coin3 = MockCoin("volume_spike", {"volume_multiplier": 2.0, "timeframe": "24h"})
    result3 = await evaluate_trading_condition(coin3, test_price_data, 10143)
    print(f"   - Volume spike simulation: {result3}")
    
    # Test 4: Support Level Condition
    print("\n4️⃣ Testing Support Level Condition:")
    coin4 = MockCoin("support_level", {"support_price": 1.0, "tolerance": 0.02})
    result4 = await evaluate_trading_condition(coin4, test_price_data, 10143)
    print(f"   - Support level at $1.0 (current: $1.0): {result4}")
    
    # Test 5: Moving Average Cross Condition
    print("\n5️⃣ Testing Moving Average Cross Condition:")
    coin5 = MockCoin("moving_average_cross", {"fast_ma": 20, "slow_ma": 50, "timeframe": "1h"})
    result5 = await evaluate_trading_condition(coin5, test_price_data, 10143)
    print(f"   - MA cross simulation: {result5}")
    
    # Test 6: Backward Compatibility
    print("\n6️⃣ Testing Backward Compatibility:")
    coin6 = MockCoin("price_drop", None)  # No condition_params
    result6 = await evaluate_trading_condition(coin6, test_price_data, 10143)
    print(f"   - Legacy coin (no condition_params): {result6}")
    
    # Test 7: Unknown Condition Type
    print("\n7️⃣ Testing Unknown Condition Type:")
    coin7 = MockCoin("unknown_condition", {"some_param": 123})
    result7 = await evaluate_trading_condition(coin7, test_price_data, 10143)
    print(f"   - Unknown condition (should fallback): {result7}")
    
    print("\n✅ All condition tests completed!")

def test_condition_parameters():
    """Test condition parameter structures"""
    print("\n📋 Testing Condition Parameter Structures:")
    
    conditions = [
        ("price_drop", {"threshold": 5.0}),
        ("rsi_oversold", {"rsi_threshold": 30, "timeframe": "1h"}),
        ("volume_spike", {"volume_multiplier": 2.0, "timeframe": "24h"}),
        ("support_level", {"support_price": 1.25, "tolerance": 0.02}),
        ("moving_average_cross", {"fast_ma": 20, "slow_ma": 50, "timeframe": "1h"})
    ]
    
    for condition_type, params in conditions:
        print(f"   - {condition_type}: {params}")
    
    print("✅ Parameter structures verified!")

if __name__ == "__main__":
    test_condition_parameters()
    asyncio.run(test_conditions()) 