# import os
# import time
# from web3 import Web3
# from eth_abi import encode
# from universal_router_abi import UNIVERSAL_ROUTER_ABI  # Make sure this ABI is correct

# # Constants
# RPC_URL = "https://sepolia.infura.io/v3/3e95d09ec0b04442b22c9679a3986768"
# PRIVATE_KEY = "dfabd6cd20a0e7adb2e7f89eebaa0f1f66feacc84b5cb1608d95af29b937ef59"

# # Web3 Init
# w3 = Web3(Web3.HTTPProvider(RPC_URL))
# assert w3.is_connected(), "Web3 provider not connected"

# # Wallet & Addresses
# account = w3.eth.account.from_key(PRIVATE_KEY)
# wallet_address = account.address

# UNIVERSAL_ROUTER = Web3.to_checksum_address("0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD")
# WETH = Web3.to_checksum_address("0xfff9976782d46cc05630d1f6ebab18b2324d6b14")
# DAI = Web3.to_checksum_address("0xff34b3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357")

# # Create contract instance
# router = w3.eth.contract(address=UNIVERSAL_ROUTER, abi=UNIVERSAL_ROUTER_ABI)

# # Amounts
# amount_in_eth = 0.001
# amount_in = w3.to_wei(amount_in_eth, 'ether')

# # Deadline
# deadline = int(time.time()) + 600

# # Command for V3_SWAP_EXACT_IN (Uniswap opcode)
# COMMAND_SWAP_EXACT_IN = b'\x0b'

# def main():
#     print(f"Using wallet: {wallet_address}")

#     # Construct swap path: WETH -> fee tier -> DAI
#     fee = 3000  # 0.3% pool fee
#     path = WETH[2:].lower() + f"{fee:06x}" + DAI[2:].lower()  # Remove '0x' and format
#     path_bytes = bytes.fromhex(path)
    
#     print(f"Path (hex): {path}")

#     # Encode input parameters for V3_SWAP_EXACT_IN
#     input_data = encode(
#         ['address', 'uint256', 'uint256', 'bytes', 'bool'],
#         [wallet_address, amount_in, 0, path_bytes, True]  # amountOutMin=0 for testing
#     )

#     # Build transaction
#     txn = router.functions.execute(
#         COMMAND_SWAP_EXACT_IN,  # Command byte
#         [input_data]            # Encoded parameters
#     ).build_transaction({
#         'from': wallet_address,
#         'value': amount_in,     # ETH to swap
#         'gas': 200000,         # Adjusted gas limit
#         'gasPrice': w3.eth.gas_price,
#         'nonce': w3.eth.get_transaction_count(wallet_address),
#     })

#     # Sign, send, and wait for receipt
#     signed_txn = w3.eth.account.sign_transaction(txn, private_key=PRIVATE_KEY)
#     tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
#     print(f"Transaction sent: {tx_hash.hex()}")
    
#     receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
#     print(f"Confirmed in block {receipt.blockNumber}")
#     print("Logs:", receipt.logs)

# if __name__ == '__main__':
#     main()


import os
import time
from web3 import Web3
from eth_abi import encode
from web3.middleware import ExtraDataToPOAMiddleware
from universal_router_abi import UNIVERSAL_ROUTER_ABI
from erc20_abi import ERC20_ABI

# Constants
RPC_URL = "https://sepolia.infura.io/v3/3e95d09ec0b04442b22c9679a3986768"
PRIVATE_KEY = "dfabd6cd20a0e7adb2e7f89eebaa0f1f66feacc84b5cb1608d95af29b937ef59"

# Web3 Initialization
w3 = Web3(Web3.HTTPProvider(RPC_URL))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
assert w3.is_connected(), "Web3 provider not connected"

# Wallet and Contract Addresses
account = w3.eth.account.from_key(PRIVATE_KEY)
wallet_address = account.address

# Sepolia Addresses - Use USDC instead of DAI for better liquidity
UNIVERSAL_ROUTER = Web3.to_checksum_address("0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD")
WETH = Web3.to_checksum_address("0xfff9976782d46cc05630d1f6ebab18b2324d6b14")
USDC = Web3.to_checksum_address("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238")  # Sepolia USDC

