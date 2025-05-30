import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, ChevronDown, DollarSign, Clock, Tag, AlertCircle, Check } from "lucide-react"
import ManageBots from "./ManageBots"
import { apiClient } from "../utils/apiClient"
import { showNotification } from "@mantine/notifications"

interface DCAState {
  notifications: Notification[]
  dcaSettings: {
    assets: { symbol: string; name: string; amount: number; threshold: number; token_address: string }[]
    frequency: string
    botName: string
    chain_id: number
  }
  availableBalance: number
}

interface Notification {
  id: string
  type: "buy" | "sell" | "success"
  message: string
  timestamp: number
}

const initialState: DCAState = {
  notifications: [
    { id: "1", type: "buy", message: "Buy opportunity: Price dropped by 10%", timestamp: Date.now() - 86400000 },
    { id: "2", type: "sell", message: "Sell opportunity: 50% gain on portfolio", timestamp: Date.now() - 172800000 },
  ],
  dcaSettings: {
    assets: [],
    frequency: "1 minute",
    botName: "DCA Bot 1",
    chain_id: 10143, // Default to Monad testnet
  },
  availableBalance: 990059.94,
}

// Network configurations with chain_id, rpc_url, and network_name
const networkOptions = [
  { 
    value: 1, 
    label: "Ethereum Mainnet",
    shortName: "ETH",
    rpc_url: "https://eth-mainnet.g.alchemy.com/v2/your-api-key",
    network_name: "Ethereum Mainnet"
  },
  { 
    value: 137, 
    label: "Polygon",
    shortName: "MATIC",
    rpc_url: "https://polygon-rpc.com",
    network_name: "Polygon"
  },
  { 
    value: 56, 
    label: "Binance Smart Chain",
    shortName: "BSC",
    rpc_url: "https://bsc-dataseed.binance.org",
    network_name: "Binance Smart Chain"
  },
  { 
    value: 10143, 
    label: "Monad Testnet",
    shortName: "Monad",
    rpc_url: "https://testnet-rpc.monad.xyz",
    network_name: "Monad testnet"
  },
];

