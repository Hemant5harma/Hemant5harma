import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, X } from "lucide-react"
import ManageBots from "./ManageBots"

interface DCAState {
  notifications: Notification[]
  dcaSettings: {
    assets: { symbol: string; name: string; allocation: number }[]
    frequency: string
    duration: string
    botName: string
    thresholdValue: number
  }
  availableBalance: number
  tradingType: "spot" | "futures"
  futuresStrategy: "long" | "short"
}

interface Notification {
  id: string
  type: "buy" | "sell"
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
    frequency: "1 Day",
    duration: "6 Months",
    botName: "DCA Bot 1",
    thresholdValue: 10,
  },
  availableBalance: 990059.94,
  tradingType: "spot",
  futuresStrategy: "long",
}

const cryptocurrencies = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "BNB", name: "Binance Coin" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "XRP", name: "Ripple" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "MATIC", name: "Polygon" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "UNI", name: "Uniswap" },
  { symbol: "ATOM", name: "Cosmos" },
  { symbol: "ALGO", name: "Algorand" },
  { symbol: "XLM", name: "Stellar" },
  { symbol: "VET", name: "VeChain" },
  { symbol: "FTM", name: "Fantom" },
  { symbol: "THETA", name: "Theta Network" },
  { symbol: "HBAR", name: "Hedera" },
]

const DCATrading: React.FC = () => {
  const [dca, setDca] = useState<DCAState>(initialState)
  const [showCryptoModal, setShowCryptoModal] = useState(false)
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    const newTotalValue = dca.dcaSettings.assets.reduce((sum, asset) => sum + asset.allocation, 0)
    setTotalValue(newTotalValue)
  }, [dca.dcaSettings.assets])

  const handleUpdateDCASettings = (field: keyof DCAState["dcaSettings"], value: string | number) => {
    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        [field]: value,
      },
    }))
  }

  const handleSubmitDCA = () => {
    const newNotification = {
      id: Date.now().toString(),
      type: "buy" as const,
      message: `New DCA created for ${dca.dcaSettings.assets.map((c) => c.symbol).join(", ")}: ${totalValue} USDT (${dca.tradingType} ${dca.tradingType === "futures" ? `- ${dca.futuresStrategy}` : ""})`,
      timestamp: Date.now(),
    }

    setDca((prevState) => ({
      ...prevState,
      notifications: [newNotification, ...prevState.notifications],
    }))
  }

  const handleTradingTypeChange = (type: "spot" | "futures") => {
    setDca((prevState) => ({
      ...prevState,
      tradingType: type,
    }))
  }

  const handleFuturesStrategyChange = (strategy: "long" | "short") => {
    setDca((prevState) => ({
      ...prevState,
      futuresStrategy: strategy,
    }))
  }

  const handleAddCrypto = (crypto: { symbol: string; name: string }) => {
    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        assets: [...prevState.dcaSettings.assets, { ...crypto, allocation: 0 }],
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

  const handleAllocationChange = (symbol: string, allocation: number) => {
    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        assets: prevState.dcaSettings.assets.map((asset) =>
          asset.symbol === symbol ? { ...asset, allocation } : asset,
        ),
      },
    }))
  }

  return (
    <div className="min-h-screen p-4 bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h1 className="text-3xl  font-bold mb-6 text-center">DCA Trading Bot Creator</h1>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
          >
            <label className="block text-sm font-medium mb-2">Selected Cryptocurrencies</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {dca.dcaSettings.assets.map((asset) => (
                <div key={asset.symbol} className="flex items-center space-x-2">
                  <span>
                    {asset.name} ({asset.symbol})
                  </span>
                  <input
                    type="number"
                    value={asset.allocation}
                    onChange={(e) => handleAllocationChange(asset.symbol, Number(e.target.value))}
                    className="w-20 bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Allocation %"
                  />
                  <button onClick={() => handleRemoveCrypto(asset.symbol)} className="text-red-500 hover:text-red-700">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowCryptoModal(true)}
              className="mt-2 flex items-center space-x-1 text-blue-500 hover:text-blue-700"
            >
              <Plus size={16} />
              <span>Add Crypto</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <label className="block text-sm font-medium mb-2">Trading Type</label>
            <select
              value={dca.tradingType}
              onChange={(e) => handleTradingTypeChange(e.target.value as "spot" | "futures")}
              className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="spot">Spot</option>
              <option value="futures">Futures</option>
            </select>
          </motion.div>

          {dca.tradingType === "futures" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <label className="block text-sm font-medium mb-2">Futures Strategy</label>
              <select
                value={dca.futuresStrategy}
                onChange={(e) => handleFuturesStrategyChange(e.target.value as "long" | "short")}
                className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <label className="block text-sm font-medium mb-2">Total Value (USDT)</label>
            <div className="text-2xl font-bold">{totalValue.toFixed(2)} USDT</div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Available Balance: {dca.availableBalance.toFixed(2)} USDT
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Threshold Value</label>
              <input
                type="number"
                value={dca.dcaSettings.thresholdValue}
                onChange={(e) => handleUpdateDCASettings("thresholdValue", Number.parseInt(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Frequency</label>
              <select
                value={dca.dcaSettings.frequency}
                onChange={(e) => handleUpdateDCASettings("frequency", e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>1 Day</option>
                <option>1 Week</option>
                <option>2 Weeks</option>
                <option>1 Month</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <select
                value={dca.dcaSettings.duration}
                onChange={(e) => handleUpdateDCASettings("duration", e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>1 Month</option>
                <option>3 Months</option>
                <option>6 Months</option>
                <option>1 Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bot Name</label>
              <input
                type="text"
                value={dca.dcaSettings.botName}
                onChange={(e) => handleUpdateDCASettings("botName", e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <button
              onClick={handleSubmitDCA}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create DCA Bot
            </button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <ManageBots />
      </div>

      {showCryptoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Select Cryptocurrency</h2>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {cryptocurrencies.map((crypto) => (
                <button
                  key={crypto.symbol}
                  onClick={() => handleAddCrypto(crypto)}
                  className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-left"
                >
                  {crypto.name} ({crypto.symbol})
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCryptoModal(false)}
              className="mt-4 w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DCATrading

