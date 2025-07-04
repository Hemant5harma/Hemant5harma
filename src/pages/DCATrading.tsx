import React, { useState, useEffect } from 'react';
import { showNotification } from '@mantine/notifications';
import { Plus, Tag, AlertCircle, X, Check, ChevronDown, Clock, DollarSign } from 'lucide-react';
import ConditionBuilder from '../components/ConditionBuilder';
import ManageBots from './ManageBots';
import { apiClient } from '../utils/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

interface DCAState {
  notifications: Notification[];
  dcaSettings: {
    assets: {
      symbol: string;
      name: string;
      amount: number;
      threshold: number;
      token_address: string;
      condition_type?: string;
      condition_params?: any;
    }[];
    frequency: string;
    botName: string;
    chain_id: number;
  };
  availableBalance: number;
}

interface Notification {
  id: string;
  type: 'buy' | 'sell' | 'success';
  message: string;
  timestamp: number;
}

const initialState: DCAState = {
  notifications: [
    {
      id: '1',
      type: 'buy',
      message: 'Buy opportunity: Price dropped by 10%',
      timestamp: Date.now() - 86400000,
    },
    {
      id: '2',
      type: 'sell',
      message: 'Sell opportunity: 50% gain on portfolio',
      timestamp: Date.now() - 172800000,
    },
  ],
  dcaSettings: {
    assets: [],
    frequency: '1 minute',
    botName: 'DCA Bot 1',
    chain_id: 10143, // Default to Monad testnet
  },
  availableBalance: 990059.94,
};

// Network configurations with chain_id, rpc_url, and network_name
const networkOptions = [
  {
    value: 1,
    label: 'Ethereum Mainnet',
    shortName: 'ETH',
    rpc_url: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    network_name: 'Ethereum Mainnet',
  },
  {
    value: 137,
    label: 'Polygon',
    shortName: 'MATIC',
    rpc_url: 'https://polygon-rpc.com',
    network_name: 'Polygon',
  },
  {
    value: 56,
    label: 'Binance Smart Chain',
    shortName: 'BSC',
    rpc_url: 'https://bsc-dataseed.binance.org',
    network_name: 'Binance Smart Chain',
  },
  {
    value: 10143,
    label: 'Monad Testnet',
    shortName: 'Monad',
    rpc_url: 'https://testnet-rpc.monad.xyz',
    network_name: 'Monad testnet',
  },
];

// Network-specific cryptocurrency configurations
const cryptocurrenciesByNetwork: Record<
  number,
  Array<{ symbol: string; name: string; token_address: string }>
> = {
  // Ethereum Mainnet
  1: [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      token_address: '0xA0b86a33E6441b4dc5029316a4B3D3536aDF38F5',
    },
    { symbol: 'USDT', name: 'Tether', token_address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      token_address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      token_address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    },
  ],
  // Polygon
  137: [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      token_address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    },
    { symbol: 'USDT', name: 'Tether', token_address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f' },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      token_address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      token_address: '0x7ceb23fd6f88b48c8f58f96b81b6c2f8f2f8f8f8',
    },
  ],
  // BSC
  56: [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      token_address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    },
    { symbol: 'USDT', name: 'Tether', token_address: '0x55d398326f99059ff775485246999027b3197955' },
    {
      symbol: 'BTCB',
      name: 'Bitcoin BEP20',
      token_address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
    },
    {
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      token_address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    },
  ],
  // Monad Testnet
  10143: [
    {
      symbol: 'USDC',
      name: 'USDC (testnet)',
      token_address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
    },
    {
      symbol: 'USDT',
      name: 'USDT (testnet)',
      token_address: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
    },
    {
      symbol: 'WBTC',
      name: 'WBTC (testnet)',
      token_address: '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d',
    },
    { symbol: 'WETH', name: 'WETH (testnet)', token_address: '0xB5a30b0FDc42e3E9760Cb8449Fb37' },
    {
      symbol: 'WSOL',
      name: 'WSOL (testnet)',
      token_address: '0x5387C85A4965769f6B0Df430638a1388493486F1',
    },
  ],
};

const frequencyOptions = [
  { value: '1 minute', label: 'Every Minute' },
  { value: '5 minutes', label: 'Every 5 Minutes' },
  { value: '15 minutes', label: 'Every 15 Minutes' },
  { value: '1 hour', label: 'Hourly' },
  { value: '4 hours', label: 'Every 4 Hours' },
  { value: '1 day', label: 'Daily' },
];

