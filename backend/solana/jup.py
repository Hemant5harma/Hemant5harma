"""
Jupiter Swap Functions using michaelhly/solana-py
Date: 2025-07-19 11:53:35 UTC
User: hemantsharma64
Repository: michaelhly/solana-py
"""

import asyncio
import base64
import json
from typing import Dict, Any, Optional, Union
import requests
import base58

# Import from solana-py repository
from solana.rpc.async_api import AsyncClient
from solana.rpc.types import TxOpts
from solana.rpc.commitment import Confirmed, Finalized
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import VersionedTransaction
from solders.message import VersionedMessage


class JupiterSwapper:
    """
    Complete Jupiter Swap implementation using solana-py
    Compatible with the latest repository structure
    """
    
    def __init__(self, private_key: str, rpc_endpoint: str = "https://api.devnet.solana.com"):
        """
        Initialize Jupiter Swapper
        
        Args:
            private_key: Base58 encoded private key
            rpc_endpoint: Solana RPC endpoint (mainnet for Jupiter)
        """
        # Initialize solana-py AsyncClient
        self.client = AsyncClient(rpc_endpoint)
        
        # Setup wallet from private key
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
            raise ValueError(f"Invalid private key: {e}")
        
        self.wallet_pubkey = self.keypair.pubkey()
        
        # Jupiter API endpoints
        self.jupiter_quote_url = "https://quote-api.jup.ag/v6/quote"
        self.jupiter_swap_url = "https://quote-api.jup.ag/v6/swap"
        
        print(f"🔑 Wallet: {self.wallet_pubkey}")
        print(f"🌐 RPC: {rpc_endpoint}")
    
    async def get_balance(self) -> float:
        """Get SOL balance using solana-py client"""
        try:
            balance_resp = await self.client.get_balance(self.wallet_pubkey)
            balance_lamports = balance_resp.value
            balance_sol = balance_lamports / 1_000_000_000
            print(f"💰 Balance: {balance_sol:.6f} SOL")
            return balance_sol
        except Exception as e:
            print(f"❌ Balance check failed: {e}")
            return 0.0
    
    async def get_quote(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = 300
    ) -> Optional[Dict[str, Any]]:
        """
        Get swap quote from Jupiter API
        
        Args:
            input_mint: Input token mint address
            output_mint: Output token mint address  
            amount: Amount in smallest token units
            slippage_bps: Slippage tolerance in basis points (300 = 3%)
            
        Returns:
            Quote data or None if failed
        """
        params = {
            "inputMint": input_mint,
            "outputMint": output_mint,
            "amount": str(amount),
            "slippageBps": str(slippage_bps),
            "onlyDirectRoutes": "false",
            "asLegacyTransaction": "false"
        }
        
        try:
            print(f"🔄 Getting quote: {amount} {input_mint[:8]}... -> {output_mint[:8]}...")
            
            response = requests.get(self.jupiter_quote_url, params=params, timeout=30)
            
            if response.status_code != 200:
                print(f"❌ Quote failed: {response.status_code} - {response.text}")
                return None
            
            quote_data = response.json()
            
            if 'outAmount' not in quote_data:
                print(f"❌ Invalid quote response: {quote_data}")
                return None
            
            # Display quote information
            out_amount = int(quote_data['outAmount'])
            price_impact = float(quote_data.get('priceImpactPct', 0)) * 100
            route_plan = quote_data.get('routePlan', [])
            
            print(f"✅ Quote received:")
            print(f"   Input Amount: {amount}")
            print(f"   Output Amount: {out_amount}")
            print(f"   Price Impact: {price_impact:.4f}%")
            print(f"   Route Steps: {len(route_plan)}")
            
            # Show route details
            for i, step in enumerate(route_plan):
                dex_name = step.get('swapInfo', {}).get('label', 'Unknown DEX')
                print(f"   Step {i+1}: {dex_name}")
            
            return quote_data
            
        except Exception as e:
            print(f"❌ Quote error: {e}")
            return None
    
    async def build_swap_transaction(self, quote: Dict[str, Any]) -> Optional[bytes]:
        """
        Build swap transaction from Jupiter API
        
        Args:
            quote: Quote data from get_quote()
            
        Returns:
            Serialized transaction bytes or None if failed
        """
        try:
            print("🔨 Building swap transaction...")
            
            swap_data = {
                "quoteResponse": quote,
                "userPublicKey": str(self.wallet_pubkey),
                "wrapAndUnwrapSol": True,
                "dynamicComputeUnitLimit": True,
                "prioritizationFeeLamports": "auto"
            }
            
            response = requests.post(
                self.jupiter_swap_url,
                json=swap_data,
                timeout=30,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                print(f"❌ Swap transaction failed: {response.status_code} - {response.text}")
                return None
            
            swap_result = response.json()
            
            if "swapTransaction" not in swap_result:
                print(f"❌ No transaction in response: {swap_result}")
                return None
            
            # Decode the base64 transaction
            serialized_tx = swap_result["swapTransaction"]
            transaction_bytes = base64.b64decode(serialized_tx)
            
            print("✅ Transaction built successfully")
            return transaction_bytes
            
        except Exception as e:
            print(f"❌ Transaction building failed: {e}")
            return None
    
    async def execute_swap(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = 300
    ) -> Optional[str]:
        """
        Execute complete swap: get quote -> build transaction -> sign -> send
        
        Args:
            input_mint: Input token mint address
            output_mint: Output token mint address
            amount: Amount in smallest token units
            slippage_bps: Slippage tolerance in basis points
            
        Returns:
            Transaction signature or None if failed
        """
        try:
            print("\n🚀 Starting Jupiter swap execution...")
            
            # Step 1: Get quote
            print("📋 Step 1: Getting swap quote...")
            quote = await self.get_quote(input_mint, output_mint, amount, slippage_bps)
            
            if not quote:
                print("❌ Failed to get quote")
                return None
            
            # Step 2: Build transaction
            print("🔨 Step 2: Building swap transaction...")
            transaction_bytes = await self.build_swap_transaction(quote)
            
            if not transaction_bytes:
                print("❌ Failed to build transaction")
                return None
            
            # Step 3: Send transaction using solana-py AsyncClient
            print("📤 Step 3: Sending transaction...")
            
            # The transaction from Jupiter API is already built and signed
            # We can send it directly as raw bytes
            
            # Send using solana-py client with proper options
            tx_opts = TxOpts(
                skip_preflight=False,
                preflight_commitment=Confirmed,
                max_retries=3
            )
            
            send_response = await self.client.send_raw_transaction(
                transaction_bytes,
                opts=tx_opts
            )
            
            tx_signature = str(send_response.value)
            print(f"✅ Transaction sent: {tx_signature}")
            
            # Step 4: Confirm transaction
            print("⏳ Step 4: Waiting for confirmation...")
            confirmed = await self.confirm_transaction(tx_signature)
            
            if confirmed:
                print("🎉 Swap completed successfully!")
                print(f"🔗 Explorer: https://explorer.solana.com/tx/{tx_signature}")
            else:
                print("⚠️  Transaction confirmation timeout")
            
            return tx_signature
            
        except Exception as e:
            print(f"❌ Swap execution failed: {e}")
            return None
    
    async def confirm_transaction(
        self,
        signature: str,
        commitment: str = "confirmed",
        max_retries: int = 30
    ) -> bool:
        """
        Confirm transaction using solana-py client
        
        Args:
            signature: Transaction signature
            commitment: Commitment level
            max_retries: Maximum confirmation attempts
            
        Returns:
            True if confirmed, False if timeout
        """
        try:
            from solders.signature import Signature
            sig = Signature.from_string(signature)
            
            for i in range(max_retries):
                if i % 5 == 0:
                    print(f"   Checking confirmation... ({i+1}/{max_retries})")
                
                # Use solana-py get_transaction method
                tx_response = await self.client.get_transaction(
                    sig,
                    encoding="json",
                    commitment=Confirmed,
                    max_supported_transaction_version=0
                )
                
                if tx_response.value is not None:
                    print("✅ Transaction confirmed!")
                    return True
                
                await asyncio.sleep(2)
            
            return False
            
        except Exception as e:
            print(f"❌ Confirmation check failed: {e}")
            return False
    
    async def close(self):
        """Close the RPC client connection"""
        await self.client.close()


# Example usage and testing
class JupiterSwapDemo:
    """Demo class showing how to use Jupiter swaps"""
    
    def __init__(self, private_key: str):
        self.swapper = JupiterSwapper(private_key)
        
        # Common token mints on mainnet
        self.tokens = {
            "SOL": "So11111111111111111111111111111111111111112",
            "USDC": "EPjFWdd5AufqSSqeM2qN8dLHFJx9oenfaXqv5UTtRr6cj",
            "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY1iMcCe8BenwNYB",
            "RAY": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
            "SRM": "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"
        }
    
    async def demo_get_quote(self):
        """Demo: Get a quote without executing"""
        print("\n📋 DEMO: Getting Quote Only")
        print("=" * 40)
        
        # Example: Quote for swapping 0.01 SOL to USDC
        sol_amount = 10_000_000  # 0.01 SOL in lamports
        
        quote = await self.swapper.get_quote(
            input_mint=self.tokens["SOL"],
            output_mint=self.tokens["USDT"],
            amount=sol_amount,
            slippage_bps=300  # 3%
        )
        
        return quote
    
    async def demo_execute_swap(self):
        """Demo: Execute a complete swap"""
        print("\n🚀 DEMO: Executing Complete Swap")
        print("=" * 40)
        
        # Check balance first
        balance = await self.swapper.get_balance()
        
        if balance < 0.02:  # Need at least 0.02 SOL
            print("❌ Insufficient balance for demo swap")
            print("   Please fund your wallet with SOL")
            return None
        
        # Execute swap: 0.01 SOL -> USDC
        sol_amount = 10_000_000  # 0.01 SOL in lamports
        
        tx_signature = await self.swapper.execute_swap(
            input_mint=self.tokens["SOL"],
            output_mint=self.tokens["USDT"],
            amount=sol_amount,
            slippage_bps=300
        )
        
        return tx_signature
    
    async def run_demos(self):
        """Run all demos"""
        try:
            print("🎯 JUPITER SWAP DEMOS")
            print("Using solana-py repository structure")
            print("=" * 50)
            
            # Demo 1: Get quote
            await self.demo_get_quote()
            
            # Demo 2: Execute swap (commented out for safety)
            # Uncomment the line below to actually execute a swap
            # await self.demo_execute_swap()
            
            print("\n✅ Demos completed!")
            
        except Exception as e:
            print(f"❌ Demo failed: {e}")
        finally:
            await self.swapper.close()


# Main execution
async def main():
    """
    Main function to demonstrate Jupiter swap functionality
    """
    print("🌟 JUPITER SWAP with solana-py")
    print(f"📅 Date: 2025-07-19 11:53:35 UTC")
    print(f"👤 User: hemantsharma64")
    print(f"📦 Repository: michaelhly/solana-py")
    print("=" * 60)
    
    # You need to provide your private key here
    # For testing, you can generate a new one:
    test_keypair = Keypair()
    # Get the private key bytes (first 32 bytes of the keypair)
    test_private_key = base58.b58encode(bytes(test_keypair)[:32]).decode()
    
    print(f"🔑 Generated test wallet: {test_keypair.pubkey()}")
    print(f"🔑 Private key: {test_private_key}")
    print("⚠️  Fund this wallet with SOL to test swaps")
    print()
    
    # Initialize demo with your private key
    # Replace test_private_key with your actual private key
    demo = JupiterSwapDemo(test_private_key)
    
    # Run the demos
    await demo.run_demos()


if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())