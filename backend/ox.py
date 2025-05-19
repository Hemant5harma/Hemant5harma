import requests
import os
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
import logging



logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50E4C7287F794"  # Sepolia WETH
LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"  # Sepolia LINK
USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"  # Sepolia USDC
base_url = "https://api.0x.org"
base_url_testnet = "https://sepolia.api.0x.org"
api_key = "642b3bde-94d3-43f0-80dc-1bcd6433042d"

# def get_current_price():  # 1 ETH in wei
#     headers = {"0x-api-key": api_key, "0x-version": "v2"}
#     params = {
#         "chainId": 1,  # Ethereum mainnet
#         "sellToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",  # Mainnet WETH
#         "buyToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",   # Mainnet USDC
#         "sellAmount": 1000000000000000,  # 1 WETH in wei
#     }
#     try:
#         response = requests.get(f"{base_url}/swap/allowance-holder/price", headers=headers, params=params)
#         response.raise_for_status()
#         return response.json()
#     except requests.RequestException as e:
#         logger.error(f"Failed to get price: {e}")
#         return None

# my_res = get_current_price()
# print(my_res)


def get_current_price():  # 1 ETH in wei
    headers = {"0x-api-key": api_key}
    params = {
        # "chainId": 1,  # Ethereum mainnet
        "sellToken": "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",  # Mainnet WETH
        "buyToken": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",   # Mainnet USDC
        "sellAmount": 1000000000000000000,  # 1 WETH in wei
    }
    try:
        response = requests.get(f"{base_url_testnet}/swap/v1/price", headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Failed to get price: {e}")
        return None

my_res = get_current_price()
print(my_res)