import os
import json
import requests
from web3 import Web3
from eth_abi import encode
from web3.middleware import ExtraDataToPOAMiddleware

# Configuration
RPC_URL = "https://sepolia.infura.io/v3/3e95d09ec0b04442b22c9679a3986768"
PRIVATE_KEY = "dfabd6cd20a0e7adb2e7f89eebaa0f1f66feacc84b5cb1608d95af29b937ef59"
ZEROX_API_KEY = "4ff6ad29-58af-4bc3-b320-fa3f2b63d30c"  # Get from https://dashboard.0x.org/

# Sepolia addresses
WETH = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14"
DAI = "0x7af963cF6D228E564e2A0aA0DdBF06210B38615D"
EXCHANGE_PROXY = "0xdef1c0ded9bec7f1a1670819833240f027b25eff"

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
assert w3.is_connected(), "Failed to connect to node"

# Wallet setup
account = w3.eth.account.from_key(PRIVATE_KEY)
wallet_address = account.address

def get_0x_quote(sell_token: str, buy_token: str, amount: int) -> dict:
    """Get swap quote from 0x API"""
    base_url = "https://sepolia.api.0x.org/swap/v1/quote"
    params = {
        "sellToken": sell_token,
        "buyToken": buy_token,
        "sellAmount": amount,
        "takerAddress": wallet_address,
    }
    
    headers = {"0x-api-key": ZEROX_API_KEY}
    response = requests.get(base_url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()

def approve_token(token_address: str, spender: str, amount: int) -> str:
    """Approve token spending"""
    erc20_abi = json.load(open('erc20_abi.json'))  # Standard ERC-20 ABI
    contract = w3.eth.contract(address=token_address, abi=erc20_abi)
    
    tx = contract.functions.approve(
        spender,
        amount
    ).build_transaction({
        'from': wallet_address,
        'gas': 200000,
        'gasPrice': w3.eth.gas_price,
        'nonce': w3.eth.get_transaction_count(wallet_address),
    })
    
    signed = account.sign_transaction(tx)
    return w3.eth.send_raw_transaction(signed.rawTransaction).hex()

def execute_swap(quote: dict) -> str:
    """Execute 0x swap using quote data"""
    tx = {
        'from': wallet_address,
        'to': Web3.to_checksum_address(quote['to']),
        'data': quote['data'],
        'value': int(quote['value']),
        'gas': int(quote['gas']),
        'gasPrice': int(quote['gasPrice']),
        'nonce': w3.eth.get_transaction_count(wallet_address),
    }
    
    if 'allowanceTarget' in quote:
        # Check and approve if needed
        erc20 = w3.eth.contract(
            address=quote['sellTokenAddress'],
            abi=json.load(open('erc20_abi.json')))
        
        allowance = erc20.functions.allowance(
            wallet_address,
            quote['allowanceTarget']
        ).call()
        
        if allowance < int(quote['sellAmount']):
            approve_tx = approve_token(
                quote['sellTokenAddress'],
                quote['allowanceTarget'],
                int(quote['sellAmount'])
            )
            w3.eth.wait_for_transaction_receipt(approve_tx)
    
    signed = account.sign_transaction(tx)
    return w3.eth.send_raw_transaction(signed.rawTransaction).hex()

def main():
    # Swap parameters
    amount_eth = 0.04
    amount_wei = w3.to_wei(amount_eth, 'ether')
    
    try:
        # Get swap quote
        quote = get_0x_quote(WETH, DAI, amount_wei)
        print(f"Quote received: {quote}")
        
        # Execute swap
        tx_hash = execute_swap(quote)
        print(f"Swap transaction sent: {tx_hash}")
        
        # Wait for confirmation
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Swap confirmed in block {receipt.blockNumber}")
        
    except requests.exceptions.HTTPError as e:
        print(f"0x API Error: {e.response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()