# Contract Instances
router = w3.eth.contract(address=UNIVERSAL_ROUTER, abi=UNIVERSAL_ROUTER_ABI)
weth_contract = w3.eth.contract(address=WETH, abi=ERC20_ABI)

# Swap Parameters
amount_in_eth = 0.001
amount_in = w3.to_wei(amount_in_eth, 'ether')
fee = 500  # Try 0.05% fee tier for better liquidity

def check_pool_exists():
    """Check if the WETH/USDC pool exists"""
    try:
        # You can add pool existence check here using Uniswap V3 Factory
        print("Pool existence check - implement factory.getPool() call")
        return True
    except Exception as e:
        print(f"Pool check failed: {e}")
        return False

def main():
    print(f"Using wallet: {wallet_address}")
    
    # Check WETH balance first
    weth_balance = weth_contract.functions.balanceOf(wallet_address).call()
    print(f"WETH Balance: {w3.from_wei(weth_balance, 'ether')} WETH")
    
    if weth_balance < amount_in:
        print("Insufficient WETH balance!")
        return

    # Step 1: Approve Universal Router to spend WETH
    print("Step 1: Approving WETH...")
    approve_txn = weth_contract.functions.approve(
        UNIVERSAL_ROUTER,
        amount_in
    ).build_transaction({
        'from': wallet_address,
        'gas': 100000,
        'gasPrice': w3.eth.gas_price,
        'nonce': w3.eth.get_transaction_count(wallet_address),
    })

    signed_approve = w3.eth.account.sign_transaction(approve_txn, PRIVATE_KEY)
    approve_hash = w3.eth.send_raw_transaction(signed_approve.raw_transaction)
    print(f"Approval sent: {approve_hash.hex()}")
    
    approve_receipt = w3.eth.wait_for_transaction_receipt(approve_hash)
    print(f"Approval confirmed in block {approve_receipt.blockNumber}")

    # Step 2: Build Swap Path (WETH -> USDC)
    print("Step 2: Building swap path...")
    path = WETH[2:].lower() + f"{fee:06x}" + USDC[2:].lower()
    path_bytes = bytes.fromhex(path)
    print(f"Swap path: {path}")

    # Step 3: Calculate minimum output (with 1% slippage tolerance)
    # For testnet, you might want to set this to 0 or a very low value
    min_amount_out = 0  # Set to 0 for testing, calculate properly for mainnet

    # Step 4: Encode Swap Parameters
    print("Step 3: Encoding swap parameters...")
    input_data = encode(
        ['address', 'uint256', 'uint256', 'bytes', 'bool'],
        [wallet_address, amount_in, min_amount_out, path_bytes, True]
    )

    # Step 5: Execute Swap
    print("Step 4: Executing swap...")
    try:
        txn = router.functions.execute(
            b'\x0b',  # V3_SWAP_EXACT_IN command
            [input_data]
        ).build_transaction({
            'from': wallet_address,
            'gas': 300000,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(wallet_address),
        })

        signed_txn = w3.eth.account.sign_transaction(txn, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        print(f"Swap transaction sent: {tx_hash.hex()}")

        # Wait for confirmation (only once!)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Swap confirmed in block {receipt.blockNumber}")
        
        # Check transaction status
        if receipt.status == 1:
            print("✅ Swap successful!")
        else:
            print("❌ Swap failed!")
            
        print("Transaction logs:")
        for i, log in enumerate(receipt.logs):
            print(f"  Log {i}: {log}")

    except Exception as e:
        print(f"Swap execution failed: {e}")
        return

    # Step 6: Check balances after swap
    print("\nStep 5: Checking balances...")
    
    # Check USDC balance (USDC has 6 decimals, not 18!)
    usdc_contract = w3.eth.contract(address=USDC, abi=ERC20_ABI)
    usdc_balance = usdc_contract.functions.balanceOf(wallet_address).call()
    usdc_decimals = 6  # USDC has 6 decimals
    print(f"USDC Balance: {usdc_balance / (10 ** usdc_decimals)} USDC")
    
    # Check remaining WETH balance
    weth_balance_after = weth_contract.functions.balanceOf(wallet_address).call()
    print(f"WETH Balance: {w3.from_wei(weth_balance_after, 'ether')} WETH")

if __name__ == '__main__':
    main()