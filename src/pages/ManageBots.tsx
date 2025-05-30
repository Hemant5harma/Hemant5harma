import { useState, useEffect } from "react"
import BotCard from "../components/BotCard"
import { fetchBots } from "../utils/apiClient"
import { Search } from "lucide-react"

// Token address to name mapping
const tokenAddressToName: Record<string, { symbol: string; name: string }> = {
  // Ethereum Mainnet
  "0xA0b86a33E6441b4dc5029316a4B3D3536aDF38F5": { symbol: "USDC", name: "USD Coin" },
  "0xdac17f958d2ee523a2206206994597c13d831ec7": { symbol: "USDT", name: "Tether" },
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": { symbol: "WBTC", name: "Wrapped Bitcoin" },
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": { symbol: "WETH", name: "Wrapped Ethereum" },
  
  // Polygon
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": { symbol: "USDC", name: "USD Coin" },
  "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": { symbol: "USDT", name: "Tether" },
  "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6": { symbol: "WBTC", name: "Wrapped Bitcoin" },
  "0x7ceb23fd6f88b48c8f58f96b81b6c2f8f2f8f8f8": { symbol: "WETH", name: "Wrapped Ethereum" },
  
  // BSC
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": { symbol: "USDC", name: "USD Coin" },
  "0x55d398326f99059ff775485246999027b3197955": { symbol: "USDT", name: "Tether" },
  "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c": { symbol: "BTCB", name: "Bitcoin BEP20" },
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": { symbol: "WBNB", name: "Wrapped BNB" },
  
  // Monad Testnet
  "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea": { symbol: "USDC", name: "USDC (testnet)" },
  "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D": { symbol: "USDT", name: "USDT (testnet)" },
  "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d": { symbol: "WBTC", name: "WBTC (testnet)" },
  "0xB5a30b0FDc42e3E9760Cb8449Fb37": { symbol: "WETH", name: "WETH (testnet)" },
  "0x5387C85A4965769f6B0Df430638a1388493486F1": { symbol: "WSOL", name: "WSOL (testnet)" },
};

// Helper function to get token info from address
const getTokenInfo = (tokenAddress: string) => {
  const tokenInfo = tokenAddressToName[tokenAddress];
  return tokenInfo || { symbol: tokenAddress.substring(0, 6), name: `Token ${tokenAddress.substring(0, 6)}` };
};

export default function ManageBots() {
  const [searchTerm, setSearchTerm] = useState("")
  const [bots, setBots] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetchBots()
      .then((data) => {
        setBots(data)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error(error)
        setIsLoading(false)
      })
  }, [])

  const filteredBots = bots.filter(
    (bot) =>
      bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bot.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bot.coins.some((coin: any) => {
        const tokenInfo = getTokenInfo(coin.token_address);
        return tokenInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               tokenInfo.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      }),
  )

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-2">Trading Bots</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and monitor your automated trading strategies</p>
      </div>

      {/* Search and Actions */}
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, status, or token name..."
            className="w-full p-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-boxdark text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bot Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-boxdark shadow-xl p-6 h-[420px] animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                ))}
              </div>
              <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6"></div>
              <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : filteredBots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Search className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No bots found</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            We couldn't find any trading bots matching your search criteria. Try adjusting your search terms.
          </p>
        </div>
      )}
    </div>
  )
}
