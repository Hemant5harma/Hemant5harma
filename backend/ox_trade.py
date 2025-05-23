import os
import requests
from web3 import Web3
from eth_account import Account, messages
from web3.middleware import ExtraDataToPOAMiddleware
import binascii

# Configuration
RPC_URL = os.getenv("RPC_URL", "https://testnet-rpc.monad.xyz")
ZEROX_API_KEY = "4ff6ad29-58af-4bc3-b320-fa3f2b63d30c"
CHAIN_ID = 10143  # Monad Testnet
PRIVATE_KEY = "dfabd6cd20a0e7adb2e7f89eebaa0f1f66feacc84b5cb1608d95af29b937ef59"

# Verified Monad Testnet addresses (as of latest deployment)
NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"  # For MON token
USDT_ADDRESS = Web3.to_checksum_address("0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D")  # USDC contract
USDC_ADDRESS = Web3.to_checksum_address("0xf817257fed379853cDe0fa4F97AB987181B1E5Ea")  # USDC contract
PERMIT2_ADDRESS = Web3.to_checksum_address("0x000000000022D473030F116dDEE9F6B43aC78BA3")  # 0x Permit2

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
assert w3.is_connected(), "Failed to connect to Monad Testnet"

# Wallet setup
account = Account.from_key(PRIVATE_KEY)
wallet_address = account.address

def get_0x_quote(sell_token: str, buy_token: str, sell_amount: int) -> dict:
    """Get 0x API v2 quote with Permit2 support"""
    url = "https://api.0x.org/swap/permit2/quote"
    params = {
        "chainId": CHAIN_ID,  # chainId is required
        "sellToken": sell_token,
        "buyToken": buy_token,
        "sellAmount": str(sell_amount),
        "taker": wallet_address,  # 'takerAddress' renamed to 'taker'
        "slippageBps": "100"  # 1% slippage
    }
    headers = {
        "0x-api-key": ZEROX_API_KEY,
        "0x-version": "v2"
    }
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()

def sign_permit2(permit_data: dict) -> str:
    """Sign Permit2 EIP-712 message"""
    message = messages.encode_structured_data(
        primaryType='Permit2',
        domain=permit_data['domain'],
        message=permit_data['message'],
        types=permit_data['types']
    )
    signed = Account.sign_message(message, private_key=PRIVATE_KEY)
    return signed.signature.hex()

def execute_swap(quote: dict) -> str:
    """Execute swap with Permit2 signature handling and proper signature length encoding"""
    tx_obj = quote.get('transaction', quote)  # Prefer 'transaction' key if present

    # Permit2 signature handling
    if quote.get('permit2Data'):
        signature = sign_permit2(quote['permit2Data'])
        signature_bytes = bytes.fromhex(signature[2:] if signature.startswith('0x') else signature)
        sig_len = len(signature_bytes)
        # 32-byte big-endian unsigned integer for signature length
        sig_len_bytes = sig_len.to_bytes(32, byteorder='big')
        sig_len_hex = binascii.hexlify(sig_len_bytes).decode()
        # Concatenate: data + sig_len + signature (all as hex, no '0x')
        transaction_data = (
            tx_obj['data'].lstrip('0x') +
            sig_len_hex +
            signature_bytes.hex()
        )
        transaction_data = '0x' + transaction_data
    else:
        transaction_data = tx_obj['data']

    # Construct transaction using all fields from the quote's transaction object
    tx = {
        'chainId': tx_obj.get('chainId', CHAIN_ID),
        'from': tx_obj.get('from', wallet_address),
        'to': Web3.to_checksum_address(tx_obj['to']),
        'data': transaction_data,
        'value': int(tx_obj.get('value', 0)),
        'gas': int(tx_obj.get('gas', 0)),
        'nonce': w3.eth.get_transaction_count(wallet_address),
    }

    # Add gas price fields if present (EIP-1559 or legacy)
    if 'maxFeePerGas' in tx_obj and 'maxPriorityFeePerGas' in tx_obj:
        tx['maxFeePerGas'] = int(tx_obj['maxFeePerGas'])
        tx['maxPriorityFeePerGas'] = int(tx_obj['maxPriorityFeePerGas'])
        tx['type'] = '0x2'
    elif 'gasPrice' in tx_obj:
        tx['gasPrice'] = int(tx_obj['gasPrice'])
   

    # Sign and send transaction
    signed_tx = account.sign_transaction(tx)
    return w3.eth.send_raw_transaction(signed_tx.raw_transaction).hex()

def main():
    try:
        # Swap 0.4 MON (native) to USDC
        sell_amount = w3.to_wei(0.00001, 'ether')  # MON has 18 decimals
        print("sell amount", sell_amount)
        
        # Get quote
        quote = get_0x_quote(NATIVE_TOKEN, USDC_ADDRESS, sell_amount)
        print(f"Quote Details:\nBuy Amount: {quote['buyAmount']} USDC")
        
        # Execute swap
        tx_hash = execute_swap(quote)
        print(f"Transaction Hash: {tx_hash}")
        
        # Wait for confirmation
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Confirmed in block {receipt['blockNumber']}")
        print(f"Status: {'Success' if receipt['status'] else 'Failed'}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()