// Network-specific cryptocurrency configurations
const cryptocurrenciesByNetwork: Record<number, Array<{ symbol: string; name: string; token_address: string }>> = {
  // Ethereum Mainnet
  1: [
    { symbol: "USDC", name: "USD Coin", token_address: "0xA0b86a33E6441b4dc5029316a4B3D3536aDF38F5" },
    { symbol: "USDT", name: "Tether", token_address: "0xdac17f958d2ee523a2206206994597c13d831ec7" },
    { symbol: "WBTC", name: "Wrapped Bitcoin", token_address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599" },
    { symbol: "WETH", name: "Wrapped Ethereum", token_address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" },
  ],
  // Polygon
  137: [
    { symbol: "USDC", name: "USD Coin", token_address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174" },
    { symbol: "USDT", name: "Tether", token_address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f" },
    { symbol: "WBTC", name: "Wrapped Bitcoin", token_address: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6" },
    { symbol: "WETH", name: "Wrapped Ethereum", token_address: "0x7ceb23fd6f88b48c8f58f96b81b6c2f8f2f8f8f8" },
  ],
  // BSC
  56: [
    { symbol: "USDC", name: "USD Coin", token_address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d" },
    { symbol: "USDT", name: "Tether", token_address: "0x55d398326f99059ff775485246999027b3197955" },
    { symbol: "BTCB", name: "Bitcoin BEP20", token_address: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c" },
    { symbol: "WBNB", name: "Wrapped BNB", token_address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c" },
  ],
  // Monad Testnet
  10143: [
    { symbol: "USDC", name: "USDC (testnet)", token_address: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea" },
    { symbol: "USDT", name: "USDT (testnet)", token_address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D" },
    { symbol: "WBTC", name: "WBTC (testnet)", token_address: "0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d" },
    { symbol: "WETH", name: "WETH (testnet)", token_address: "0xB5a30b0FDc42e3E9760Cb8449Fb37" },
    { symbol: "WSOL", name: "WSOL (testnet)", token_address: "0x5387C85A4965769f6B0Df430638a1388493486F1" },
  ],
};

const frequencyOptions = [
  { value: "1 minute", label: "Every Minute" },
  { value: "5 minutes", label: "Every 5 Minutes" },
  { value: "15 minutes", label: "Every 15 Minutes" },
  { value: "1 hour", label: "Hourly" },
  { value: "4 hours", label: "Every 4 Hours" },
  { value: "1 day", label: "Daily" },
]

const DCATrading: React.FC = () => {
  const [dca, setDca] = useState<DCAState>(initialState)
  const [showCryptoModal, setShowCryptoModal] = useState(false)
  const [totalValue, setTotalValue] = useState(0)
  const [isCreatingBot, setIsCreatingBot] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const newTotalValue = dca.dcaSettings.assets.reduce((sum, asset) => sum + asset.amount, 0)
    setTotalValue(newTotalValue)
  }, [dca.dcaSettings.assets])

  const handleUpdateDCASettings = (field: keyof DCAState["dcaSettings"], value: string | number) => {
    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        [field]: value,
        // Clear assets when chain_id changes to show only network-specific tokens
        ...(field === "chain_id" && { assets: [] }),
      },
    }))
  }

  const handleSubmitDCA = () => {
    // Validate that there are assets before creating a bot
    if (dca.dcaSettings.assets.length === 0) {
      showNotification({
        title: "Validation Error",
        message: "Please add at least one cryptocurrency to create a DCA bot",
        color: "red",
      })
      return
    }

    // Validate chain_id is selected
    if (!dca.dcaSettings.chain_id) {
      showNotification({
        title: "Validation Error",
        message: "Please select a blockchain network",
        color: "red",
      })
      return
    }

    // Set loading state to true when starting the API call
    setIsCreatingBot(true)

    const selectedNetwork = networkOptions.find(net => net.value === dca.dcaSettings.chain_id);

    const apiData = {
      name: dca.dcaSettings.botName,
      frequency: dca.dcaSettings.frequency,
      chain_id: dca.dcaSettings.chain_id,
      rpc_url: selectedNetwork?.rpc_url,
      network_name: selectedNetwork?.network_name,
      coins: dca.dcaSettings.assets.map((asset) => ({
        token_address: asset.token_address,
        amount: asset.amount,
        threshold: asset.threshold,
      })),
    }

    console.log("Creating bot with data:", apiData); // Debug log

    // Make API call using the API client
    apiClient
      .post("/bots/create", apiData)
      .then((data) => {
        console.log("Bot created:", data)

        showNotification({
          title: "Bot Created",
          message: `Bot "${dca.dcaSettings.botName}" has been created successfully on ${selectedNetwork?.label}`,
          color: "green",
        })

        const newNotification: Notification = {
          id: String(Date.now()),
          type: "success",
          message: `New DCA bot "${dca.dcaSettings.botName}" created for ${dca.dcaSettings.assets
            .map((c) => c.symbol)
            .join(", ")} on ${selectedNetwork?.label}`,
          timestamp: Date.now(),
        }

        setDca((prevState) => ({
          ...prevState,
          notifications: [newNotification, ...prevState.notifications],
        }))

        // Reset loading state
        setIsCreatingBot(false)

        // Add a small delay before refreshing to ensure the notification is seen
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      })
      .catch((error) => {
        console.error("Error creating bot:", error)

        showNotification({
          title: "Error",
          message: error.message || "Failed to create bot",
          color: "red",
        })

        // Reset loading state
        setIsCreatingBot(false)
      })
  }

  const handleAddCrypto = (crypto: { symbol: string; name: string; token_address: string }) => {
    // Check if crypto is already added
    if (dca.dcaSettings.assets.some((asset) => asset.symbol === crypto.symbol)) {
      showNotification({
        title: "Already Added",
        message: `${crypto.name} is already in your selection`,
        color: "blue",
      })
      return
    }

    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        assets: [...prevState.dcaSettings.assets, { ...crypto, amount: 0, threshold: 1 }],
      },
    }))
    setShowCryptoModal(false)
  }

  const handleRemoveCrypto = (symbol: string) => {
    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        assets: prevState.dcaSettings.assets.filter((asset) => asset.symbol !== symbol),
      },
    }))
  }

  const handleAmountChange = (symbol: string, amount: number) => {
    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        assets: prevState.dcaSettings.assets.map((asset) => (asset.symbol === symbol ? { ...asset, amount } : asset)),
      },
    }))
  }

  const handleThresholdChange = (symbol: string, threshold: number) => {
    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        assets: prevState.dcaSettings.assets.map((asset) =>
          asset.symbol === symbol ? { ...asset, threshold } : asset,
        ),
      },
    }))
  }

  const filteredCryptocurrencies = cryptocurrenciesByNetwork[dca.dcaSettings.chain_id]?.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
  ) || []

  return (
    <div className="min-h-screen p-4 sm:p-6 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-boxdark rounded-2xl shadow-lg overflow-hidden mb-6"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 p-6 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold">DCA Trading Bot Creator</h1>
            <p className="mt-2 opacity-90">Create automated dollar-cost averaging strategies for cryptocurrencies</p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-8">
              {/* Bot Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Bot Name
                </label>
                <input
                  type="text"
                  value={dca.dcaSettings.botName}
                  onChange={(e) => handleUpdateDCASettings("botName", e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter a name for your bot"
                />
              </motion.div>

              {/* Frequency */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Trading Frequency
                </label>
                <div className="relative">
                  <select
                    value={dca.dcaSettings.frequency}
                    onChange={(e) => handleUpdateDCASettings("frequency", e.target.value)}
                    className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    {frequencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>

              {/* Blockchain Network */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Blockchain Network
                </label>
                <div className="relative">
                  <select
                    value={dca.dcaSettings.chain_id}
                    onChange={(e) => handleUpdateDCASettings("chain_id", Number(e.target.value))}
                    className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    {networkOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>

              {/* Selected Cryptocurrencies */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Selected Assets</h2>
                  <button
                    onClick={() => setShowCryptoModal(true)}
                    className="flex items-center space-x-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Add Asset</span>
                  </button>
                </div>

                {dca.dcaSettings.assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="bg-gray-100 dark:bg-gray-600 p-3 rounded-full mb-3">
                      <AlertCircle className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">No cryptocurrencies selected</p>
                    <button
                      onClick={() => setShowCryptoModal(true)}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                    >
                      Click to add your first asset
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {dca.dcaSettings.assets.map((asset) => (
                      <motion.div
                        key={asset.symbol}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
                      >
                        <div className="flex items-center mb-3 sm:mb-0">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 dark:from-purple-600 dark:to-indigo-700 flex items-center justify-center text-xs font-medium text-white shadow-sm mr-3">
                            {asset.symbol}
                          </div>
                          <div>
                            <h3 className="font-medium">{asset.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{asset.symbol}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount (USDT)</label>
                            <input
                              type="number"
                              value={asset.amount}
                              onChange={(e) => handleAmountChange(asset.symbol, Number(e.target.value))}
                              className="w-28 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                              min="0"
                              step="0.0001"
                              placeholder="0.0001"
                            />
                           
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Threshold (%)</label>
                            <input
                              type="number"
                              value={asset.threshold}
                              onChange={(e) => handleThresholdChange(asset.symbol, Number(e.target.value))}
                              className="w-24 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              min="0.1"
                              step="0.1"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveCrypto(asset.symbol)}
                            className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            aria-label="Remove asset"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Total Amount */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>Total Investment</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalValue < 0.01 && totalValue > 0
                        ? totalValue.toFixed(6) // Show more decimals for very small amounts
                        : totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                      }{" "}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">USDT</span>
                    </div>
                  </div>
                  {/* Available Balance - Commented out as requested */}
                  {/* <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available Balance</p>
                    <p className="font-medium">
                      {dca.availableBalance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">USDT</span>
                    </p>
                  </div> */}
                </div>

                {/* Available Balance validation - Commented out as requested */}
                {/* {totalValue > dca.availableBalance && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Total investment amount exceeds your available balance. Please adjust your allocation.</span>
                  </div>
                )} */}
              </motion.div>

              {/* Create Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <button
                  onClick={handleSubmitDCA}
                  disabled={isCreatingBot || dca.dcaSettings.assets.length === 0}
                  className={`w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition duration-300 flex items-center justify-center ${
                    isCreatingBot || dca.dcaSettings.assets.length === 0
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:shadow-lg transform hover:-translate-y-1"
                  }`}
                >
                  {isCreatingBot ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Bot...
                    </>
                  ) : (
                    "Create DCA Bot"
                  )}
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Manage Bots Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <ManageBots />
        </div>
      </div>

      {/* Cryptocurrency Selection Modal */}
      <AnimatePresence>
        {showCryptoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCryptoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Select Cryptocurrency</h2>
                <button
                  onClick={() => setShowCryptoModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search cryptocurrencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredCryptocurrencies?.length > 0 ? (
                  filteredCryptocurrencies.map((crypto) => {
                    const isSelected = dca.dcaSettings.assets.some((asset) => asset.symbol === crypto.symbol)
                    return (
                      <button
                        key={crypto.symbol}
                        onClick={() => !isSelected && handleAddCrypto(crypto)}
                        className={`p-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-purple-50 dark:bg-purple-900/20 cursor-default"
                            : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                        disabled={isSelected}
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 dark:from-purple-600 dark:to-indigo-700 flex items-center justify-center text-xs font-medium text-white shadow-sm mr-3">
                            {crypto.symbol.substring(0, 3)}
                          </div>
                          <div>
                            <p className="font-medium">{crypto.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{crypto.symbol}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="flex items-center text-purple-600 dark:text-purple-400 text-sm">
                            <Check className="h-4 w-4 mr-1" />
                            Added
                          </span>
                        )}
                      </button>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No cryptocurrencies found for this network</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowCryptoModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DCATrading