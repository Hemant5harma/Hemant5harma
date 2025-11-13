import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { showNotification } from '@mantine/notifications';
import {
  AlertCircle,
  X,
  Check,
  Search,
} from 'lucide-react';
import ConditionBuilder from '../components/ConditionBuilder';
import PrivateKeySelector from '../components/PrivateKeySelector';
import AddPrivateKeyModal from '../components/AddPrivateKeyModal';
import { apiClient } from '../utils/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
    private_key_id: number | null;
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
    private_key_id: null,
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
  {
    value: 900,
    label: 'Solana',
    shortName: 'SOL',
    rpc_url: 'https://api.mainnet-beta.solana.com',
    network_name: 'Solana',
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
  // Solana Mainnet
  900: [
    {
      symbol: 'SOL',
      name: 'Solana',
      token_address: 'So11111111111111111111111111111111111111112',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      token_address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'RAY',
      name: 'Raydium',
      token_address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'SRM',
      name: 'Serum',
      token_address: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'ORCA',
      name: 'Orca',
      token_address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'MNGO',
      name: 'Mango',
      token_address: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
      color: 'from-primary to-secondary',
    },
    {
      symbol: 'STEP',
      name: 'Step Finance',
      token_address: 'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT',
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
  { value: '1 week', label: 'Weekly', icon: '📆' },
  { value: '1 month', label: 'Monthly', icon: '🗓️' },
  { value: '3 months', label: 'Every 3 Months', icon: '📊' },
  { value: '6 months', label: 'Every 6 Months', icon: '📈' },
  { value: '1 year', label: 'Yearly', icon: '🎯' },
];

const DCATrading: React.FC = () => {
  const [dca, setDca] = useState<DCAState>(initialState);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [isCreatingBot, setIsCreatingBot] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [keyRefreshCounter, setKeyRefreshCounter] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

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

    if (!dca.dcaSettings.private_key_id) {
      errors.push('Please select a wallet for trading');
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
      private_key_id: dca.dcaSettings.private_key_id,
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
        setActiveStep(0);
        setValidationErrors([]);
        setShowCryptoModal(false);
        setShowAddKeyModal(false);
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
    setValidationErrors([]);
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

  const configComplete = useMemo(
    () =>
      Boolean(
        dca.dcaSettings.botName.trim() &&
          dca.dcaSettings.frequency &&
          dca.dcaSettings.private_key_id,
      ),
    [dca.dcaSettings.botName, dca.dcaSettings.frequency, dca.dcaSettings.private_key_id],
  );

  const assetsComplete = useMemo(
    () => dca.dcaSettings.assets.length > 0,
    [dca.dcaSettings.assets.length],
  );

  type StepState = 'complete' | 'current' | 'upcoming';
  interface StepItem {
    label: string;
    state: StepState;
    icon: string;
  }

  const steps = useMemo<StepItem[]>(
    () => [
      {
        label: 'Bot Config',
        state: activeStep === 0 ? 'current' : 'complete',
        icon: activeStep === 0 ? 'edit' : 'check',
      },
      {
        label: 'Select Assets',
        state:
          activeStep > 1 && assetsComplete
            ? 'complete'
            : activeStep === 1
            ? 'current'
            : 'upcoming',
        icon: activeStep > 1 && assetsComplete ? 'check' : 'inventory_2',
      },
      {
        label: 'Review & Finish',
        state: activeStep === 2 ? 'current' : 'upcoming',
        icon: 'rocket_launch',
      },
    ],
    [activeStep, assetsComplete],
  );

  const getStepCircleClasses = (state: StepState) => {
    switch (state) {
      case 'complete':
        return 'bg-primary text-white border border-primary shadow-lg shadow-primary/30';
      case 'current':
        return 'bg-primary/15 text-primary border border-primary';
      default:
        return 'bg-border-light dark:bg-border-dark text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark';
    }
  };

  const getStepLabelClasses = (state: StepState) => {
    switch (state) {
      case 'complete':
        return 'text-text-light-primary dark:text-text-dark-primary';
      case 'current':
        return 'text-primary';
      default:
        return 'text-text-light-secondary dark:text-text-dark-secondary';
    }
  };

  const formatConditionLabel = (type?: string) => {
    if (!type) return 'Custom condition';

    const map: Record<string, string> = {
      price_drop: 'Price drop',
      price_rise: 'Price rise',
      moving_average: 'Moving average',
      rsi: 'RSI',
      volume_spike: 'Volume spike',
      trailing_buy: 'Trailing buy',
      trailing_sell: 'Trailing sell',
    };

    return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const renderValidationErrors = () =>
    validationErrors.length > 0 && (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
        <ul className="list-disc space-y-1 pl-4">
          {validationErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
            </div>
    );

  const validateConfigStep = () => {
    const errors: string[] = [];

    if (!dca.dcaSettings.botName.trim()) {
      errors.push('Please enter a bot name');
    }
    if (!dca.dcaSettings.frequency) {
      errors.push('Select a trading frequency');
    }
    if (!dca.dcaSettings.chain_id) {
      errors.push('Choose a blockchain network');
    }
    if (!dca.dcaSettings.private_key_id) {
      errors.push('Select a trading wallet');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const validateAssetsStep = () => {
    const errors: string[] = [];

    if (!assetsComplete) {
      errors.push('Add at least one asset to continue');
    }

    const zeroAmountAsset = dca.dcaSettings.assets.find((asset) => asset.amount <= 0);
    if (zeroAmountAsset) {
      errors.push(`Enter an investment amount for ${zeroAmountAsset.name}`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNextStep = () => {
    if (activeStep === 0) {
      if (!validateConfigStep()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setValidationErrors([]);
      setActiveStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (activeStep === 1) {
      if (!validateAssetsStep()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setValidationErrors([]);
      setActiveStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousStep = () => {
    if (activeStep === 0) {
      return;
    }

    setValidationErrors([]);
    setActiveStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-6">
          <motion.div
              key="step-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
              className="overflow-hidden rounded-3xl border border-border-light bg-card-light shadow-soft dark:border-border-dark dark:bg-card-dark"
            >
              <div className="bg-gradient-to-r from-primary to-secondary px-6 py-7 sm:px-8">
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">Step 1 · Bot Essentials</h2>
                <p className="mt-2 text-sm text-white/80">Name your bot and choose where it will execute trades.</p>
                </div>
              <div className="space-y-6 border-t border-border-light bg-surface-light p-6 sm:p-8 dark:border-border-dark dark:bg-surface-dark">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">Bot Name</label>
                    <input
                      type="text"
                      value={dca.dcaSettings.botName}
                      onChange={(e) => handleUpdateDCASettings('botName', e.target.value)}
                      className="rounded-xl border border-border-light bg-card-light px-4 py-3 text-text-light-primary transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
                      placeholder="e.g. My ETH Accumulator"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">Trading Frequency</label>
                    <div className="relative">
                      <select
                        value={dca.dcaSettings.frequency}
                        onChange={(e) => handleUpdateDCASettings('frequency', e.target.value)}
                        className="w-full appearance-none rounded-xl border border-border-light bg-card-light px-4 py-3 pr-12 text-text-light-primary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
                      >
                        <option value="" disabled>
                          Select how often to invest
                        </option>
                        {frequencyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-base text-text-light-secondary dark:text-text-dark-secondary">
                        expand_more
                      </span>
                      </div>
                    </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">Blockchain Network</label>
                    <div className="relative">
                      <select
                        value={dca.dcaSettings.chain_id}
                        onChange={(e) => handleUpdateDCASettings('chain_id', Number(e.target.value))}
                        className="w-full appearance-none rounded-xl border border-border-light bg-card-light px-4 py-3 pr-12 text-text-light-primary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
                      >
                        <option value="" disabled>
                          Select network
                        </option>
                        {networkOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-base text-text-light-secondary dark:text-text-dark-secondary">
                        expand_more
                        </span>
                      </div>
                    {selectedNetwork && (
                      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        Connected to <span className="font-medium text-text-light-primary dark:text-text-dark-primary">{selectedNetwork.shortName}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">Trading Wallet</label>
                    <PrivateKeySelector
                      key={`${dca.dcaSettings.chain_id}-${keyRefreshCounter}`}
                      chainId={dca.dcaSettings.chain_id}
                      selectedKeyId={dca.dcaSettings.private_key_id}
                      onKeySelect={(keyId) => handleUpdateDCASettings('private_key_id', keyId || 0)}
                      onAddKey={() => setShowAddKeyModal(true)}
                      label=""
                    />
                </div>
                  </div>
                    </div>
                </motion.div>
            {renderValidationErrors()}
              </div>
        );
      case 1:
        return (
          <div className="space-y-6">
          <motion.div
              key="step-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="overflow-hidden rounded-3xl border border-border-light bg-card-light shadow-soft dark:border-border-dark dark:bg-card-dark"
          >
              <div className="bg-gradient-to-r from-primary to-secondary px-6 py-7 sm:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-white sm:text-3xl">Step 2 · Select Assets</h2>
                    <p className="text-sm text-white/80">Add the tokens you want this bot to accumulate automatically.</p>
                </div>
                <button
                  onClick={() => setShowCryptoModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
                >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Add Asset
                </button>
              </div>
              </div>
              <div className="space-y-6 border-t border-border-light bg-surface-light p-6 sm:p-8 dark:border-border-dark dark:bg-surface-dark">
              {dca.dcaSettings.assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-light bg-card-light py-16 text-center dark:border-border-dark dark:bg-card-dark">
                    <div className="mb-4 inline-flex rounded-full bg-primary/10 p-4 dark:bg-primary/20">
                    <AlertCircle className="h-8 w-8 text-primary dark:text-primary" />
                  </div>
                    <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                      No assets selected yet
                  </h3>
                    <p className="mt-2 max-w-sm text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      Choose at least one asset to automate your cost averaging strategy.
                  </p>
                  <button
                    onClick={() => setShowCryptoModal(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-primary/90 hover:to-secondary/90"
                  >
                      <span className="material-symbols-outlined text-base">add</span>
                      Select Assets
                  </button>
                  </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                  <AnimatePresence>
                    {dca.dcaSettings.assets.map((asset, index) => {
                        const cryptoData = cryptocurrenciesByNetwork[dca.dcaSettings.chain_id]?.find((crypto) => crypto.symbol === asset.symbol);

                      return (
                        <motion.div
                          key={asset.symbol}
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="group space-y-6 rounded-2xl border border-border-light bg-card-light p-6 shadow transition hover:shadow-lg dark:border-border-dark dark:bg-card-dark"
                        >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cryptoData?.color || 'from-primary to-secondary'} text-white shadow`}>
                                  <span className="text-sm font-bold">{asset.symbol.substring(0, 3)}</span>
                              </div>
                              <div>
                                  <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                                  {asset.name}
                                </h3>
                                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                                  {asset.symbol}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveCrypto(asset.symbol)}
                                className="rounded-full bg-red-50 p-2 text-red-500 opacity-0 transition group-hover:opacity-100 dark:bg-red-900/30 dark:text-red-300"
                              aria-label={`Remove ${asset.name}`}
                            >
                                <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
                              Investment Amount (USDT)
                            </label>
                            <input
                              type="number"
                              value={asset.amount}
                                onChange={(e) => handleAmountChange(asset.symbol, Number(e.target.value))}
                                className="w-full rounded-lg border border-border-light bg-card-light px-4 py-3 text-text-light-primary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
                              min="0"
                              step="0.0001"
                              placeholder="0.00"
                            />
                          </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
                              Trading Condition
                            </label>
                            <ConditionBuilder
                              value={{
                                condition_type: asset.condition_type || 'price_drop',
                                condition_params: asset.condition_params || {
                                  threshold: asset.threshold,
                                },
                              }}
                                onChange={(conditionData) => handleConditionChange(asset.symbol, conditionData)}
                                className="rounded-lg border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark"
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
            {renderValidationErrors()}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
          <motion.div
              key="step-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
          >
              <div className="rounded-3xl border border-border-light bg-card-light p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
                <h2 className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                  Step 3 · Review &amp; Launch
                </h2>
                <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Confirm the configuration before creating your DCA bot.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-3xl border border-border-light bg-card-light p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
                  <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                    Bot Overview
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-text-light-secondary dark:text-text-dark-secondary">Name</dt>
                      <dd className="font-medium text-text-light-primary dark:text-text-dark-primary">
                        {dca.dcaSettings.botName || '-'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-text-light-secondary dark:text-text-dark-secondary">Frequency</dt>
                      <dd className="font-medium text-text-light-primary dark:text-text-dark-primary">
                        {dca.dcaSettings.frequency || '-'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-text-light-secondary dark:text-text-dark-secondary">Network</dt>
                      <dd className="font-medium text-text-light-primary dark:text-text-dark-primary">
                        {selectedNetwork?.label || 'Not selected'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-text-light-secondary dark:text-text-dark-secondary">Trading Wallet</dt>
                      <dd className="font-medium text-text-light-primary dark:text-text-dark-primary">
                        {dca.dcaSettings.private_key_id ? `Private Key #${dca.dcaSettings.private_key_id}` : 'Not selected'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-4 rounded-3xl border border-border-light bg-card-light p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
                  <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                    Execution Summary
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border-light bg-background-light p-4 text-center dark:border-border-dark dark:bg-background-dark">
                      <p className="text-xs uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                        Total per execution
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                        $
                        {totalValue < 0.01 && totalValue > 0
                          ? totalValue.toFixed(6)
                          : totalValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 6,
                            })}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border-light bg-background-light p-4 text-center dark:border-border-dark dark:bg-background-dark">
                      <p className="text-xs uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                        Assets configured
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                        {dca.dcaSettings.assets.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 rounded-3xl border border-border-light bg-card-light p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
                  <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                    Asset Breakdown
                  </h3>
                  {assetsComplete ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-border-light dark:border-border-dark">
                      <table className="min-w-full divide-y divide-border-light text-sm dark:divide-border-dark">
                        <thead className="bg-background-light text-text-light-secondary dark:bg-background-dark dark:text-text-dark-secondary">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold">Asset</th>
                            <th className="px-4 py-2 text-left font-semibold">Amount (USDT)</th>
                            <th className="px-4 py-2 text-left font-semibold">Condition</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                          {dca.dcaSettings.assets.map((asset) => {
                            const conditionLabel = formatConditionLabel(asset.condition_type);
                            const threshold = asset.condition_params?.threshold ?? asset.threshold;
                            return (
                              <tr key={asset.symbol} className="bg-card-light dark:bg-card-dark">
                                <td className="px-4 py-3 text-text-light-primary dark:text-text-dark-primary">
                                  <span className="font-medium">{asset.name}</span>
                                  <span className="ml-2 text-xs uppercase text-text-light-secondary dark:text-text-dark-secondary">
                                    {asset.symbol}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-text-light-primary dark:text-text-dark-primary">
                                  ${asset.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                </td>
                                <td className="px-4 py-3 text-text-light-secondary dark:text-text-dark-secondary">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                                      {conditionLabel}
                                    </span>
                                    {threshold !== undefined && (
                                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                                        Threshold: {threshold}
                                      </span>
                  )}
                </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      No assets configured.
                  </p>
                )}
              </div>
              </div>
          </motion.div>
            {renderValidationErrors()}
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    const primaryLabel =
      activeStep === 2
        ? isCreatingBot
          ? 'Creating...'
          : 'Create Bot'
        : activeStep === 1
        ? 'Review Summary'
        : 'Continue';

    const primaryDisabled =
      activeStep === 2
        ? isCreatingBot
        : activeStep === 1
        ? !assetsComplete
        : !configComplete;

    const handlePrimaryClick = () => {
      if (activeStep === 2) {
        handleSubmitDCA();
      } else {
        handleNextStep();
      }
    };

    const secondaryLabel = activeStep === 0 ? 'Cancel' : 'Previous Step';
    const onSecondaryClick =
      activeStep === 0 ? () => navigate('/bots/manage') : handlePreviousStep;

    const stepMessage =
      activeStep === 0
        ? 'Provide the basics for your bot.'
        : activeStep === 1
        ? 'Select and configure the assets to automate.'
        : 'Review everything before launching.';

    return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-col gap-4 rounded-2xl border border-border-light bg-card-light p-4 shadow-md dark:border-border-dark dark:bg-card-dark sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Step {activeStep + 1} of 3 · {stepMessage}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={onSecondaryClick}
            className="flex items-center justify-center gap-2 rounded-xl border border-border-light bg-card-light px-4 py-2 text-sm font-semibold text-text-light-secondary transition-colors hover:bg-border-light/60 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-secondary dark:hover:bg-border-dark/60"
          >
            <span className="material-symbols-outlined text-base">
              {activeStep === 0 ? 'close' : 'arrow_back'}
            </span>
            {secondaryLabel}
          </button>
          <button
            onClick={handlePrimaryClick}
            disabled={primaryDisabled}
            className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 ${
              primaryDisabled ? 'cursor-not-allowed opacity-60' : 'hover:scale-[1.02] hover:shadow-xl'
            }`}
          >
            {activeStep === 2 && isCreatingBot ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span className="material-symbols-outlined text-base">
                {activeStep === 2 ? 'rocket_launch' : 'arrow_forward'}
              </span>
            )}
            {primaryLabel}
          </button>
        </div>
          </motion.div>
    );
  };

  return (
    <div className="w-full bg-background-light py-12 font-display dark:bg-background-dark">
      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-24 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-text-light-primary dark:text-text-dark-primary">
            Create New DCA Bot
          </p>
          <p className="text-base font-normal leading-normal text-text-light-secondary dark:text-text-dark-secondary">
            Configure your Dollar-Cost Averaging bot step-by-step.
          </p>
        </div>

        <div className="relative mx-auto flex max-w-3xl justify-between">
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-border-light dark:bg-border-dark" />
          <div className="relative flex w-full justify-between">
            {steps.map((step) => (
              <div key={step.label} className="flex w-28 flex-col items-center text-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-base transition-colors ${getStepCircleClasses(step.state)}`}
                >
                  <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
                </div>
                <span
                  className={`mt-2 text-sm font-semibold transition-colors ${getStepLabelClasses(step.state)}`}
                >
                  {step.label}
                </span>
              </div>
            ))}
        </div>
      </div>

        {renderStepContent()}

        {renderActionButtons()}
      </div>

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
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                    Select Cryptocurrency
                  </h2>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Choose from {selectedNetwork?.label || 'available'} assets
                  </p>
                </div>
                <button
                  onClick={() => setShowCryptoModal(false)}
                  className="rounded-full p-2 text-text-light-secondary transition-colors hover:bg-border-light hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-border-dark"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary" />
                  <input
                    type="text"
                    placeholder="Search cryptocurrencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-border-light bg-card-light py-3 pl-10 pr-4 text-text-light-primary transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
                  />
                </div>
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto">
                {filteredCryptocurrencies.length > 0 ? (
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
                            : 'bg-card-light hover:bg-background-light hover:shadow-sm dark:bg-card-dark dark:hover:bg-background-dark'
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
                            <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                              {crypto.name}
                            </p>
                            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
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
                    <div className="mb-3 inline-flex rounded-full bg-card-light p-3 shadow-sm dark:bg-card-dark">
                      <AlertCircle className="h-6 w-6 text-text-light-secondary dark:text-text-dark-secondary" />
                    </div>
                    <p className="text-text-light-secondary dark:text-text-dark-secondary">
                      No cryptocurrencies found for this network
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCryptoModal(false)}
                  className="rounded-lg bg-card-light px-4 py-2 text-sm font-medium text-text-light-secondary transition-colors hover:bg-border-light dark:bg-card-dark dark:text-text-dark-secondary dark:hover:bg-border-dark"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddPrivateKeyModal
        isOpen={showAddKeyModal}
        onClose={() => setShowAddKeyModal(false)}
        chainId={dca.dcaSettings.chain_id}
        onKeyCreated={() => {
            setKeyRefreshCounter((prev) => prev + 1);
          setShowAddKeyModal(false);
        }}
      />
    </div>
  );
};

export default DCATrading;
