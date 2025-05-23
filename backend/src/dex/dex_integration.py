import os
import requests
import binascii
import logging
from web3 import Web3
from dotenv import load_dotenv
from eth_account import Account, messages
from web3.middleware import ExtraDataToPOAMiddleware

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DexIntegration:
    def __init__(self, chain_id: int = 10143):
        # Monad Testnet configuration
        self.rpc_url = os.getenv("RPC_URL")
        self.api_key = os.getenv("ZEROX_API_KEY")
        self.chain_id = chain_id  # Monad Testnet or as provided
        self.private_key = os.getenv("PRIVATE_KEY")
        self.native_token = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"  # MON
        self.permit2_address = Web3.to_checksum_address("0x000000000022D473030F116dDEE9F6B43aC78BA3")
        self.web3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.web3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        assert self.web3.is_connected(), "Failed to connect to Monad Testnet"
        self.account = Account.from_key(self.private_key)
        self.wallet_address = self.account.address
        self.base_url = "https://api.0x.org"

    def get_0x_quote(self, buy_token: str, amount: int, chain_id: int = None):
        """
        Get 0x API v2 quote with Permit2 support for buying any token.
        buy_token: address of the token to buy (e.g., USDC address)
        amount: amount of native token (MON) to sell, in wei
        chain_id: optional, overrides self.chain_id
        """
        url = f"{self.base_url}/swap/permit2/quote"
        params = {
            "chainId": chain_id if chain_id is not None else self.chain_id,
            "sellToken": self.native_token,
            "buyToken": buy_token,
            "sellAmount": str(amount),
            "taker": self.wallet_address,
            "slippageBps": "100"  # 1% slippage
        }
        headers = {
            "0x-api-key": self.api_key,
            "0x-version": "v2"
        }
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()

    def sign_permit2(self, permit_data: dict) -> str:
        """Sign Permit2 EIP-712 message"""
        message = messages.encode_structured_data(
            primaryType='Permit2',
            domain=permit_data['domain'],
            message=permit_data['message'],
            types=permit_data['types']
        )
        signed = Account.sign_message(message, private_key=self.private_key)
        return signed.signature.hex()

    def execute_trade(self, buy_token: str, amount: int, chain_id: int = None):
        """
        Executes a swap from MON (native) to any ERC20 token on Monad using 0x API.
        buy_token: address of the token to buy (e.g., USDC address)
        amount: amount of MON to sell, in wei
        chain_id: optional, overrides self.chain_id
        Returns transaction hash if successful, None otherwise.
        """
        try:
            quote = self.get_0x_quote(buy_token, amount, chain_id)
            tx_obj = quote.get('transaction', quote)

            # Permit2 signature handling
            if quote.get('permit2Data'):
                signature = self.sign_permit2(quote['permit2Data'])
                signature_bytes = bytes.fromhex(signature[2:] if signature.startswith('0x') else signature)
                sig_len = len(signature_bytes)
                sig_len_bytes = sig_len.to_bytes(32, byteorder='big')
                sig_len_hex = binascii.hexlify(sig_len_bytes).decode()
                transaction_data = (
                    tx_obj['data'].lstrip('0x') +
                    sig_len_hex +
                    signature_bytes.hex()
                )
                transaction_data = '0x' + transaction_data
            else:
                transaction_data = tx_obj['data']

            tx = {
                'chainId': tx_obj.get('chainId', chain_id if chain_id is not None else self.chain_id),
                'from': tx_obj.get('from', self.wallet_address),
                'to': Web3.to_checksum_address(tx_obj['to']),
                'data': transaction_data,
                'value': int(tx_obj.get('value', 0)),
                'gas': int(tx_obj.get('gas', 0)),
                'nonce': self.web3.eth.get_transaction_count(self.wallet_address),
            }

            if 'maxFeePerGas' in tx_obj and 'maxPriorityFeePerGas' in tx_obj:
                tx['maxFeePerGas'] = int(tx_obj['maxFeePerGas'])
                tx['maxPriorityFeePerGas'] = int(tx_obj['maxPriorityFeePerGas'])
                tx['type'] = '0x2'
            elif 'gasPrice' in tx_obj:
                tx['gasPrice'] = int(tx_obj['gasPrice'])

            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.raw_transaction)
            return tx_hash.hex()
        except Exception as e:
            logger.error(f"Failed to execute trade: {e}")
            return None