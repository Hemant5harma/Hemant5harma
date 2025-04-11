import requests
import os
from web3 import Web3
from web3.middleware import geth_poa_middleware
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DexIntegration:
    def __init__(self):
        self.api_key = os.getenv("ZEROX_API_KEY")
        self.web3 = Web3(Web3.HTTPProvider(os.getenv("SEPOLIA_INFURA_URL")))  # Updated to Sepolia
        self.web3.middleware_onion.inject(geth_poa_middleware, layer=0)
        self.account = self.web3.eth.account.from_key(os.getenv("SEPOLIA_PRIVATE_KEY"))  # Testnet private key
        self.base_url = "https://sepolia.api.0x.org"  # 0x Swap API for Sepolia
        self.weth_address = "0x7b79995e5f793A07Bc00c21412e50E4C7287F794"  # WETH on Sepolia

    def get_current_price(self, sell_token: str = "ETH", buy_token: str = None, amount: str = "1000000000000000000"):  # 1 ETH in wei
        headers = {"0x-api-key": self.api_key}
        params = {
            "sellToken": sell_token if sell_token != "ETH" else self.weth_address,
            "buyToken": buy_token if buy_token else self.weth_address,
            "sellAmount": amount
        }
        try:
            response = requests.get(f"{self.base_url}/swap/v1/price", headers=headers, params=params)
            response.raise_for_status()
            return float(response.json()["price"])
        except requests.RequestException as e:
            logger.error(f"Failed to get price: {e}")
            return None

    def execute_trade(self, sell_token: str = "ETH", buy_token: str = None, amount: str = "1000000000000000000"):  # 1 ETH in wei
        headers = {"0x-api-key": self.api_key}
        params = {
            "sellToken": sell_token if sell_token != "ETH" else self.weth_address,
            "buyToken": buy_token if buy_token else self.weth_address,
            "sellAmount": amount
        }
        try:
            response = requests.get(f"{self.base_url}/swap/v1/quote", headers=headers, params=params)
            response.raise_for_status()
            quote = response.json()
            tx = {
                "from": self.account.address,
                "to": quote["to"],
                "data": quote["data"],
                "value": quote.get("value", "0x0"),  # Ensure value is provided or default to 0
                "gas": int(quote["gas"], 16),
                "gasPrice": int(quote["gasPrice"], 16),
                "nonce": self.web3.eth.get_transaction_count(self.account.address)
            }
            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            return tx_hash.hex()
        except requests.RequestException as e:
            logger.error(f"Failed to get quote: {e}")
            return None
        except Exception as e:
            logger.error(f"Failed to execute trade: {e}")
            return None