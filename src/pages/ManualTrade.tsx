import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '../utils/apiClient'
import { showNotification } from '@mantine/notifications'

// Simple SVG Icons
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const ArrowsUpDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
)

const Cog6ToothIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

// Types
interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  logoURI?: string
  balance?: string
}

interface Network {
  chain_id: number
  name: string
  shortName: string
  rpc_url: string
  network_name: string
  isTestnet?: boolean
}

interface QuoteData {
  sell_token: string
  buy_token: string
  sell_amount: string
  buy_amount: string
  price: string
  estimated_gas: string
  gas_price: string
  slippage_bps: number
  expires_at: string
  price_impact?: string
}

interface TradeHistory {
  id: string
  sell_token: string
  buy_token: string
  sell_amount: string
  buy_amount: string
  transaction_hash: string
  status: string
  created_at: string
  chain_id: number
  network_name: string
}

// Network configurations - backend will handle Infura RPC URLs with API keys
const networkOptions: Network[] = [
  {
    chain_id: 1,
    name: "Ethereum Mainnet",
    shortName: "ETH",
    rpc_url: "https://mainnet.infura.io/v3/INFURA_KEY", // Backend will replace with actual key
    network_name: "Ethereum Mainnet",
    isTestnet: false
  },
  {
    chain_id: 137,
    name: "Polygon",
    shortName: "MATIC",
    rpc_url: "https://polygon-mainnet.infura.io/v3/INFURA_KEY", // Backend will replace with actual key
    network_name: "Polygon",
    isTestnet: false
  },
  {
    chain_id: 56,
    name: "Binance Smart Chain",
    shortName: "BSC",
    rpc_url: "https://bsc-mainnet.infura.io/v3/INFURA_KEY", // Backend will replace with actual key
    network_name: "Binance Smart Chain",
    isTestnet: false
  },
  {
    chain_id: 42161,
    name: "Arbitrum One",
    shortName: "ARB",
    rpc_url: "https://arbitrum-mainnet.infura.io/v3/INFURA_KEY", // Backend will replace with actual key
    network_name: "Arbitrum One",
    isTestnet: false
  },
  {
    chain_id: 10143,
    name: "Monad Testnet",
    shortName: "Monad",
    rpc_url: "https://testnet-rpc.monad.xyz", // Monad doesn't use Infura
    network_name: "Monad Testnet",
    isTestnet: true
  }
]

