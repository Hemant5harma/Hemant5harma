from web3 import Web3
from core.config import settings

class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(f"https://mainnet.infura.io/v3/{settings.INFURA_API_KEY}"))
        self.contract = self.w3.eth.contract(
            address=settings.CONTRACT_ADDRESS,
            abi=self._load_abi()
        )

    def _load_abi(self):
        # Load ABI from file
        with open("contracts/abis/DCABot.json") as f:
            return json.load(f)

    async def create_strategy(self, amount: int, interval: int):
        nonce = self.w3.eth.get_transaction_count(self.w3.eth.account.from_key(settings.PRIVATE_KEY).address)
        
        tx = self.contract.functions.createStrategy(
            amount, interval
        ).build_transaction({
            'chainId': 1,
            'gas': 200000,
            'gasPrice': self.w3.to_wei('50', 'gwei'),
            'nonce': nonce
        })
        
        signed_tx = self.w3.eth.account.sign_transaction(tx, settings.PRIVATE_KEY)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        return {"tx_hash": tx_hash.hex()}