import base58
import json
import requests
import time
from typing import Dict, Any, List, Optional, Tuple
from solders.pubkey import Pubkey
from solders.keypair import Keypair
from solana.rpc.api import Client
from solana.rpc.types import TxOpts
from solana.rpc.commitment import Confirmed
from solders.transaction import VersionedTransaction
from solders.message import to_bytes_versioned
import base64

class JupiterSwapper:
    """
    A class to handle token swaps on Solana using Jupiter Aggregator API.
    """

    def __init__(self, private_key: str, rpc_url: str = "https://api.devnet.solana.com"):
        """
        Initialize the Jupiter Swapper.
        
        Args:
            private_key: Base58 encoded private key
            rpc_url: Solana RPC URL (defaults to testnet)
        """
        self.client = Client(rpc_url)
        
        # Load wallet from private key
        try:
            decoded_key = base58.b58decode(private_key)
            # Handle both 32-byte and 64-byte private keys
            if len(decoded_key) == 32:
                # 32-byte private key - create keypair from seed
                self.keypair = Keypair.from_seed(decoded_key)
            elif len(decoded_key) == 64:
                # 64-byte keypair bytes - use directly
                self.keypair = Keypair.from_bytes(decoded_key)
            else:
                raise ValueError(f"Invalid private key length: {len(decoded_key)} bytes")
        except Exception as e:
            print(f"Error loading keypair: {e}")
            print("Generating a new keypair for testing...")
            self.keypair = Keypair()
            print(f"New keypair generated. Public key: {self.keypair.pubkey()}")
            print(f"Private key (save this): {base58.b58encode(bytes(self.keypair)[:32]).decode()}")
        
        self.wallet_pubkey = self.keypair.pubkey()
        print(f"Wallet address: {self.wallet_pubkey}")
        
        # Check wallet balance
        try:
            balance_response = self.client.get_balance(self.wallet_pubkey)
            balance = balance_response.value if hasattr(balance_response, 'value') else 0
            if balance == 0:
                print("Warning: Wallet has zero balance. Please fund your devnet wallet.")
                print(f"Send devnet SOL to: {self.wallet_pubkey}")
                print("Get devnet SOL from: https://faucet.solana.com/")
            else:
                print(f"Wallet balance: {balance / 1_000_000_000:.6f} SOL")
        except Exception as e:
            print(f"Error checking balance: {e}")

    def get_token_accounts(self) -> List[Dict[str, Any]]:
        """Get all token accounts for the wallet"""
        try:
            token_program_id = Pubkey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
            from solana.rpc.types import TokenAccountOpts
            response = self.client.get_token_accounts_by_owner(
                self.wallet_pubkey,
                opts=TokenAccountOpts(program_id=token_program_id)
            )
            
            if not hasattr(response, 'value') or not response.value:
                return []
                
            accounts = []
            for account in response.value:
                try:
                    # Parse token account data
                    data = account.account.data
                    if len(data) >= 72:
                        # Extract mint (first 32 bytes)
                        mint_bytes = data[:32]
                        mint = str(Pubkey.from_bytes(mint_bytes))
                        
                        # Extract amount (bytes 64-72, 8 bytes little endian)
                        amount = int.from_bytes(data[64:72], byteorder='little')
                        
                        accounts.append({
                            'mint': mint,
                            'amount': amount,
                            'pubkey': str(account.pubkey)
                        })
                except Exception as e:
                    print(f"Error parsing token account: {e}")
                    continue
            
            return accounts
        except Exception as e:
            print(f"Error getting token accounts: {e}")
            return []

    def get_swap_quote(self, input_mint: str, output_mint: str, amount: int) -> Dict[str, Any]:
        """
        Get swap quote from Jupiter API.
        
        Args:
            input_mint: Input token mint address
            output_mint: Output token mint address
            amount: Amount in smallest units to swap
            
        Returns:
            Quote data from Jupiter API
        """
        url = "https://quote-api.jup.ag/v6/quote"
        params = {
            "inputMint": input_mint,
            "outputMint": output_mint,
            "amount": str(amount),
            "slippageBps": "100",  # 1% slippage tolerance
            "onlyDirectRoutes": "false",
            "asLegacyTransaction": "false"
        }
        
        print(f"Getting quote for {amount} units of {input_mint} -> {output_mint}")
        
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code != 200:
            raise Exception(f"Error getting swap quote: {response.status_code} - {response.text}")
        
        quote_data = response.json()
        
        if 'outAmount' not in quote_data:
            raise Exception(f"Invalid quote response: {quote_data}")
            
        print(f"Quote received - Output amount: {quote_data.get('outAmount')}")
        print(f"Price impact: {float(quote_data.get('priceImpactPct', 0)) * 100:.4f}%")
        return quote_data

    def get_swap_transaction(self, quote_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get swap transaction data from Jupiter API.
        
        Args:
            quote_response: Quote response from get_swap_quote
            
        Returns:
            Transaction data
        """
        url = "https://quote-api.jup.ag/v6/swap"
        
        swap_data = {
            "quoteResponse": quote_response,
            "userPublicKey": str(self.wallet_pubkey),
            "wrapAndUnwrapSol": True,
            "asLegacyTransaction": False
        }
        
        response = requests.post(url, json=swap_data, timeout=30)
        
        if response.status_code != 200:
            raise Exception(f"Error building swap transaction: {response.status_code} - {response.text}")
        
        return response.json()

    def execute_swap(self, input_mint: str, output_mint: str, amount: int) -> Tuple[str, Dict[str, Any]]:
        """
        Execute a token swap on Solana testnet.
        
        Args:
            input_mint: Input token mint address
            output_mint: Output token mint address
            amount: Amount in smallest units to swap
            
        Returns:
            Tuple with transaction signature and response
        """
        print("Step 1: Getting swap quote...")
        quote = self.get_swap_quote(input_mint, output_mint, amount)
        
        print("Step 2: Building swap transaction...")
        swap_transaction_data = self.get_swap_transaction(quote)
        
        if "swapTransaction" not in swap_transaction_data:
            raise Exception(f"Transaction data missing: {swap_transaction_data}")
            
        serialized_tx = swap_transaction_data["swapTransaction"]
        
        print("Step 3: Submitting transaction...")
        
        # Decode the transaction
        transaction_bytes = base64.b64decode(serialized_tx)
        
        # Submit the transaction as raw bytes
        try:
            send_response = self.client.send_raw_transaction(
                transaction_bytes,
                opts=TxOpts(skip_preflight=False, preflight_commitment=Confirmed)
            )
            
            tx_sig = str(send_response.value)
            print(f"Transaction submitted: {tx_sig}")
            
            # Wait for confirmation
            print("Step 4: Waiting for transaction confirmation...")
            confirmation = self.confirm_transaction(tx_sig)
            
            if confirmation:
                print(f"✅ Transaction confirmed!")
                print(f"🔗 View on explorer: https://explorer.solana.com/tx/{tx_sig}?cluster=devnet")
            else:
                print(f"⚠️  Transaction may have failed.")
                print(f"🔗 Check explorer: https://explorer.solana.com/tx/{tx_sig}?cluster=devnet")
                
            return tx_sig, {"result": tx_sig}
            
        except Exception as e:
            print(f"Error sending transaction: {e}")
            raise

    def confirm_transaction(self, signature: str, max_retries: int = 30, retry_interval: int = 2) -> bool:
        """Wait for transaction confirmation"""
        from solders.signature import Signature
        sig = Signature.from_string(signature)
        
        for i in range(max_retries):
            try:
                print(f"Checking confirmation... ({i+1}/{max_retries})")
                response = self.client.get_transaction(sig, commitment=Confirmed)
                if response.value is not None:
                    return True
                time.sleep(retry_interval)
            except Exception as e:
                print(f"Error checking transaction: {e}")
                time.sleep(retry_interval)
        return False


def generate_testnet_wallet():
    """Generate a new testnet wallet"""
    keypair = Keypair()
    private_key = base58.b58encode(bytes(keypair)).decode()
    public_key = keypair.pubkey()
    
    print("=== New Testnet Wallet Generated ===")
    print(f"Public Key (Address): {public_key}")
    print(f"Private Key: {private_key}")
    print("\n🚨 IMPORTANT: Save your private key securely!")
    print("🚨 This is for DEVNET only - never use on mainnet!")
    print(f"\n💰 Fund this wallet with devnet SOL: https://faucet.solana.com/")
    print(f"📋 Wallet address to fund: {public_key}")
    
    return private_key, str(public_key)


def main():
    print("=== Solana Devnet Token Swap with Jupiter ===\n")
    
    # Option to generate new wallet or use existing
    use_existing = input("Do you have a devnet private key? (y/n): ").lower().strip()
    
    if use_existing == 'y':
        private_key = input("Enter your devnet private key: ").strip()
    else:
        print("\nGenerating new devnet wallet...")
        private_key, wallet_address = generate_testnet_wallet()
        
        input(f"\n⏳ Please fund your wallet with devnet SOL and press Enter to continue...")
    
    try:
        # Initialize the swapper with the provided private key
        swapper = JupiterSwapper(private_key)
        
        # Show token accounts
        print("\n=== Your Token Accounts ===")
        token_accounts = swapper.get_token_accounts()
        if token_accounts:
            for account in token_accounts:
                print(f"- Mint: {account['mint']}")
                print(f"  Amount: {account['amount']}")
                print(f"  Account: {account['pubkey']}\n")
        else:
            print("No token accounts found or only SOL available.")
        
        # Token addresses for devnet
        SOL_MINT = "So11111111111111111111111111111111111111112"  # Wrapped SOL
        
        # USDC on devnet
        USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
        
        # Amount to swap (0.001 SOL = 1,000,000 lamports)
        amount = 1_000_000
        
        print(f"\n=== Attempting Swap ===")
        print(f"From: SOL (Wrapped)")
        print(f"To: USDC")
        print(f"Amount: {amount / 1_000_000_000:.6f} SOL")
        
        # Get quote first to check if route exists
        try:
            quote = swapper.get_swap_quote(SOL_MINT, USDC_DEVNET, amount)
            print(f"✅ Route found! Expected output: {quote.get('outAmount')} USDC units")
            
            proceed = input("\nProceed with swap? (y/n): ").lower().strip()
            if proceed == 'y':
                tx_sig, response = swapper.execute_swap(SOL_MINT, USDC_DEVNET, amount)
                print(f"\n🎉 Swap completed!")
                print(f"Transaction: {tx_sig}")
                
                # Check updated balances
                print("\n=== Updated Token Accounts ===")
                updated_accounts = swapper.get_token_accounts()
                for account in updated_accounts:
                    print(f"- Mint: {account['mint']}, Amount: {account['amount']}")
            else:
                print("Swap cancelled.")
                
        except Exception as e:
            print(f"❌ Could not get quote or route not available: {str(e)}")
            print("\n💡 This might be because:")
            print("- The token pair doesn't exist on devnet")
            print("- Insufficient liquidity on devnet")
            print("- Token addresses are not valid for devnet")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("\n💡 Common issues:")
        print("- Invalid private key format")
        print("- No testnet SOL in wallet")
        print("- Network connectivity issues")


if __name__ == "__main__":
    main()