const DCATrading: React.FC = () => {
  const [dca, setDca] = useState<DCAState>(initialState);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [isCreatingBot, setIsCreatingBot] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const newTotalValue = dca.dcaSettings.assets.reduce((sum, asset) => sum + asset.amount, 0);
    setTotalValue(newTotalValue);
  }, [dca.dcaSettings.assets]);

  const handleUpdateDCASettings = (
    field: keyof DCAState['dcaSettings'],
    value: string | number,
  ) => {
    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        [field]: value,
        // Clear assets when chain_id changes to show only network-specific tokens
        ...(field === 'chain_id' && { assets: [] }),
      },
    }));
  };

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

    // Validate chain_id is selected
    if (!dca.dcaSettings.chain_id) {
      showNotification({
        title: 'Validation Error',
        message: 'Please select a blockchain network',
        color: 'red',
      });
      return;
    }

    // Set loading state to true when starting the API call
    setIsCreatingBot(true);

    const selectedNetwork = networkOptions.find((net) => net.value === dca.dcaSettings.chain_id);

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
        condition_type: asset.condition_type || 'price_drop',
        condition_params: asset.condition_params || { threshold: asset.threshold },
      })),
    };

    console.log('Creating bot with data:', apiData); // Debug log

    // Make API call using the API client
    apiClient
      .post('/bots/create', apiData)
      .then((data) => {
        console.log('Bot created successfully:', data);

        showNotification({
          title: 'Success!',
          message: `DCA Bot "${dca.dcaSettings.botName}" created successfully`,
          color: 'green',
        });

        // Reset form to initial state
        setDca(initialState);
        setIsCreatingBot(false);
      })
      .catch((error) => {
        console.error('Error creating bot:', error);

        showNotification({
          title: 'Error',
          message: error.response?.data?.detail || 'Failed to create bot. Please try again.',
          color: 'red',
        });
        setIsCreatingBot(false);
      });
  };

  const handleAddCrypto = (crypto: { symbol: string; name: string; token_address: string }) => {
    // Check if crypto is already added
    if (dca.dcaSettings.assets.some((asset) => asset.symbol === crypto.symbol)) {
      showNotification({
        title: 'Already Added',
        message: `${crypto.name} is already in your selection`,
        color: 'blue',
      });
      return;
    }

    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        assets: [
          ...prevState.dcaSettings.assets,
          {
            ...crypto,
            amount: 10,
            threshold: 5.0,
            condition_type: 'price_drop',
            condition_params: { threshold: 5.0 },
          },
        ],
      },
    }));
    setShowCryptoModal(false);
  };

  const handleRemoveCrypto = (symbol: string) => {
    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        assets: prevState.dcaSettings.assets.filter((asset) => asset.symbol !== symbol),
      },
    }));
  };

  const handleAmountChange = (symbol: string, amount: number) => {
    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        assets: prevState.dcaSettings.assets.map((asset) =>
          asset.symbol === symbol ? { ...asset, amount } : asset,
        ),
      },
    }));
  };

  const handleConditionChange = (
    symbol: string,
    conditionData: { condition_type: string; condition_params: any },
  ) => {
    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        assets: prevState.dcaSettings.assets.map((asset) =>
          asset.symbol === symbol
            ? {
                ...asset,
                condition_type: conditionData.condition_type,
                condition_params: conditionData.condition_params,
                // Update threshold for backward compatibility
                threshold: conditionData.condition_params?.threshold || asset.threshold,
              }
            : asset,
        ),
      },
    }));
  };

  const filteredCryptocurrencies =
    cryptocurrenciesByNetwork[dca.dcaSettings.chain_id]?.filter(
      (crypto) =>
        crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  return (
    <div className="min-h-screen p-4 text-gray-900 dark:text-gray-100 sm:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-boxdark"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white dark:from-purple-700 dark:to-indigo-800">
            <h1 className="text-2xl font-bold sm:text-3xl">DCA Trading Bot Creator</h1>
            <p className="mt-2 opacity-90">
              Create automated dollar-cost averaging strategies for cryptocurrencies
            </p>
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
                <label className="mb-2 block flex items-center text-sm font-medium">
                  <Tag className="mr-2 h-4 w-4" />
                  Bot Name
                </label>
                <input
                  type="text"
                  value={dca.dcaSettings.botName}
                  onChange={(e) => handleUpdateDCASettings('botName', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Enter a name for your bot"
                />
              </motion.div>

              {/* Frequency */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <label className="mb-2 block flex items-center text-sm font-medium">
                  <Clock className="mr-2 h-4 w-4" />
                  Trading Frequency
                </label>
                <div className="relative">
                  <select
                    value={dca.dcaSettings.frequency}
                    onChange={(e) => handleUpdateDCASettings('frequency', e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-10 shadow-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
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
                <label className="mb-2 block flex items-center text-sm font-medium">
                  <Tag className="mr-2 h-4 w-4" />
                  Blockchain Network
                </label>
                <div className="relative">
                  <select
                    value={dca.dcaSettings.chain_id}
                    onChange={(e) => handleUpdateDCASettings('chain_id', Number(e.target.value))}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-10 shadow-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
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
                className="rounded-xl bg-gray-50 p-5 dark:bg-gray-700"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Selected Assets</h2>
                  <button
                    onClick={() => setShowCryptoModal(true)}
                    className="flex items-center space-x-1 text-purple-600 transition-colors hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Add Asset</span>
                  </button>
                </div>

                {dca.dcaSettings.assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 rounded-full bg-gray-100 p-3 dark:bg-gray-600">
                      <AlertCircle className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <p className="mb-2 text-gray-600 dark:text-gray-400">
                      No cryptocurrencies selected
                    </p>
                    <button
                      onClick={() => setShowCryptoModal(true)}
                      className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      Click to add your first asset
                    </button>
                  </div>
                ) : (
                  <div className="custom-scroll max-h-[600px] space-y-4 overflow-y-auto pr-1">
                    {dca.dcaSettings.assets.map((asset) => (
                      <motion.div
                        key={asset.symbol}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                      >
                        {/* Asset Header */}
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 text-sm font-medium text-white shadow-sm dark:from-purple-600 dark:to-indigo-700">
                              {asset.symbol}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">{asset.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {asset.symbol}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCrypto(asset.symbol)}
                            className="rounded-full bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                            aria-label="Remove asset"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        {/* Amount Input */}
                        <div className="mb-4">
                          <label className="mb-2 block text-sm font-medium">
                            Investment Amount (USDT)
                          </label>
                          <input
                            type="number"
                            value={asset.amount}
                            onChange={(e) =>
                              handleAmountChange(asset.symbol, Number(e.target.value))
                            }
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
                            min="0"
                            step="0.0001"
                            placeholder="Enter amount in USDT"
                          />
                        </div>

                        {/* Condition Builder */}
                        <div className="mb-2">
                          <label className="mb-2 block text-sm font-medium">
                            Trading Condition
                          </label>
                          <ConditionBuilder
                            value={{
                              condition_type: asset.condition_type || 'price_drop',
                              condition_params: asset.condition_params || {
                                threshold: asset.threshold,
                              },
                            }}
                            onChange={(conditionData) =>
                              handleConditionChange(asset.symbol, conditionData)
                            }
                            className="mt-2"
                          />
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
                className="rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 p-5 dark:from-purple-900/20 dark:to-indigo-900/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="mb-1 flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      <DollarSign className="mr-1 h-4 w-4" />
                      <span>Total Investment</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalValue < 0.01 && totalValue > 0
                        ? totalValue.toFixed(6) // Show more decimals for very small amounts
                        : totalValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}{' '}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        USDT
                      </span>
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
                  className={`flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 font-medium text-white transition duration-300 hover:from-purple-700 hover:to-indigo-700 ${
                    isCreatingBot || dca.dcaSettings.assets.length === 0
                      ? 'cursor-not-allowed opacity-70'
                      : 'transform hover:-translate-y-1 hover:shadow-lg'
                  }`}
                >
                  {isCreatingBot ? (
                    <>
                      <svg
                        className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
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
                    'Create DCA Bot'
                  )}
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Manage Bots Section */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-800">
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm"
            onClick={() => setShowCryptoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Select Cryptocurrency</h2>
                <button
                  onClick={() => setShowCryptoModal(false)}
                  className="rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
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
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
              </div>

              <div className="custom-scroll grid max-h-[400px] grid-cols-1 gap-2 overflow-y-auto pr-1">
                {filteredCryptocurrencies?.length > 0 ? (
                  filteredCryptocurrencies.map((crypto) => {
                    const isSelected = dca.dcaSettings.assets.some(
                      (asset) => asset.symbol === crypto.symbol,
                    );
                    return (
                      <button
                        key={crypto.symbol}
                        onClick={() => !isSelected && handleAddCrypto(crypto)}
                        className={`flex items-center justify-between rounded-lg p-3 text-left transition-colors ${
                          isSelected
                            ? 'cursor-default bg-purple-50 dark:bg-purple-900/20'
                            : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600'
                        }`}
                        disabled={isSelected}
                      >
                        <div className="flex items-center">
                          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 text-xs font-medium text-white shadow-sm dark:from-purple-600 dark:to-indigo-700">
                            {crypto.symbol.substring(0, 3)}
                          </div>
                          <div>
                            <p className="font-medium">{crypto.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {crypto.symbol}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="flex items-center text-sm text-purple-600 dark:text-purple-400">
                            <Check className="mr-1 h-4 w-4" />
                            Added
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No cryptocurrencies found for this network
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowCryptoModal(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DCATrading;
