import requests
import json

def test_jupiter_quote():
    """Test Jupiter quote API without wallet interaction"""
    
    url = "https://quote-api.jup.ag/v6/quote"
    
    # Test with SOL to USDC
    SOL_MINT = "So11111111111111111111111111111111111111112"
    USDC_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"  # Mainnet USDC
    
    params = {
        "inputMint": SOL_MINT,
        "outputMint": USDC_MINT,
        "amount": "100000000",  # 0.001 SOL
        "slippageBps": "100"
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Jupiter API is working!")
            print(f"Input: {data.get('inputMint')}")
            print(f"Output: {data.get('outputMint')}")
            print(f"Input Amount: {data.get('inAmount')}")
            print(f"Output Amount: {data.get('outAmount')}")
            print(f"Price Impact: {float(data.get('priceImpactPct', 0)) * 100:.4f}%")
        else:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_jupiter_quote()