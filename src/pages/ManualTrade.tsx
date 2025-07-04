import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { apiClient } from "../utils/apiClient"
import { showNotification } from "@mantine/notifications"
import {
  networkOptions,
  tokensByNetwork,
  getExplorerUrls,
  getExplorerTxUrl,
  type Token,
  type Network,
} from "../data/networkData"

// Simple SVG Icons (keeping the same)
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} text-black dark:text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const ArrowsUpDownIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} text-black dark:text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
    />
  </svg>
)

const Cog6ToothIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} text-black dark:text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} text-black dark:text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
)

// Types (keeping the same)
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

const ManualTrade: React.FC = () => {
  // All state management (keeping the same)
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networkOptions[4])
  const [sellToken, setSellToken] = useState<Token | null>(null)
  const [buyToken, setBuyToken] = useState<Token | null>(null)
  const [sellAmount, setSellAmount] = useState<string>("")
  const [buyAmount, setBuyAmount] = useState<string>("")
  const [slippage, setSlippage] = useState<number>(50)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false)
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState<boolean>(false)
  const [tokenSelectorType, setTokenSelectorType] = useState<"sell" | "buy">("sell")
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([])
  const [quoteError, setQuoteError] = useState<string>("")
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null)
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({})
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false)
  const [walletChainId, setWalletChainId] = useState<number | null>(null)

  // All useEffect hooks and functions (keeping the same logic, just cleaning up the code)
  useEffect(() => {
    const tokens = tokensByNetwork[selectedNetwork.chain_id] || []
    if (tokens.length >= 2) {
      setSellToken(tokens[0])
      setBuyToken(tokens[1])
    }
    fetchTradeHistory()
  }, [selectedNetwork])

  useEffect(() => {
    checkWalletConnection()
    if ((window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setConnectedWallet(accounts[0])
        } else {
          setConnectedWallet(null)
          setTokenBalances({})
        }
      }

      const handleChainChanged = (chainId: string) => {
        const newChainId = Number.parseInt(chainId, 16)
        setWalletChainId(newChainId)
        setTokenBalances({})
        setTimeout(() => {
          fetchTokenBalances(true)
        }, 1000)
      }
      ;(window as any).ethereum.on("accountsChanged", handleAccountsChanged)
      ;(window as any).ethereum.on("chainChanged", handleChainChanged)

      return () => {
        if ((window as any).ethereum.removeListener) {
          ;(window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged)
          ;(window as any).ethereum.removeListener("chainChanged", handleChainChanged)
        }
      }
    }
  }, [])

  const checkWalletConnection = async () => {
    if ((window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_accounts" })
        if (accounts && accounts.length > 0) {
          setConnectedWallet(accounts[0])
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error)
      }
    }
  }

  const fetchTokenBalances = async (forceRefresh = false) => {
    if (!connectedWallet) return

    if (forceRefresh) {
      setTokenBalances({})
    }

    setBalanceLoading(true)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Balance fetch timeout after 30 seconds")), 30000)
    })

    try {
      await Promise.race([fetchBalancesFromWeb3(), timeoutPromise])
    } catch (error) {
      console.error("Failed to fetch token balances:", error)
      setTokenBalances({})
    } finally {
      setBalanceLoading(false)
    }
  }

  const fetchBalancesFromWeb3 = async () => {
    if (!connectedWallet || !(window as any).ethereum) return

    try {
      const { BrowserProvider, Contract, isAddress } = await import("ethers")
      const provider = new BrowserProvider((window as any).ethereum)
      const network = await provider.getNetwork()
      const walletChainId = Number(network.chainId)

      const walletNetwork = networkOptions.find((net) => net.chain_id === walletChainId)
      const tokensToFetch = tokensByNetwork[walletChainId] || []

      if (!walletNetwork || tokensToFetch.length === 0) {
        setTokenBalances({})
        return
      }

      const balances: Record<string, string> = {}

      try {
        const nativeBalance = await provider.getBalance(connectedWallet)
        const nativeAmount = Number.parseFloat(nativeBalance.toString()) / Math.pow(10, 18)
        balances["0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"] = nativeAmount.toFixed(6)
      } catch (error) {
        balances["0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"] = "0.00"
      }

      const erc20Abi = ["function balanceOf(address owner) view returns (uint256)"]

      for (const token of tokensToFetch) {
        if (token.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") continue

        if (!isAddress(token.address)) {
          balances[token.address] = "0.00"
          continue
        }

        try {
          const contract = new Contract(token.address, erc20Abi, provider)
          const balance = await contract.balanceOf(connectedWallet)
          const decimals = token.decimals || 18
          const amount = Number.parseFloat(balance.toString()) / Math.pow(10, decimals)
          balances[token.address.toLowerCase()] = amount.toFixed(6)
        } catch (error) {
          balances[token.address.toLowerCase()] = "0.00"
        }

        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setTokenBalances(balances)
      setWalletChainId(walletChainId)
    } catch (error) {
      console.error("Web3 balance fetch failed:", error)
      throw error
    }
  }

  useEffect(() => {
    if (connectedWallet) {
      fetchTokenBalances()
    } else {
      setTokenBalances({})
      setWalletChainId(null)
    }
  }, [connectedWallet])

  useEffect(() => {
    if (sellToken && tokenBalances[sellToken.address.toLowerCase()]) {
      setSellToken({
        ...sellToken,
        balance: tokenBalances[sellToken.address.toLowerCase()],
      })
    }
    if (buyToken && tokenBalances[buyToken.address.toLowerCase()]) {
      setBuyToken({
        ...buyToken,
        balance: tokenBalances[buyToken.address.toLowerCase()],
      })
    }
  }, [tokenBalances])

  const handleMaxClick = (tokenType: "sell" | "buy") => {
    const token = tokenType === "sell" ? sellToken : buyToken
    if (!token || !token.balance) return

    const balance = Number.parseFloat(token.balance)
    if (tokenType === "sell") {
      if (token.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        const maxAmount = Math.max(0, balance - 0.01)
        setSellAmount(maxAmount.toString())
      } else {
        setSellAmount(balance.toString())
      }
    }
  }

  const fetchSupportedNetworks = async () => {
    try {
      const response = await apiClient.get("/mtrades/networks")
      console.log("Supported networks from backend:", response)
    } catch (error) {
      console.log("Using hardcoded networks (backend networks unavailable)")
    }
  }

  useEffect(() => {
    if (sellAmount && Number.parseFloat(sellAmount) > 0 && sellToken && buyToken) {
      const timeoutId = setTimeout(() => {
        fetchQuote()
      }, 800)
      return () => clearTimeout(timeoutId)
    } else {
      setBuyAmount("")
      setQuote(null)
      setQuoteError("")
    }
  }, [sellAmount, sellToken, buyToken, slippage, selectedNetwork])

  const fetchQuote = async () => {
    if (!sellAmount || !sellToken || !buyToken) return

    if (sellToken.address.toLowerCase() === buyToken.address.toLowerCase()) {
      setQuoteError("Swap not possible - you cannot swap the same token. Please select different tokens.")
      setBuyAmount("")
      setQuote(null)
      return
    }

    setQuoteLoading(true)
    setQuoteError("")

    try {
      const sellAmountFloat = Number.parseFloat(sellAmount)
      if (isNaN(sellAmountFloat) || sellAmountFloat <= 0) {
        throw new Error("Please enter a valid amount")
      }

      const decimalsMultiplier = Math.pow(10, sellToken.decimals)
      const sellAmountWei = (sellAmountFloat * decimalsMultiplier).toLocaleString("fullwide", {
        useGrouping: false,
      })

      const quoteRequest = {
        sell_token: sellToken.address,
        buy_token: buyToken.address,
        sell_amount: sellAmountWei,
        slippage_bps: slippage,
        chain_id: selectedNetwork.chain_id,
        rpc_url: selectedNetwork.rpc_url,
      }

      const quoteData: QuoteData = await apiClient.post("/mtrades/quote", quoteRequest)
      setQuote(quoteData)

      const buyAmountFormatted = (Number.parseFloat(quoteData.buy_amount) / Math.pow(10, buyToken.decimals)).toFixed(6)
      setBuyAmount(buyAmountFormatted)
    } catch (error: any) {
      console.error("Failed to fetch quote:", error)
      setQuoteError(error.message || "Network error - unable to get quote")
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
        rpc_url: selectedNetwork.rpc_url,
      }

      const response = await apiClient.post("/mtrades/execute", tradeRequest)

      showNotification({
        title: "Swap Executed",
        message: `Successfully swapped ${sellAmount} ${sellToken.symbol} for ${buyAmount} ${buyToken.symbol}`,
        color: "green",
      })

      setSellAmount("")
      setBuyAmount("")
      setQuote(null)
      fetchTradeHistory()

      if (response.transaction_hash) {
        setTimeout(async () => {
          const status = await checkTransactionStatus(response.transaction_hash, selectedNetwork.chain_id)
          if (status && status.status !== "pending") {
            await fetchTradeHistory()
          }
        }, 15000)
      }
    } catch (error) {
      console.error("Failed to execute swap:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTradeHistory = async () => {
    try {
      const response = await apiClient.get("/mtrades/history?limit=10")
      setTradeHistory(response)
    } catch (error: any) {
      console.error("Failed to fetch trade history:", error)
      setTradeHistory([])
    }
  }

  const checkTransactionStatus = async (transaction_hash: string, chain_id: number) => {
    try {
      const network = networkOptions.find((net) => net.chain_id === chain_id)
      if (!network) return null

      const statusResponse = await apiClient.get(
        `/mtrades/transaction/${transaction_hash}?chain_id=${chain_id}&rpc_url=${encodeURIComponent(network.rpc_url)}`,
      )
      return statusResponse
    } catch (error) {
      console.error(`Failed to check status for ${transaction_hash}:`, error)
      return null
    }
  }

  const refreshTransactionStatus = async (transaction_hash: string, chain_id: number) => {
    const status = await checkTransactionStatus(transaction_hash, chain_id)
    if (status && status.status !== "pending") {
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
      setBuyAmount("")
      setQuote(null)
    }
  }

  const openTokenSelector = (type: "sell" | "buy") => {
    setTokenSelectorType(type)
    setIsTokenSelectorOpen(true)
  }

  const selectToken = (token: Token) => {
    if (tokenSelectorType === "sell") {
      setSellToken(token)
    } else {
      setBuyToken(token)
    }
    setIsTokenSelectorOpen(false)
  }

  const handleNetworkChange = (networkId: number) => {
    const network = networkOptions.find((n) => n.chain_id === networkId)
    if (network) {
      setSelectedNetwork(network)
      setSellToken(null)
      setBuyToken(null)
      setSellAmount("")
      setBuyAmount("")
      setQuote(null)

      const tokens = tokensByNetwork[networkId]
      if (tokens) {
        tokens.forEach((token) => {
          token.balance = undefined
        })
      }

      if (connectedWallet) {
        fetchTokenBalances(true)
      }
    }
  }

  const switchWalletNetwork = async () => {
    if (!(window as any).ethereum || !connectedWallet) {
      showNotification({
        title: "Wallet Error",
        message: "No wallet connected or MetaMask not available",
        color: "red",
      })
      return
    }

    try {
      const chainIdHex = `0x${selectedNetwork.chain_id.toString(16)}`

      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      })

      showNotification({
        title: "Network Switched",
        message: `Successfully switched to ${selectedNetwork.name}`,
        color: "green",
      })

      setTimeout(() => {
        fetchTokenBalances(true)
      }, 1000)
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${selectedNetwork.chain_id.toString(16)}`,
                chainName: selectedNetwork.name,
                nativeCurrency: {
                  name: selectedNetwork.shortName,
                  symbol: selectedNetwork.shortName,
                  decimals: 18,
                },
                rpcUrls: [selectedNetwork.rpc_url],
                blockExplorerUrls: getExplorerUrls(selectedNetwork.chain_id),
              },
            ],
          })

          showNotification({
            title: "Network Added",
            message: `Successfully added and switched to ${selectedNetwork.name}`,
            color: "green",
          })

          setTimeout(() => {
            fetchTokenBalances(true)
          }, 1500)
        } catch (addError: any) {
          showNotification({
            title: "Network Error",
            message: `Failed to add ${selectedNetwork.name}: ${addError.message}`,
            color: "red",
          })
        }
      } else {
        showNotification({
          title: "Network Error",
          message: `Failed to switch to ${selectedNetwork.name}: ${switchError.message}`,
          color: "red",
        })
      }
    }
  }

  const currentTokens = tokensByNetwork[selectedNetwork.chain_id] || []

  const TokenSelector = () => (
    <AnimatePresence>
      {isTokenSelectorOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setIsTokenSelectorOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Select a token</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{selectedNetwork.name}</span>
                  <button
                    onClick={() => setIsTokenSelectorOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="custom-scroll max-h-96 overflow-y-auto p-2">
              {currentTokens.map((token) => {
                const balance = tokenBalances[token.address.toLowerCase()] || "0.00"
                const isLoading = balanceLoading && !tokenBalances[token.address.toLowerCase()]

                return (
                  <button
                    key={token.address}
                    onClick={() => selectToken({ ...token, balance })}
                    className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {token.symbol.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white">{token.symbol}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{token.name}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <div className="font-semibold text-gray-900 dark:text-white">{balance}</div>
                          <div className="text-xs text-gray-400">{token.symbol}</div>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setIsSettingsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Swap Settings</h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Slippage Tolerance
                </label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[10, 50, 100, 300].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${
                        slippage === value
                          ? "bg-blue-500 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {value / 100}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={slippage / 100}
                  onChange={(e) => setSlippage(Number.parseFloat(e.target.value) * 100)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500"
                  placeholder="Custom %"
                  step="0.01"
                  min="0.01"
                  max="50"
                />
              </div>

              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-4 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-boxdark">
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Swap</h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchQuote}
                disabled={quoteLoading}
                className="p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                title="Refresh Quote"
              >
                <RefreshIcon className={`w-5 h-5 ${quoteLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={fetchSupportedNetworks}
                className="hidden sm:block px-4 py-3 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors"
                title="Test Backend Connection"
              >
                Test API
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Network Selector */}
        <div className="mb-6 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Network</label>
            {connectedWallet && <div className="text-xs text-gray-500 dark:text-gray-400">Web3 Balance</div>}
          </div>
          <select
            value={selectedNetwork.chain_id}
            onChange={(e) => handleNetworkChange(Number.parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
          >
            {networkOptions.map((network) => (
              <option key={network.chain_id} value={network.chain_id}>
                {network.name} {network.isTestnet ? "(Testnet)" : ""}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${balanceLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`}
              ></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedNetwork.name} {selectedNetwork.isTestnet ? "(Testnet)" : ""}
                {balanceLoading && " - Fetching balances..."}
              </span>
            </div>
            {connectedWallet && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>
                  {connectedWallet.substring(0, 6)}...
                  {connectedWallet.substring(connectedWallet.length - 4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Wallet Connection Prompt */}
        {!connectedWallet && (
          <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl dark:bg-yellow-900/20 dark:border-yellow-800">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-yellow-900">
                <svg
                  className="w-4 h-4 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Connect Your Wallet</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Connect your wallet to view token balances and execute trades. Go to the user menu (top right) to
                  connect.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Network Mismatch Warning */}
        {connectedWallet && walletChainId && walletChainId !== selectedNetwork.chain_id && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex flex-col space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-blue-900">
                  <svg
                    className="w-4 h-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">Network Mismatch</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Your wallet is on{" "}
                    <span className="font-semibold">
                      {networkOptions.find((n) => n.chain_id === walletChainId)?.name || `Chain ${walletChainId}`}
                    </span>
                    , but you've selected <span className="font-semibold">{selectedNetwork.name}</span>. Balances shown
                    are for your wallet's current network.
                  </p>
                </div>
              </div>
              <button
                onClick={switchWalletNetwork}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                title={`Switch wallet to ${selectedNetwork.name}`}
              >
                Switch Network
              </button>
            </div>
          </div>
        )}

        {/* Swap Interface */}
        <div className="mb-6 p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          {/* Sell Token */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">You pay</label>
              <div className="flex items-center space-x-2">
                {balanceLoading ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Balance: {sellToken?.balance || "0.00"}
                    </span>
                    {sellToken?.balance && Number.parseFloat(sellToken.balance) > 0 && (
                      <button
                        onClick={() => handleMaxClick("sell")}
                        className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800"
                      >
                        MAX
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl dark:bg-gray-700">
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-bold outline-none dark:text-white min-w-0"
              />
              <button
                onClick={() => openTokenSelector("sell")}
                className="flex items-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors flex-shrink-0 dark:bg-gray-600 dark:border-gray-500 dark:hover:bg-gray-500"
              >
                {sellToken ? (
                  <>
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {sellToken.symbol.charAt(0)}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{sellToken.symbol}</span>
                  </>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">Select</span>
                )}
                <ChevronDownIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center my-4">
            <button
              onClick={swapTokens}
              className="p-3 bg-gray-100 border-4 border-white rounded-2xl hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:border-gray-800 dark:hover:bg-gray-600"
            >
              <ArrowsUpDownIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Buy Token */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">You receive</label>
              <div className="flex items-center space-x-2">
                {balanceLoading ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Balance: {buyToken?.balance || "0.00"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl dark:bg-gray-700">
              <input
                type="number"
                value={buyAmount}
                readOnly
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-bold outline-none dark:text-white min-w-0"
              />
              <button
                onClick={() => openTokenSelector("buy")}
                className="flex items-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors flex-shrink-0 dark:bg-gray-600 dark:border-gray-500 dark:hover:bg-gray-500"
              >
                {buyToken ? (
                  <>
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {buyToken.symbol.charAt(0)}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{buyToken.symbol}</span>
                  </>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">Select</span>
                )}
                <ChevronDownIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quote Information */}
          {quoteLoading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Getting best price...</span>
              </div>
            </div>
          )}

          {quoteError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl dark:bg-red-900/20 dark:border-red-800">
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">{quoteError}</span>
            </div>
          )}

          {quote && !quoteLoading && (
            <div className="mb-6 p-4 bg-gray-50 rounded-2xl dark:bg-gray-700">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Exchange Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    1 {sellToken?.symbol} = {Number.parseFloat(quote.price).toFixed(6)} {buyToken?.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Slippage Tolerance</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{slippage / 100}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Estimated Gas</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Number.parseInt(quote.estimated_gas).toLocaleString()}
                  </span>
                </div>
                {quote.price_impact && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Price Impact</span>
                    <span
                      className={`font-semibold ${Number.parseFloat(quote.price_impact) > 5 ? "text-red-500" : "text-green-500"}`}
                    >
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
              !quote ||
              loading ||
              !sellAmount ||
              !sellToken ||
              !buyToken ||
              quoteLoading ||
              (sellToken && buyToken && sellToken.address.toLowerCase() === buyToken.address.toLowerCase())
            }
            className={`w-full py-4 text-lg font-bold rounded-2xl transition-all ${
              quote &&
              sellAmount &&
              !loading &&
              sellToken &&
              buyToken &&
              !quoteLoading &&
              !(sellToken && buyToken && sellToken.address.toLowerCase() === buyToken.address.toLowerCase())
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600 hover:shadow-xl active:scale-[0.98]"
                : "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Swapping...</span>
              </div>
            ) : !sellToken || !buyToken ? (
              "Select tokens"
            ) : sellToken && buyToken && sellToken.address.toLowerCase() === buyToken.address.toLowerCase() ? (
              "Cannot swap same token"
            ) : !sellAmount ? (
              "Enter amount"
            ) : quoteLoading ? (
              "Getting quote..."
            ) : !quote ? (
              "Enter amount to see quote"
            ) : (
              `Swap ${sellToken.symbol} for ${buyToken.symbol}`
            )}
          </button>
        </div>

        {/* Recent Trades */}
        {tradeHistory.length > 0 && (
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Recent Trades
              </h3>
              <button
                onClick={() => {
                  fetchTradeHistory()
                  if (connectedWallet) {
                    fetchTokenBalances(true)
                  }
                }}
                disabled={balanceLoading}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                title="Refresh Trades & Balances"
              >
                <span className={balanceLoading ? "animate-spin" : ""}>↻</span>
                <span>Refresh</span>
              </button>
            </div>

            <div className="custom-scroll max-h-80 space-y-3 overflow-y-auto">
              {tradeHistory.slice(0, 5).map((trade) => {
                const sellTokenInfo = Object.values(tokensByNetwork)
                  .flat()
                  .find((t) => t.address.toLowerCase() === trade.sell_token.toLowerCase())
                const buyTokenInfo = Object.values(tokensByNetwork)
                  .flat()
                  .find((t) => t.address.toLowerCase() === trade.buy_token.toLowerCase())

                const formatAmount = (amount: string, decimals = 18) => {
                  try {
                    const formatted = (Number.parseFloat(amount) / Math.pow(10, decimals)).toFixed(4)
                    return Number.parseFloat(formatted).toString()
                  } catch {
                    return "0"
                  }
                }

                return (
                  <div
                    key={trade.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {sellTokenInfo?.symbol.charAt(0) || "?"}
                          </div>
                          <span className="text-xs text-gray-400">→</span>
                          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {buyTokenInfo?.symbol.charAt(0) || "?"}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {formatAmount(trade.sell_amount, sellTokenInfo?.decimals)} {sellTokenInfo?.symbol} →{" "}
                            {formatAmount(trade.buy_amount, buyTokenInfo?.decimals)} {buyTokenInfo?.symbol}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {new Date(trade.created_at).toLocaleDateString()} •{" "}
                            <span className="hidden sm:inline">{trade.network_name || `Chain ${trade.chain_id}`}</span>
                            <span className="sm:hidden">
                              {trade.network_name?.split(" ")[0] || `C${trade.chain_id}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            trade.status === "success"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : trade.status === "failed"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {trade.status === "success" ? "✓" : trade.status === "failed" ? "✗" : "⏳"}
                        </div>
                        {trade.status === "pending" && (
                          <button
                            onClick={() => refreshTransactionStatus(trade.transaction_hash, trade.chain_id)}
                            className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
                            title="Check Status"
                          >
                            ↻
                          </button>
                        )}
                        <a
                          href={getExplorerTxUrl(trade.chain_id, trade.transaction_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {tradeHistory.length > 5 && (
              <div className="mt-3 text-center">
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
