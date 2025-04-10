import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, X } from "lucide-react"
import ManageBots from "./ManageBots"
import { apiClient } from '../utils/apiClient';
import { showNotification } from '@mantine/notifications';

interface DCAState {
  notifications: Notification[]
  dcaSettings: {
    assets: { symbol: string; name: string; amount: number; threshold: number }[]
    frequency: string
    botName: string
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
  },
  availableBalance: 990059.94,
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
  const [isCreatingBot, setIsCreatingBot] = useState(false)

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
      },
    }))
  }

  const handleSubmitDCA = () => {
    // Validate that there are assets before creating a bot
    if (dca.dcaSettings.assets.length === 0) {
      showNotification({
        title: 'Validation Error',
        message: 'Please add at least one cryptocurrency to create a DCA bot',
        color: 'red',
      });
      return;
    }

    // Set loading state to true when starting the API call
    setIsCreatingBot(true);

    const apiData = {
      name: dca.dcaSettings.botName,
      frequency: dca.dcaSettings.frequency,
      coins: dca.dcaSettings.assets.map((asset) => ({
        token_address: asset.symbol.toLowerCase(),
        amount: asset.amount,
        threshold: asset.threshold,
      })),
    };

    // Make API call using the API client
    apiClient.post('/bots/create', apiData)
      .then((data) => {
        console.log("Bot created:", data);
        
        showNotification({
          title: 'Bot Created',
          message: `Bot "${dca.dcaSettings.botName}" has been created successfully`,
          color: 'green',
        });
        
        const newNotification: Notification = {
          id: String(Date.now()),
          type: "buy", 
          message: `New DCA bot "${dca.dcaSettings.botName}" created for ${dca.dcaSettings.assets.map((c) => c.symbol).join(", ")}`,
          timestamp: Date.now(),
        };

        setDca((prevState) => ({
          ...prevState,
          notifications: [newNotification, ...prevState.notifications],
        }));
        
        // Reset loading state
        setIsCreatingBot(false);
        
        // Add a small delay before refreshing to ensure the notification is seen
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      })
      .catch((error) => {
        console.error("Error creating bot:", error);
        
        showNotification({
          title: 'Error',
          message: error.message || 'Failed to create bot',
          color: 'red',
        });
        
        // Reset loading state
        setIsCreatingBot(false);
      });
  }

  const handleAddCrypto = (crypto: { symbol: string; name: string }) => {
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

  return (
    <div className="min-h-screen p-4 bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">DCA Trading Bot Creator</h1>

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
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col">
                      <label className="text-xs">Amount</label>
                      <input
                        type="number"
                        value={asset.amount}
                        onChange={(e) => handleAmountChange(asset.symbol, Number(e.target.value))}
                        className="w-20 bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs">Threshold</label>
                      <input
                        type="number"
                        value={asset.threshold}
                        onChange={(e) => handleThresholdChange(asset.symbol, Number(e.target.value))}
                        className="w-20 bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
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
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <label className="block text-sm font-medium mb-2">Total Amount</label>
            <div className="text-2xl font-bold">{totalValue.toFixed(2)} USDT</div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Available Balance: {dca.availableBalance.toFixed(2)} USDT
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Frequency</label>
              <select
                value={dca.dcaSettings.frequency}
                onChange={(e) => handleUpdateDCASettings("frequency", e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>1 minute</option>
                <option>5 minutes</option>
                <option>15 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
                <option>1 day</option>
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
              disabled={isCreatingBot}
              className={`w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center ${
                isCreatingBot ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 hover:scale-105'
              }`}
            >
              {isCreatingBot ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Bot...
                </>
              ) : (
                'Create DCA Bot'
              )}
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