// Real token addresses by network
const tokensByNetwork: Record<number, Token[]> = {
  // Ethereum Mainnet
  1: [
    { symbol: "ETH", name: "Ethereum", address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0xA0b86a33E6417aEd136F0b5915b3E6E80B2d2BbF", decimals: 6 },
    { symbol: "USDT", name: "Tether", address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
    { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", decimals: 8 },
    { symbol: "WETH", name: "Wrapped Ethereum", address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", decimals: 18 },
    { symbol: "DAI", name: "Dai Stablecoin", address: "0x6b175474e89094c44da98b954eedeac495271d0f", decimals: 18 },
    { symbol: "LINK", name: "Chainlink", address: "0x514910771af9ca656af840dff83e8264ecf986ca", decimals: 18 },
    { symbol: "UNI", name: "Uniswap", address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", decimals: 18 },
  ],
  // Polygon
  137: [
    { symbol: "MATIC", name: "Polygon", address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", decimals: 6 },
    { symbol: "USDT", name: "Tether", address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", decimals: 6 },
    { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", decimals: 8 },
    { symbol: "WETH", name: "Wrapped Ethereum", address: "0x7ceb23fd6f88b48c8f58f96b81b6c2f8f2f8f8f8", decimals: 18 },
    { symbol: "DAI", name: "Dai Stablecoin", address: "0x8f3cf7ad23cd3cacdbd9735aff958023239c6a063", decimals: 18 },
  ],
  // Binance Smart Chain
  56: [
    { symbol: "BNB", name: "Binance Coin", address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", decimals: 18 },
    { symbol: "USDT", name: "Tether", address: "0x55d398326f99059ff775485246999027b3197955", decimals: 18 },
    { symbol: "BTCB", name: "Bitcoin BEP20", address: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", decimals: 18 },
    { symbol: "WBNB", name: "Wrapped BNB", address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", decimals: 18 },
    { symbol: "CAKE", name: "PancakeSwap", address: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82", decimals: 18 },
  ],
  // Arbitrum One
  42161: [
    { symbol: "ETH", name: "Ethereum", address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", decimals: 6 },
    { symbol: "USDT", name: "Tether", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
    { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", decimals: 8 },
    { symbol: "WETH", name: "Wrapped Ethereum", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
    { symbol: "DAI", name: "Dai Stablecoin", address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18 },
  ],
  // Monad Testnet
  10143: [
    { symbol: "MON", name: "Monad", address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", decimals: 18 },
    { symbol: "USDC", name: "USDC (testnet)", address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea", decimals: 6 },
    { symbol: "USDT", name: "USDT (testnet)", address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D", decimals: 6 },
    { symbol: "WBTC", name: "WBTC (testnet)", address: "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d", decimals: 8 },
    { symbol: "WETH", name: "WETH (testnet)", address: "0xB5a30b0FDc42e3E9760Cb8449Fb37", decimals: 18 },
    { symbol: "WSOL", name: "WSOL (testnet)", address: "0x5387C85A4965769f6B0Df430638a1388493486F1", decimals: 9 },
  ]
}

const ManualTrade: React.FC = () => {
  // State management
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networkOptions[4]) // Default to Monad Testnet
  const [sellToken, setSellToken] = useState<Token | null>(null)
  const [buyToken, setBuyToken] = useState<Token | null>(null)
  const [sellAmount, setSellAmount] = useState<string>('')
  const [buyAmount, setBuyAmount] = useState<string>('')
  const [slippage, setSlippage] = useState<number>(50) // 0.5%
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false)
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState<boolean>(false)
  const [tokenSelectorType, setTokenSelectorType] = useState<'sell' | 'buy'>('sell')
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([])
  const [quoteError, setQuoteError] = useState<string>('')

  // Initialize default tokens and fetch trade history
  useEffect(() => {
    const tokens = tokensByNetwork[selectedNetwork.chain_id] || []
    if (tokens.length >= 2) {
      setSellToken(tokens[0]) // First token (native)
      setBuyToken(tokens[1])  // Second token (usually USDC)
    }
    // Fetch trade history on component mount (only if we have authentication)
    fetchTradeHistory()
  }, [selectedNetwork])

  // Fetch supported networks from backend (optional - we already have hardcoded ones)
  const fetchSupportedNetworks = async () => {
    try {
      const response = await apiClient.get('/mtrades/networks')
      console.log('Supported networks from backend:', response)
      // You can use this to validate or extend your hardcoded networks
    } catch (error) {
      console.log('Using hardcoded networks (backend networks unavailable)')
    }
  }

  // Get quote when sell amount or tokens change
  useEffect(() => {
    if (sellAmount && parseFloat(sellAmount) > 0 && sellToken && buyToken) {
      const timeoutId = setTimeout(() => {
        fetchQuote()
      }, 800) // Debounce API calls
      
      return () => clearTimeout(timeoutId)
    } else {
      setBuyAmount('')
      setQuote(null)
      setQuoteError('')
    }
  }, [sellAmount, sellToken, buyToken, slippage, selectedNetwork])

  const fetchQuote = async () => {
    if (!sellAmount || !sellToken || !buyToken) return
    
    // Check if user is trying to swap same token
    if (sellToken.address.toLowerCase() === buyToken.address.toLowerCase()) {
      setQuoteError('Swap not possible - you cannot swap the same token. Please select different tokens.')
      setBuyAmount('')
      setQuote(null)
      return
    }
    
    setQuoteLoading(true)
    setQuoteError('')
    try {
      // Safe conversion to Wei to avoid scientific notation
      const sellAmountFloat = parseFloat(sellAmount)
      if (isNaN(sellAmountFloat) || sellAmountFloat <= 0) {
        throw new Error('Please enter a valid amount')
      }
      
      // Use a more precise method to avoid scientific notation
      const decimalsMultiplier = Math.pow(10, sellToken.decimals)
      const sellAmountWei = (sellAmountFloat * decimalsMultiplier).toLocaleString('fullwide', { useGrouping: false })
      
      const quoteRequest = {
        sell_token: sellToken.address,
        buy_token: buyToken.address,
        sell_amount: sellAmountWei,
        slippage_bps: slippage,
        chain_id: selectedNetwork.chain_id,
        rpc_url: selectedNetwork.rpc_url
      }

      const quoteData: QuoteData = await apiClient.post('/mtrades/quote', quoteRequest)
      setQuote(quoteData)
      const buyAmountFormatted = (parseFloat(quoteData.buy_amount) / Math.pow(10, buyToken.decimals)).toFixed(6)
      setBuyAmount(buyAmountFormatted)
      
    } catch (error: any) {
      console.error('Failed to fetch quote:', error)
      setQuoteError(error.message || 'Network error - unable to get quote')
    } finally {
      setQuoteLoading(false)
    }
  }

  const executeSwap = async () => {
    if (!quote || !sellToken || !buyToken) return
    
    setLoading(true)
    try {
      const tradeRequest = {
        sell_token: sellToken.address,
        buy_token: buyToken.address,
        sell_amount: quote.sell_amount,
        slippage_bps: slippage,
        chain_id: selectedNetwork.chain_id,
        rpc_url: selectedNetwork.rpc_url
      }

      const response = await apiClient.post('/mtrades/execute', tradeRequest)
      
      showNotification({
        title: 'Swap Executed',
        message: `Successfully swapped ${sellAmount} ${sellToken.symbol} for ${buyAmount} ${buyToken.symbol}`,
        color: 'green',
      })
      
      // Reset form
      setSellAmount('')
      setBuyAmount('')
      setQuote(null)
      
      // Refresh trade history
      fetchTradeHistory()
      
      // Check transaction status once after 15 seconds (for fast networks like Monad)
      // Users can manually refresh for updates after this
      if (response.transaction_hash) {
        setTimeout(async () => {
          const status = await checkTransactionStatus(response.transaction_hash, selectedNetwork.chain_id)
          if (status && status.status !== 'pending') {
            await fetchTradeHistory() // Refresh if status changed
          }
        }, 15000) // Single check after 15 seconds
      }
      
    } catch (error) {
      console.error('Failed to execute swap:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTradeHistory = async () => {
    try {
      const response = await apiClient.get('/mtrades/history?limit=10')
      setTradeHistory(response)
    } catch (error: any) {
      console.error('Failed to fetch trade history:', error)
      // Don't show error notification for trade history - it's not critical
      // User might not be authenticated or backend might be down
      setTradeHistory([]) // Set empty array so UI doesn't break
    }
  }

  const checkTransactionStatus = async (transaction_hash: string, chain_id: number) => {
    try {
      const network = networkOptions.find(net => net.chain_id === chain_id)
      if (!network) {
        console.error('Network not found for chain ID:', chain_id)
        return null
      }

      const statusResponse = await apiClient.get(
        `/mtrades/transaction/${transaction_hash}?chain_id=${chain_id}&rpc_url=${encodeURIComponent(network.rpc_url)}`
      )
      
      return statusResponse
    } catch (error) {
      console.error(`Failed to check status for ${transaction_hash}:`, error)
      return null
    }
  }

  const refreshTransactionStatus = async (transaction_hash: string, chain_id: number) => {
    const status = await checkTransactionStatus(transaction_hash, chain_id)
    if (status && status.status !== 'pending') {
      // Only refresh trade history if status actually changed
      await fetchTradeHistory()
    }
    return status
  }

  const swapTokens = () => {
    if (sellToken && buyToken) {
      const tempToken = sellToken
      setSellToken(buyToken)
      setBuyToken(tempToken)
      setSellAmount(buyAmount)
      setBuyAmount('')
      setQuote(null)
    }
  }

  const openTokenSelector = (type: 'sell' | 'buy') => {
    setTokenSelectorType(type)
    setIsTokenSelectorOpen(true)
  }

  const selectToken = (token: Token) => {
    if (tokenSelectorType === 'sell') {
      setSellToken(token)
    } else {
      setBuyToken(token)
    }
    setIsTokenSelectorOpen(false)
  }

  const handleNetworkChange = (networkId: number) => {
    const network = networkOptions.find(n => n.chain_id === networkId)
    if (network) {
      setSelectedNetwork(network)
      // Reset tokens and amounts when network changes
      setSellToken(null)
      setBuyToken(null)
      setSellAmount('')
      setBuyAmount('')
      setQuote(null)
    }
  }

  // Get current network tokens
  const currentTokens = tokensByNetwork[selectedNetwork.chain_id] || []

  const TokenSelector = () => (
    <AnimatePresence>
      {isTokenSelectorOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsTokenSelectorOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-boxdark rounded-2xl p-6 max-w-md w-full mx-4 max-h-96 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select a token</h3>
              <span className="text-sm text-gray-500">{selectedNetwork.name}</span>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-64">
              {currentTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => selectToken(token)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {token.symbol.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-sm text-gray-500">{token.name}</div>
                    </div>
                  </div>
                  {token.balance && (
                    <div className="text-sm text-gray-500">{token.balance}</div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const SettingsModal = () => (
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsSettingsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-boxdark rounded-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Swap Settings</h3>
            
            {/* Slippage Settings */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Slippage Tolerance</label>
              <div className="flex space-x-2 mb-2">
                {[10, 50, 100, 300].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      slippage === value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {value / 100}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={slippage / 100}
                onChange={(e) => setSlippage(parseFloat(e.target.value) * 100)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Custom %"
                step="0.01"
                min="0.01"
                max="50"
            />
           </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-boxdark-2 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Swap</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchQuote}
              disabled={quoteLoading}
              className="p-2 rounded-lg bg-white dark:bg-boxdark border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Refresh Quote"
            >
              <RefreshIcon className={`w-5 h-5 ${quoteLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={fetchSupportedNetworks}
              className="px-3 py-2 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              title="Test Backend Connection"
            >
              Test API
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg bg-white dark:bg-boxdark border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Network Selector */}
        <div className="mb-6 p-4 bg-white dark:bg-boxdark rounded-2xl border dark:border-gray-700 shadow-sm">
          <label className="block text-sm font-medium mb-2">Network</label>
          <select
            value={selectedNetwork.chain_id}
            onChange={(e) => handleNetworkChange(parseInt(e.target.value))}
            className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {networkOptions.map((network) => (
              <option key={network.chain_id} value={network.chain_id}>
                {network.name} {network.isTestnet ? '(Testnet)' : ''}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Connected to {selectedNetwork.name}
            </span>
          </div>
        </div>

        {/* Swap Interface */}
        <div className="bg-white dark:bg-boxdark rounded-2xl border dark:border-gray-700 p-6 shadow-lg mb-6">
          {/* Sell Token */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">You pay</label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Balance: {sellToken?.balance || '0.00'}
              </span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 text-2xl font-semibold bg-transparent border-none outline-none dark:text-white"
              />
              <button
                onClick={() => openTokenSelector('sell')}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border dark:border-gray-600"
              >
                {sellToken ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                      {sellToken.symbol.charAt(0)}
                    </div>
                    <span className="font-medium">{sellToken.symbol}</span>
                  </>
                ) : (
                  <span className="text-gray-500">Select token</span>
                )}
                <ChevronDownIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center my-4">
            <button
              onClick={swapTokens}
              className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border-4 border-white dark:border-boxdark"
            >
              <ArrowsUpDownIcon className="w-5 h-5" />
            </button>
                </div>

          {/* Buy Token */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">You receive</label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Balance: {buyToken?.balance || '0.00'}
              </span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <input
                type="number"
                value={buyAmount}
                readOnly
                placeholder="0.0"
                className="flex-1 text-2xl font-semibold bg-transparent border-none outline-none dark:text-white"
              />
              <button
                onClick={() => openTokenSelector('buy')}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border dark:border-gray-600"
              >
                {buyToken ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                      {buyToken.symbol.charAt(0)}
                    </div>
                    <span className="font-medium">{buyToken.symbol}</span>
                  </>
                ) : (
                  <span className="text-gray-500">Select token</span>
                )}
                <ChevronDownIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quote Information */}
          {quoteLoading && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-700 dark:text-blue-300">Getting best price...</span>
              </div>
            </div>
          )}

          {quoteError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <span className="text-sm text-red-700 dark:text-red-300">{quoteError}</span>
            </div>
          )}

          {quote && !quoteLoading && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Exchange Rate</span>
                  <span className="font-medium">
                    1 {sellToken?.symbol} = {parseFloat(quote.price).toFixed(6)} {buyToken?.symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Slippage Tolerance</span>
                  <span className="font-medium">{slippage / 100}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Estimated Gas</span>
                  <span className="font-medium">{parseInt(quote.estimated_gas).toLocaleString()}</span>
                </div>
                {quote.price_impact && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Price Impact</span>
                    <span className={`font-medium ${parseFloat(quote.price_impact) > 5 ? 'text-red-500' : 'text-green-500'}`}>
                      {quote.price_impact}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Swap Button */}
          <button
            onClick={executeSwap}
            disabled={
              !quote || loading || !sellAmount || !sellToken || !buyToken || quoteLoading ||
              (sellToken && buyToken && sellToken.address.toLowerCase() === buyToken.address.toLowerCase())
            }
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
              quote && sellAmount && !loading && sellToken && buyToken && !quoteLoading &&
              !(sellToken && buyToken && sellToken.address.toLowerCase() === buyToken.address.toLowerCase())
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Swapping...</span>
              </div>
            ) : !sellToken || !buyToken ? (
              'Select tokens'
            ) : sellToken && buyToken && sellToken.address.toLowerCase() === buyToken.address.toLowerCase() ? (
              'Cannot swap same token'
            ) : !sellAmount ? (
              'Enter amount'
            ) : quoteLoading ? (
              'Getting quote...'
            ) : !quote ? (
              'Enter amount to see quote'
            ) : (
              `Swap ${sellToken.symbol} for ${buyToken.symbol}`
            )}
          </button>
        </div>

                {/* Recent Trades */}
        {tradeHistory.length > 0 && (
          <div className="bg-white dark:bg-boxdark rounded-2xl border dark:border-gray-700 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Recent Trades
              </h3>
              <button
                onClick={fetchTradeHistory}
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="Refresh All Trades"
              >
                ↻ Refresh
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tradeHistory.slice(0, 5).map((trade) => {
                const sellTokenInfo = Object.values(tokensByNetwork).flat().find(t => t.address.toLowerCase() === trade.sell_token.toLowerCase())
                const buyTokenInfo = Object.values(tokensByNetwork).flat().find(t => t.address.toLowerCase() === trade.buy_token.toLowerCase())
                
                // Get the correct explorer URL based on chain_id
                const getExplorerUrl = (chainId: number, txHash: string) => {
                  const explorers: Record<number, string> = {
                    1: `https://etherscan.io/tx/${txHash}`,
                    137: `https://polygonscan.com/tx/${txHash}`,
                    42161: `https://arbiscan.io/tx/${txHash}`,
                    56: `https://bscscan.com/tx/${txHash}`,
                    10143: `https://testnet.monadexplorer.com/tx/${txHash}`,
                  }
                  return explorers[chainId] || `https://etherscan.io/tx/${txHash}`
                }

                const formatAmount = (amount: string, decimals: number = 18) => {
                  try {
                    const formatted = (parseFloat(amount) / Math.pow(10, decimals)).toFixed(4)
                    return parseFloat(formatted).toString() // Remove trailing zeros
                  } catch {
                    return '0'
                  }
                }
                
                return (
                  <div key={trade.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      {/* Trade Info - Compact */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Token Icons - Smaller */}
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {sellTokenInfo?.symbol.charAt(0) || '?'}
                          </div>
                          <span className="text-gray-400 text-xs">→</span>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                            {buyTokenInfo?.symbol.charAt(0) || '?'}
                          </div>
                        </div>
                        
                        {/* Trade Details - More Compact */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {formatAmount(trade.sell_amount, sellTokenInfo?.decimals)} {sellTokenInfo?.symbol} → {formatAmount(trade.buy_amount, buyTokenInfo?.decimals)} {buyTokenInfo?.symbol}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {new Date(trade.created_at).toLocaleDateString()} • {trade.network_name || `Chain ${trade.chain_id}`}
                          </div>
                        </div>
                      </div>

                      {/* Status and Action - Compact */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trade.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                          trade.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {trade.status === 'success' ? '✓' : trade.status === 'failed' ? '✗' : '⏳'}
                        </div>
                        
                        {/* Refresh button for pending transactions */}
                        {trade.status === 'pending' && (
                          <button
                            onClick={() => refreshTransactionStatus(trade.transaction_hash, trade.chain_id)}
                            className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded transition-colors"
                            title="Check Status"
                          >
                            ↻
                          </button>
                        )}
                        
                        <a
                          href={getExplorerUrl(trade.chain_id, trade.transaction_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Show more trades hint */}
            {tradeHistory.length > 5 && (
              <div className="text-center mt-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing 5 of {tradeHistory.length} trades
                </span>
              </div>
            )}
          </div>
        )}
            </div>

      {/* Modals */}
      <TokenSelector />
      <SettingsModal />
        </div>
    )
}

export default ManualTrade