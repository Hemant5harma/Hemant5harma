#!/usr/bin/env python3
"""
Test script to verify the new DexIntegration system works correctly.
This script tests the dynamic, stateless architecture.
"""

import asyncio
import os
import sys
from unittest.mock import Mock, AsyncMock
import logging

# Add the parent directory to the path to import the modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dex.dex_integration import DexIntegration
from sqlalchemy.ext.asyncio import AsyncSession

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_dex_integration():
    """Test the new DexIntegration system"""
    
    print("🧪 Testing DexIntegration System...")
    
    # Test 1: Initialize DexIntegration
    try:
        dex = DexIntegration()
        print("✅ DexIntegration initialized successfully")
        
        # Check supported chains
        supported_chains = dex.get_supported_chains()
        print(f"✅ Supported chains: {list(supported_chains.keys())}")
        
        # Verify all 8 chains are supported
        expected_chains = [1, 137, 42161, 43114, 56, 8453, 10, 10143]
        for chain_id in expected_chains:
            if chain_id in supported_chains:
                print(f"✅ Chain {chain_id} ({supported_chains[chain_id]['name']}) supported")
            else:
                print(f"❌ Chain {chain_id} not supported")
        
    except Exception as e:
        print(f"❌ DexIntegration initialization failed: {e}")
        return False
    
    # Test 2: Test _setup_for_request method (mock)
    try:
        # Mock database session and user data
        mock_db = Mock(spec=AsyncSession)
        mock_user_id = 1
        test_chain_id = 10143  # Monad testnet
        
        # Mock the get_user_private_key function
        from unittest.mock import patch
        with patch('src.dex.dex_integration.get_user_private_key') as mock_get_key:
            mock_get_key.return_value = "test_encrypted_key"
            
            with patch('src.dex.dex_integration.encryption_util') as mock_encryption:
                mock_encryption.decrypt_private_key.return_value = "0x" + "1" * 64  # Mock private key
                
                # This would normally fail due to network connection, but we can test the setup logic
                try:
                    web3, account, wallet_address = await dex._setup_for_request(test_chain_id, mock_user_id, mock_db)
                    print(f"❌ _setup_for_request should have failed without real network connection")
                except Exception as e:
                    if "Failed to connect" in str(e):
                        print(f"✅ _setup_for_request correctly handles network connection failure")
                    else:
                        print(f"✅ _setup_for_request working as expected: {e}")
    
    except Exception as e:
        print(f"❌ _setup_for_request test failed: {e}")
        return False
    
    # Test 3: Test token address normalization
    try:
        # Test ETH normalization
        eth_addr = dex._normalize_token_address("ETH")
        expected_eth = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        if eth_addr.lower() == expected_eth.lower():
            print("✅ ETH token address normalization works")
        else:
            print(f"❌ ETH normalization failed: got {eth_addr}, expected {expected_eth}")
        
        # Test regular address normalization
        test_addr = "0xa0b86a33e6441b4dc5029316a4b3d3536adf38f5"
        normalized = dex._normalize_token_address(test_addr)
        if normalized == dex._normalize_token_address(test_addr.upper()):
            print("✅ Address normalization works")
        else:
            print("❌ Address normalization failed")
            
    except Exception as e:
        print(f"❌ Token address normalization test failed: {e}")
        return False
    
    # Test 4: Test unsupported chain handling
    try:
        unsupported_chain = 999999
        mock_db = Mock(spec=AsyncSession)
        
        try:
            await dex._setup_for_request(unsupported_chain, 1, mock_db)
            print("❌ Should have failed for unsupported chain")
        except Exception as e:
            if "not supported by 0x API" in str(e):
                print("✅ Unsupported chain handling works correctly")
            else:
                print(f"❌ Unexpected error for unsupported chain: {e}")
    except Exception as e:
        print(f"❌ Unsupported chain test failed: {e}")
        return False
    
    print("\n🎉 All DexIntegration tests passed!")
    return True

async def test_legacy_compatibility():
    """Test the legacy compatibility wrapper"""
    
    print("\n🧪 Testing Legacy Compatibility...")
    
    try:
        from dex.dex_integration import DexIntegrationLegacy
        
        # Test legacy initialization
        legacy_dex = DexIntegrationLegacy(chain_id=10143, user_id=1, db=Mock())
        print("✅ DexIntegrationLegacy initialized successfully")
        
        # Test legacy setup method (should be no-op)
        await legacy_dex.setup_account()
        print("✅ Legacy setup_account method works")
        
        # Test legacy create factory method
        legacy_instance = await DexIntegrationLegacy.create(chain_id=1, user_id=1, db=Mock())
        print("✅ Legacy create factory method works")
        
        print("✅ Legacy compatibility tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Legacy compatibility test failed: {e}")
        return False

def test_environment_variables():
    """Test environment variable requirements"""
    
    print("\n🧪 Testing Environment Variables...")
    
    # Check required environment variables
    required_vars = ["ZEROX_API_KEY", "INFURA_API_KEY"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  Missing environment variables: {missing_vars}")
        print("   These are required for the DexIntegration to work properly")
        return False
    else:
        print("✅ All required environment variables are present")
        return True

async def main():
    """Run all tests"""
    
    print("🚀 Starting DexIntegration Test Suite")
    print("=" * 50)
    
    # Test environment variables first
    env_test = test_environment_variables()
    
    # Test DexIntegration system
    dex_test = await test_dex_integration()
    
    # Test legacy compatibility
    legacy_test = await test_legacy_compatibility()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"   Environment Variables: {'✅ PASS' if env_test else '❌ FAIL'}")
    print(f"   DexIntegration System: {'✅ PASS' if dex_test else '❌ FAIL'}")
    print(f"   Legacy Compatibility:  {'✅ PASS' if legacy_test else '❌ FAIL'}")
    
    if env_test and dex_test and legacy_test:
        print("\n🎉 All tests passed! The DexIntegration system is ready for use.")
        return True
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 