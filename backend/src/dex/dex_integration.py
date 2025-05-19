import requests
import os
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DexIntegration:
    def __init__(self):
        self.api_key = os.getenv("642b3bde-94d3-43f0-80dc-1bcd6433042d")
        self.web3 = Web3(Web3.HTTPProvider(os.getenv("https://sepolia.infura.io/v3/3e95d09ec0b04442b22c9679a3986768")))  # Updated to Sepolia
        self.web3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        self.account = self.web3.eth.account.from_key(os.getenv("dfabd6cd20a0e7adb2e7f89eebaa0f1f66feacc84b5cb1608d95af29b937ef59"))  # Testnet private key
        self.base_url = "https://api.0x.org"  # 0x Swap API for Sepolia
        self.weth_address = "0x7b79995e5f793A07Bc00c21412e50E4C7287F794"  # WETH on Sepolia

    def get_current_price(self, sell_token: str = "ETH", buy_token: str = None, amount: str = "1000000000000000000"):  # 1 ETH in wei
        headers = {"0x-api-key": self.api_key}
        params = {
            "chainId": 1,
            "sellToken": sell_token if sell_token != "ETH" else self.weth_address,
            "buyToken": buy_token if buy_token else self.weth_address,
            "sellAmount": amount,
            "taker" : "0x22a13564643E88771D451594983D908cb91ef4a5"
        }
        try:
            response = requests.get(f"{self.base_url}/swap/permit2/price", headers=headers, params=params)
            response.raise_for_status()
            return float(response.json()["price"])
        except requests.RequestException as e:
            logger.error(f"Failed to get price: {e}")
            return None

    def execute_trade(self, sell_token: str = "ETH", buy_token: str = None, amount: str = "1000000000000000000"):
        headers = {"0x-api-key": self.api_key}
        params = {
            "sellToken": sell_token if sell_token != "ETH" else self.weth_address,
            "buyToken": buy_token if buy_token else self.weth_address,
            "sellAmount": amount
        }
        try:
            response = requests.get(f"{self.base_url}/swap/permit2/quote", headers=headers, params=params)
            response.raise_for_status()
            quote = response.json()

            # Check for required fields
            required_fields = ["to", "data", "gas", "gasPrice"]
            for field in required_fields:
                if field not in quote or quote[field] is None:
                    logger.error(f"0x API quote missing required field: {field}")
                    return None

            tx = {
                "from": self.account.address,
                "to": quote["to"],
                "data": quote["data"],
                "value": int(quote.get("value", "0")),
                "gas": int(quote["gas"]),
                "gasPrice": int(quote["gasPrice"]),
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