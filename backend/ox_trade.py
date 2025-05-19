import os
from dotenv import load_dotenv
from web3 import Web3
from uniswap import uniswap

# Load environment variables
load_dotenv()

# Retrieve environment variables
INFURA_URL = os.getenv("https://sepolia.infura.io/v3/3e95d09ec0b04442b22c9679a3986768")  # e.g., "https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
PRIVATE_KEY = os.getenv("dfabd6cd20a0e7adb2e7f89eebaa0f1f66feacc84b5cb1608d95af29b937ef59")  # Your private key
ADDRESS = os.getenv("0x22a13564643E88771D451594983D908cb91ef4a5")  # Your wallet address

# Initialize Web3 provider
provider = Web3(Web3.HTTPProvider(INFURA_URL))

# Initialize Uniswap client for v3
uniswap = uniswap(address=ADDRESS, private_key=PRIVATE_KEY, provider=provider, version=3)

# Define token addresses
WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50E4C7287F794"  # Sepolia WETH
LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"  # Sepolia LINK
USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"  # Sepolia USDC

# Define amount to swap (e.g., 0.01 LINK)
AMOUNT = 0.01
LINK_DECIMALS = 18  # Adjust based on the token's decimals
amount_in_wei = int(AMOUNT * (10 ** LINK_DECIMALS))

# Approve token spending
uniswap.approve(LINK_ADDRESS, max_approval=amount_in_wei)

# Perform the swap
tx_hash = uniswap.make_trade(LINK_ADDRESS, USDC_ADDRESS, amount_in_wei, fee=3000)
print(f"Transaction Hash: {tx_hash.hex()}")
