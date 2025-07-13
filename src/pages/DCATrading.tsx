import type React from 'react';
import { useState, useEffect } from 'react';
import { showNotification } from '@mantine/notifications';
import {
  Plus,
  Tag,
  AlertCircle,
  X,
  Check,
  ChevronDown,
  Clock,
  DollarSign,
  Zap,
  TrendingUp,
  Shield,
  Search,
} from 'lucide-react';
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
    chain_id: 10143,
  },
  availableBalance: 990059.94,
};

const networkOptions = [
  {
    value: 1,
    label: 'Ethereum Mainnet',
    shortName: 'ETH',
    rpc_url: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    network_name: 'Ethereum Mainnet',
    color: 'from-primary to-secondary',
  },
  {
    value: 137,
    label: 'Polygon',
    shortName: 'MATIC',
    rpc_url: 'https://polygon-rpc.com',
    network_name: 'Polygon',
    color: 'from-primary to-secondary',
  },
  {
    value: 56,
    label: 'Binance Smart Chain',
    shortName: 'BSC',
    rpc_url: 'https://bsc-dataseed.binance.org',
    network_name: 'Binance Smart Chain',
    color: 'from-primary to-secondary',
  },
  {
    value: 10143,
    label: 'Monad Testnet',
    shortName: 'Monad',
    rpc_url: 'https://testnet-rpc.monad.xyz',
    network_name: 'Monad testnet',
    color: 'from-primary to-secondary',
  },
];

const cryptocurrenciesByNetwork: Record<
  number,
  Array<{ symbol: string; name: string; token_address: string; color?: string }>
> = {
  1: [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      token_address: '0xA0b86a33E6441b4dc5029316a4B3D3536aDF38F5',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      token_address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      token_address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      token_address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      color: 'from-primary to-secondary',
    },
  ],
  137: [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      token_address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      token_address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      token_address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      token_address: '0x7ceb23fd6f88b48c8f58f96b81b6c2f8f2f8f8f8',
      color: 'from-primary to-secondary',
    },
  ],
  56: [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      token_address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      token_address: '0x55d398326f99059ff775485246999027b3197955',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'BTCB',
      name: 'Bitcoin BEP20',
      token_address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      token_address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      color: 'from-primary to-secondary',
    },
  ],
  10143: [
    {
      symbol: 'USDC',
      name: 'USDC (testnet)',
      token_address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'USDT',
      name: 'USDT (testnet)',
      token_address: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'WBTC',
      name: 'WBTC (testnet)',
      token_address: '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'WETH',
      name: 'WETH (testnet)',
      token_address: '0xB5a30b0FDc42e3E9760Cb8449Fb37',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'WSOL',
      name: 'WSOL (testnet)',
      token_address: '0x5387C85A4965769f6B0Df430638a1388493486F1',
      color: 'from-primary to-secondary',
    },
  ],
};

const frequencyOptions = [
  { value: '1 minute', label: 'Every Minute', icon: '⚡' },
  { value: '5 minutes', label: 'Every 5 Minutes', icon: '🔥' },
  { value: '15 minutes', label: 'Every 15 Minutes', icon: '⏰' },
  { value: '1 hour', label: 'Hourly', icon: '🕐' },
  { value: '4 hours', label: 'Every 4 Hours', icon: '📅' },
  { value: '1 day', label: 'Daily', icon: '🌅' },
];

const DCATrading: React.FC = () => {
  const [dca, setDca] = useState<DCAState>(initialState);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [isCreatingBot, setIsCreatingBot] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const newTotalValue = dca.dcaSettings.assets.reduce((sum, asset) => sum + asset.amount, 0);
    setTotalValue(newTotalValue);
  }, [dca.dcaSettings.assets]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!dca.dcaSettings.botName.trim()) {
      errors.push('Bot name is required');
    }

    if (dca.dcaSettings.assets.length === 0) {
      errors.push('Please add at least one cryptocurrency');
    }

    if (!dca.dcaSettings.chain_id) {
      errors.push('Please select a blockchain network');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleUpdateDCASettings = (
    field: keyof DCAState['dcaSettings'],
    value: string | number,
  ) => {
    setDca((prevState) => ({
      ...prevState,
      dcaSettings: {
        ...prevState.dcaSettings,
        [field]: value,
        ...(field === 'chain_id' && { assets: [] }),
      },
    }));

    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSubmitDCA = () => {
    if (!validateForm()) {
      validationErrors.forEach((error) => {
        showNotification({
          title: 'Validation Error',
          message: error,
          color: 'red',
        });
      });
      return;
    }

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

    apiClient
      .post('/bots/create', apiData)
      .then((data) => {
        showNotification({
          title: 'Success! 🎉',
          message: `DCA Bot "${dca.dcaSettings.botName}" created successfully`,
          color: 'green',
        });
        setDca(initialState);
        setIsCreatingBot(false);
      })
      .catch((error) => {
        showNotification({
          title: 'Error',
          message: error.response?.data?.detail || 'Failed to create bot. Please try again.',
          color: 'red',
        });
        setIsCreatingBot(false);
      });
  };

  const handleAddCrypto = (crypto: {
    symbol: string;
    name: string;
    token_address: string;
    color?: string;
  }) => {
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
    setSearchTerm('');
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
                threshold: conditionData.condition_params?.threshold || asset.threshold,
              }
            : asset,
        ),
      },
    }));
  };

  const selectedNetwork = networkOptions.find((net) => net.value === dca.dcaSettings.chain_id);
  const filteredCryptocurrencies =
    cryptocurrenciesByNetwork[dca.dcaSettings.chain_id]?.filter(
      (crypto) =>
        crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-secondary/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="bg-[#FFFFFF] dark:bg-boxdark">
        <div className="mx-auto max-w-5xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 text-center"
          >
            <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-medium text-black dark:from-primary dark:to-secondary dark:text-white">
              <Zap className="mr-2 h-4 w-4" />
              Automated Trading Made Simple
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              DCA Trading Bot
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {' '}
                Creator
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Create intelligent dollar-cost averaging strategies with advanced conditions and
              automated execution across multiple blockchains.
            </p>
          </motion.div>

          {/* Main Configuration Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 overflow-hidden rounded-3xl bg-[#FFFFFF] shadow-xl dark:bg-gray-800/80 dark:shadow-none"
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-primary to-secondary px-6 py-8 sm:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white sm:text-3xl">Bot Configuration</h2>
                  <p className="mt-2 text-purple-100">Set up your automated trading strategy</p>
                </div>
                <div className="hidden sm:block">
                  <div className="rounded-full bg-white/20 p-3">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="bg-[#FAFBFC] p-6 shadow-inner dark:bg-gray-800 dark:shadow-none sm:p-8">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Bot Name */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <label className="mb-3 flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Tag className="mr-2 h-5 w-5 text-primary" />
                      Bot Name
                    </label>
                    <input
                      type="text"
                      value={dca.dcaSettings.botName}
                      onChange={(e) => handleUpdateDCASettings('botName', e.target.value)}
                      className="w-full rounded-xl border-2 border-gray-200 bg-[#FAFBFC] px-4 py-3 text-gray-900 transition-all duration-200 focus:border-primary focus:bg-[#FFFFFF] focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:focus:border-primary dark:focus:bg-gray-700"
                      placeholder="Enter a memorable name for your bot"
                    />
                  </motion.div>

                  {/* Trading Frequency */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <label className="mb-3 flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Clock className="mr-2 h-5 w-5 text-primary" />
                      Trading Frequency
                    </label>
                    <div className="relative">
                      <select
                        value={dca.dcaSettings.frequency}
                        onChange={(e) => handleUpdateDCASettings('frequency', e.target.value)}
                        className="w-full appearance-none rounded-xl border-2 border-gray-200 bg-[#FAFBFC] px-4 py-3 pr-12 text-gray-900 transition-all duration-200 focus:border-primary focus:bg-[#FFFFFF] focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:focus:border-primary dark:focus:bg-gray-700"
                      >
                        {frequencyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400">
                        <ChevronDown className="h-5 w-5" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Blockchain Network */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                  >
                    <label className="mb-3 flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                      Blockchain Network
                    </label>
                    <div className="relative">
                      <select
                        value={dca.dcaSettings.chain_id}
                        onChange={(e) =>
                          handleUpdateDCASettings('chain_id', Number(e.target.value))
                        }
                        className="w-full appearance-none rounded-xl border-2 border-gray-200 bg-[#FAFBFC] px-4 py-3 pr-12 text-gray-900 transition-all duration-200 focus:border-primary focus:bg-[#FFFFFF] focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:focus:border-primary dark:focus:bg-gray-700"
                      >
                        {networkOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400">
                        <ChevronDown className="h-5 w-5" />
                      </div>
                    </div>
                    {selectedNetwork && (
                      <div className="mt-2 flex items-center">
                        <div
                          className={`mr-2 h-3 w-3 rounded-full bg-gradient-to-r ${selectedNetwork.color}`}
                        ></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Connected to {selectedNetwork.shortName}
                        </span>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Right Column - Total Investment Summary */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="rounded-2xl bg-[#FAFBFC] p-6 shadow-sm dark:bg-gray-700/50 dark:shadow-sm"
                >
                  <div className="mb-4 flex items-center">
                    <DollarSign className="mr-2 h-6 w-6 text-primary dark:text-primary" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Investment Summary
                    </h3>
                  </div>

                  <div className="mb-6">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      $
                      {totalValue < 0.01 && totalValue > 0
                        ? totalValue.toFixed(6)
                        : totalValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total per execution
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Assets Selected:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {dca.dcaSettings.assets.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Frequency:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {dca.dcaSettings.frequency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Network:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedNetwork?.shortName || 'None'}
                      </span>
                    </div>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="mt-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/30">
                      <div className="flex items-start">
                        <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
                        <div className="text-sm text-red-700 dark:text-red-300">
                          <div className="font-medium">Please fix the following:</div>
                          <ul className="mt-1 list-inside list-disc space-y-1">
                            {validationErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Selected Assets Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 overflow-hidden rounded-3xl bg-[#FFFFFF] shadow-xl dark:bg-gray-800/80 dark:shadow-none"
          >
            <div className="bg-[#FAFBFC] p-6 shadow-inner dark:bg-gray-800 dark:shadow-none sm:p-8">
              <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Selected Assets
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Configure your cryptocurrency investments
                  </p>
                </div>
                <button
                  onClick={() => setShowCryptoModal(true)}
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 font-medium text-white shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Asset</span>
                </button>
              </div>

              {dca.dcaSettings.assets.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-[#FFFFFF] py-16 text-center dark:border-gray-600 dark:bg-gray-800 dark:shadow-none"
                >
                  <div className="mb-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 p-4 dark:from-primary/30 dark:to-secondary/30">
                    <AlertCircle className="h-8 w-8 text-primary dark:text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    No Assets Selected
                  </h3>
                  <p className="mb-4 max-w-sm text-gray-600 dark:text-gray-400">
                    Start building your DCA strategy by adding cryptocurrencies to invest in
                  </p>
                  <button
                    onClick={() => setShowCryptoModal(true)}
                    className="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:from-primary/90 hover:to-secondary/90 focus:outline-none focus:ring-4 focus:ring-primary/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Your First Asset</span>
                  </button>
                </motion.div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                  <AnimatePresence>
                    {dca.dcaSettings.assets.map((asset, index) => {
                      const cryptoData = cryptocurrenciesByNetwork[dca.dcaSettings.chain_id]?.find(
                        (crypto) => crypto.symbol === asset.symbol,
                      );

                      return (
                        <motion.div
                          key={asset.symbol}
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="group rounded-2xl border border-gray-200 bg-[#FFFFFF] p-6 shadow-lg transition-all duration-200 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:shadow-none dark:hover:shadow-none"
                        >
                          {/* Asset Header */}
                          <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center">
                              <div
                                className={`mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cryptoData?.color || 'from-primary to-secondary'} text-white shadow-lg`}
                              >
                                <span className="text-sm font-bold">
                                  {asset.symbol.substring(0, 3)}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {asset.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {asset.symbol}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveCrypto(asset.symbol)}
                              className="rounded-full bg-red-50 p-2 text-red-500 opacity-0 transition-all duration-200 hover:bg-red-100 group-hover:opacity-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                              aria-label={`Remove ${asset.name}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Amount Input */}
                          <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Investment Amount (USDT)
                            </label>
                            <input
                              type="number"
                              value={asset.amount}
                              onChange={(e) =>
                                handleAmountChange(asset.symbol, Number(e.target.value))
                              }
                              className="w-full rounded-lg border-2 border-gray-200 bg-[#FAFBFC] px-4 py-3 text-gray-900 transition-all duration-200 focus:border-primary focus:bg-[#FFFFFF] focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary"
                              min="0"
                              step="0.0001"
                              placeholder="0.00"
                            />
                          </div>

                          {/* Condition Builder */}
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                              className="rounded-lg border-2 border-gray-200 bg-[#FAFBFC] shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:shadow-none"
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

          {/* Create Bot Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <button
              onClick={handleSubmitDCA}
              disabled={isCreatingBot || dca.dcaSettings.assets.length === 0}
              className={`group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary p-1 shadow-xl transition-all duration-300 ${
                isCreatingBot || dca.dcaSettings.assets.length === 0
                  ? 'cursor-not-allowed opacity-60'
                  : 'hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]'
              }`}
            >
              <div className="rounded-xl bg-gradient-to-r from-primary to-secondary px-8 py-4 text-center">
                <div className="flex items-center justify-center space-x-3">
                  {isCreatingBot ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span className="text-lg font-semibold text-white">Creating Your Bot...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 text-white" />
                      <span className="text-lg font-semibold text-white">Create DCA Bot</span>
                    </>
                  )}
                </div>
                {!isCreatingBot && (
                  <p className="mt-1 text-sm text-purple-100">
                    Start automated trading with your configured strategy
                  </p>
                )}
              </div>
            </button>
          </motion.div>

          {/* Manage Bots Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="overflow-hidden rounded-3xl bg-[#FFFFFF] shadow-xl dark:bg-gray-800/80 dark:shadow-none"
          >
            <ManageBots />
          </motion.div>
        </div>
      </div>

      {/* Cryptocurrency Selection Modal */}
      <AnimatePresence>
        {showCryptoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowCryptoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg rounded-2xl bg-[#FFFFFF] p-6 shadow-2xl dark:bg-gray-800 dark:shadow-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Select Cryptocurrency
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose from {selectedNetwork?.label || 'available'} assets
                  </p>
                </div>
                <button
                  onClick={() => setShowCryptoModal(false)}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search cryptocurrencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-[#FAFBFC] py-3 pl-10 pr-4 text-gray-900 transition-all duration-200 focus:border-primary focus:bg-[#FFFFFF] focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>

              {/* Cryptocurrency List */}
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {filteredCryptocurrencies?.length > 0 ? (
                  filteredCryptocurrencies.map((crypto) => {
                    const isSelected = dca.dcaSettings.assets.some(
                      (asset) => asset.symbol === crypto.symbol,
                    );

                    return (
                      <button
                        key={crypto.symbol}
                        onClick={() => !isSelected && handleAddCrypto(crypto)}
                        className={`flex w-full items-center justify-between rounded-xl p-4 text-left transition-all duration-200 ${
                          isSelected
                            ? 'cursor-default bg-primary/10 dark:bg-primary/20'
                            : 'bg-[#FAFBFC] hover:bg-[#FFFFFF] hover:shadow-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:shadow-none'
                        }`}
                        disabled={isSelected}
                      >
                        <div className="flex items-center">
                          <div
                            className={`mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${crypto.color || 'from-primary to-secondary'} text-white shadow-sm`}
                          >
                            <span className="text-xs font-bold">
                              {crypto.symbol.substring(0, 3)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {crypto.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {crypto.symbol}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center text-sm font-medium text-primary dark:text-primary">
                            <Check className="mr-1 h-4 w-4" />
                            Added
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-12 text-center">
                    <div className="mb-3 inline-flex rounded-full bg-[#FAFBFC] p-3 shadow-sm dark:bg-gray-700 dark:shadow-none">
                      <AlertCircle className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      No cryptocurrencies found for this network
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCryptoModal(false)}
                  className="rounded-lg bg-[#FAFBFC] px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-[#FFFFFF] hover:shadow-sm dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:shadow-none"
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
