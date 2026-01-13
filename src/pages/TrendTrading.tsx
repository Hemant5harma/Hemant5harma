import React, { useState, useEffect, useMemo } from 'react';
import { showNotification } from '@mantine/notifications';
import {
  TrendingUp,
  AlertCircle,
  Check,
  Plus,
  Trash2,
  Play,
  Pause,
  Settings,
  DollarSign,
  Percent,
  Clock,
  BarChart3,
  Wallet,
  Info,
  X,
} from 'lucide-react';
import {
  GridBotConfig,
  GridPairConfig,
  GridTradeHistoryEntry,
  GridBotStats,
  GRID_PRESETS,
  PresetType,
  FeeMode,
  GridBotAlert,
} from '../types/gridBot';
import {
  calculateDropPercent,
  calculateSellTargetPrice,
  calculateBuyQuantity,
  validateGridPairConfig,
  formatPrice,
  formatPercentage,
  generateGridId,
  distributeInvestmentEqually,
} from '../utils/gridBotUtils';
import PrivateKeySelector from '../components/PrivateKeySelector';
import AddPrivateKeyModal from '../components/AddPrivateKeyModal';
import CustomDropdown from '../components/CustomDropdown';
import { apiClient } from '../utils/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

// Network Options (same as DCA)
const networkOptions = [
  {
    value: 1,
    label: 'Ethereum Mainnet',
    shortName: 'ETH',
  },
  {
    value: 137,
    label: 'Polygon',
    shortName: 'MATIC',
  },
  {
    value: 56,
    label: 'Binance Smart Chain',
    shortName: 'BSC',
  },
  {
    value: 10143,
    label: 'Monad Testnet',
    shortName: 'Monad',
  },
  {
    value: 900,
    label: 'Solana',
    shortName: 'SOL',
  },
];

// Available trading pairs by network
const tradingPairsByNetwork: Record<number, Array<{ pair: string; baseSymbol: string; quoteSymbol: string; baseAddress: string; quoteAddress: string }>> = {
  1: [
    { pair: 'WETH/USDT', baseSymbol: 'WETH', quoteSymbol: 'USDT', baseAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', quoteAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
    { pair: 'WBTC/USDT', baseSymbol: 'WBTC', quoteSymbol: 'USDT', baseAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', quoteAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
    { pair: 'WETH/USDC', baseSymbol: 'WETH', quoteSymbol: 'USDC', baseAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', quoteAddress: '0xA0b86a33E6441b4dc5029316a4B3D3536aDF38F5' },
  ],
  137: [
    { pair: 'WMATIC/USDT', baseSymbol: 'WMATIC', quoteSymbol: 'USDT', baseAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', quoteAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f' },
    { pair: 'WETH/USDC', baseSymbol: 'WETH', quoteSymbol: 'USDC', baseAddress: '0x7ceb23fd6f88b48c8f58f96b81b6c2f8f2f8f8f8', quoteAddress: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' },
  ],
  56: [
    { pair: 'WBNB/USDT', baseSymbol: 'WBNB', quoteSymbol: 'USDT', baseAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', quoteAddress: '0x55d398326f99059ff775485246999027b3197955' },
    { pair: 'BTCB/USDT', baseSymbol: 'BTCB', quoteSymbol: 'USDT', baseAddress: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', quoteAddress: '0x55d398326f99059ff775485246999027b3197955' },
  ],
  10143: [
    { pair: 'WSOL/USDT', baseSymbol: 'WSOL', quoteSymbol: 'USDT', baseAddress: '0x5387C85A4965769f6B0Df430638a1388493486F1', quoteAddress: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D' },
    { pair: 'WETH/USDT', baseSymbol: 'WETH', quoteSymbol: 'USDT', baseAddress: '0xB5a30b0FDc42e3E9760Cb8449Fb37', quoteAddress: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D' },
  ],
  900: [
    { pair: 'SOL/USDT', baseSymbol: 'SOL', quoteSymbol: 'USDT', baseAddress: 'So11111111111111111111111111111111111111112', quoteAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
    { pair: 'RAY/USDT', baseSymbol: 'RAY', quoteSymbol: 'USDT', baseAddress: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', quoteAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
  ],
};

export default function TrendTrading() {
  // Bot Configuration State
  const [botName, setBotName] = useState<string>('Grid Bot 1');
  const [chainId, setChainId] = useState<number>(10143);
  const [privateKeyId, setPrivateKeyId] = useState<number | null>(null);
  const [totalInvestAmount, setTotalInvestAmount] = useState<number>(10000);
  const [splitEqual, setSplitEqual] = useState<boolean>(true);
  const [reinvestRatePct, setReinvestRatePct] = useState<number>(0);
  const [profitsWalletId, setProfitsWalletId] = useState<number | null>(null);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  
  // Grid Pairs State
  const [gridPairs, setGridPairs] = useState<GridPairConfig[]>([]);
  const [showAddPairModal, setShowAddPairModal] = useState(false);
  
  // New Pair Form State
  const [newPairSymbol, setNewPairSymbol] = useState<string>('');
  const [newPairBuyThreshold, setNewPairBuyThreshold] = useState<number>(-4);
  const [newPairSellTarget, setNewPairSellTarget] = useState<number>(2);
  const [newPairBuyFee, setNewPairBuyFee] = useState<number>(0.1);
  const [newPairSellFee, setNewPairSellFee] = useState<number>(0.1);
  const [newPairPreset, setNewPairPreset] = useState<PresetType>('Neutral');
  const [newPairFeeMode, setNewPairFeeMode] = useState<FeeMode>('quote_fee');
  
  // Bot Running State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCreatingBot, setIsCreatingBot] = useState<boolean>(false);
  
  // Trade History & Stats
  const [tradeHistory, setTradeHistory] = useState<GridTradeHistoryEntry[]>([]);
  const [botStats, setBotStats] = useState<GridBotStats>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalGrossProfit: 0,
    totalNetProfit: 0,
    totalFeesPaid: 0,
    averageRoi: 0,
    averageHoldTime: 0,
    totalCapitalAtRisk: 0,
    totalReinvested: 0,
  });
  
  // Alerts
  const [alerts, setAlerts] = useState<GridBotAlert[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(true);
  
  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Active Step for wizard
  const [activeStep, setActiveStep] = useState<number>(0);

  // Auto-distribute investment when splitEqual is enabled
  useEffect(() => {
    if (splitEqual && gridPairs.length > 0) {
      const amountPerPair = distributeInvestmentEqually(totalInvestAmount, gridPairs.length);
      setGridPairs(prev => prev.map(pair => ({
        ...pair,
        investAmountUsdt: amountPerPair,
      })));
    }
  }, [totalInvestAmount, splitEqual, gridPairs.length]);

  // Handle adding a new grid pair
  const handleAddGridPair = () => {
    if (!newPairSymbol) {
      showNotification({
        title: 'Validation Error',
        message: 'Please select a trading pair',
        color: 'red',
      });
      return;
    }

    const selectedPair = tradingPairsByNetwork[chainId]?.find(p => p.pair === newPairSymbol);
    if (!selectedPair) {
      showNotification({
        title: 'Error',
        message: 'Invalid trading pair selected',
        color: 'red',
      });
      return;
    }

    // Check if pair already exists
    if (gridPairs.some(p => p.pair === selectedPair.pair)) {
      showNotification({
        title: 'Already Added',
        message: `${selectedPair.pair} is already in your grid pairs`,
        color: 'blue',
      });
      return;
    }

    // Check max pairs (1-5)
    if (gridPairs.length >= 5) {
      showNotification({
        title: 'Limit Reached',
        message: 'Maximum 5 grid pairs allowed',
        color: 'orange',
      });
      return;
    }

    const investAmount = splitEqual
      ? distributeInvestmentEqually(totalInvestAmount, gridPairs.length + 1)
      : totalInvestAmount / (gridPairs.length + 1);

    const newPair: GridPairConfig = {
      id: generateGridId(),
      pair: selectedPair.pair,
      baseSymbol: selectedPair.baseSymbol,
      quoteSymbol: selectedPair.quoteSymbol,
      baseTokenAddress: selectedPair.baseAddress,
      quoteTokenAddress: selectedPair.quoteAddress,
      walletId: privateKeyId,
      investAmountUsdt: investAmount,
      buyThresholdPct: newPairBuyThreshold,
      roiSellPct: newPairSellTarget,
      buyFeePct: newPairBuyFee,
      sellFeePct: newPairSellFee,
      feeMode: newPairFeeMode,
      preset: newPairPreset,
      isActive: true,
    };

    // Validate the new pair
    const errors = validateGridPairConfig(newPair);
    if (errors.length > 0) {
      errors.forEach(err => {
        showNotification({
          title: 'Validation Error',
          message: err,
          color: 'red',
        });
      });
      return;
    }

    setGridPairs(prev => [...prev, newPair]);
    
    // Re-distribute if splitEqual
    if (splitEqual) {
      const newAmount = distributeInvestmentEqually(totalInvestAmount, gridPairs.length + 1);
      setGridPairs(prev => prev.map(p => ({ ...p, investAmountUsdt: newAmount })));
    }

    setShowAddPairModal(false);
    resetNewPairForm();
    
    showNotification({
      title: 'Success',
      message: `Added ${selectedPair.pair} to grid bot`,
      color: 'green',
    });
  };

  const resetNewPairForm = () => {
    setNewPairSymbol('');
    setNewPairBuyThreshold(-4);
    setNewPairSellTarget(2);
    setNewPairBuyFee(0.1);
    setNewPairSellFee(0.1);
    setNewPairPreset('Neutral');
    setNewPairFeeMode('quote_fee');
  };

  const handleRemoveGridPair = (pairId: string) => {
    setGridPairs(prev => prev.filter(p => p.id !== pairId));
    
    // Re-distribute if splitEqual
    if (splitEqual && gridPairs.length > 1) {
      const newAmount = distributeInvestmentEqually(totalInvestAmount, gridPairs.length - 1);
      setGridPairs(prev => prev.map(p => ({ ...p, investAmountUsdt: newAmount })));
    }
    
    showNotification({
      title: 'Removed',
      message: 'Grid pair removed',
      color: 'blue',
    });
  };

  const handleUpdatePairAmount = (pairId: string, amount: number) => {
    setGridPairs(prev => prev.map(p =>
      p.id === pairId ? { ...p, investAmountUsdt: amount } : p
    ));
  };

  const handleApplyPreset = (pairId: string, preset: PresetType) => {
    setGridPairs(prev => prev.map(p =>
      p.id === pairId ? { ...p, preset } : p
    ));
    
    showNotification({
      title: 'Preset Applied',
      message: `Applied ${preset} preset`,
      color: 'green',
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!botName.trim()) {
      errors.push('Bot name is required');
    }

    if (gridPairs.length === 0) {
      errors.push('Please add at least one grid pair');
    }

    if (!chainId) {
      errors.push('Please select a blockchain network');
    }

    if (!privateKeyId) {
      errors.push('Please select a wallet for trading');
    }

    if (totalInvestAmount <= 0) {
      errors.push('Total investment must be greater than 0');
    }

    // Validate each pair
    gridPairs.forEach((pair, idx) => {
      const pairErrors = validateGridPairConfig(pair);
      if (pairErrors.length > 0) {
        errors.push(`Pair ${idx + 1} (${pair.pair}): ${pairErrors.join(', ')}`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Create bot
  const handleCreateBot = async () => {
    if (!validateForm()) {
      validationErrors.forEach(error => {
        showNotification({
          title: 'Validation Error',
          message: error,
          color: 'red',
        });
      });
      return;
    }

    setIsCreatingBot(true);

    const payload = {
      name: botName,
      chain_id: chainId,
      private_key_id: privateKeyId!,
      total_invest_amount: totalInvestAmount,
      split_equal: splitEqual,
      reinvest_rate_pct: reinvestRatePct,
      profits_wallet_id: profitsWalletId,
      pairs: gridPairs.map(p => ({
        pair: p.pair,
        base_token_address: p.baseTokenAddress,
        quote_token_address: p.quoteTokenAddress,
        invest_amount: p.investAmountUsdt,
        buy_threshold_pct: p.buyThresholdPct,
        roi_sell_pct: p.roiSellPct,
        buy_fee_pct: p.buyFeePct,
        sell_fee_pct: p.sellFeePct,
        fee_mode: p.feeMode,
        preset: p.preset,
      })),
    };

    try {
      await apiClient.post('/bots/grid/create', payload);
      
      showNotification({
        title: 'Success! 🎉',
        message: `Grid Bot "${botName}" created successfully`,
        color: 'green',
      });
      
      setIsRunning(true);
      setActiveStep(2); // Move to monitoring
      
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error.message || 'Failed to create bot',
        color: 'red',
      });
    } finally {
      setIsCreatingBot(false);
    }
  };

  // Quick wallet balance percentage buttons
  const handleQuickInvestAmount = (percentage: number) => {
    // This would need actual balance from PrivateKeySelector
    // For now, just demonstrate the UI
    const baseAmount = 10000; // Mock balance
    setTotalInvestAmount(baseAmount * (percentage / 100));
  };

  // Dismiss alert
  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, dismissed: true } : a
    ));
  };

  // Available trading pairs for selected network
  const availablePairs = tradingPairsByNetwork[chainId] || [];

  // Steps for wizard
  const steps = useMemo(() => [
    {
      label: 'Bot Configuration',
      state: activeStep === 0 ? 'current' : activeStep > 0 ? 'complete' : 'upcoming',
      icon: activeStep > 0 ? 'check' : 'settings',
    },
    {
      label: 'Grid Pairs Setup',
      state: activeStep === 1 ? 'current' : activeStep > 1 ? 'complete' : 'upcoming',
      icon: activeStep > 1 ? 'check' : 'grid',
    },
    {
      label: 'Monitor & Trade',
      state: activeStep === 2 ? 'current' : 'upcoming',
      icon: 'chart',
    },
  ], [activeStep]);

  const getStepClasses = (state: string) => {
    switch (state) {
      case 'complete':
        return 'bg-primary text-white border border-primary shadow-lg shadow-primary/30';
      case 'current':
        return 'bg-primary/15 text-primary border border-primary';
      default:
        return 'bg-border-light dark:bg-border-dark text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark';
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="min-h-screen text-text-light-primary dark:text-text-dark-primary p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold sm:text-4xl flex items-center justify-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Grid Trading Bot
            </h1>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Automated grid trading with 24h high drop triggers and ROI-based sell targets
            </p>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full ${getStepClasses(step.state)}`}
                  >
                    {step.icon === 'check' ? (
                      <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : step.icon === 'settings' ? (
                      <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : step.icon === 'grid' ? (
                      <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                    )}
                  </div>
                  <span className={`mt-1 text-xs sm:text-sm ${step.state === 'current' ? 'text-primary' : 'text-text-light-secondary dark:text-text-dark-secondary'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`mx-2 h-0.5 w-8 sm:w-16 ${step.state === 'complete' ? 'bg-primary' : 'bg-border-light dark:bg-border-dark'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              <ul className="list-disc space-y-1 pl-4">
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step 0: Bot Configuration */}
          {activeStep === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 rounded-lg bg-surface-light dark:bg-surface-dark p-4 shadow-md sm:p-6"
            >
              <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Bot Configuration
              </h2>

              {/* Bot Name */}
              <div>
                <label className="mb-2 block text-sm font-semibold">Bot Name</label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full rounded-lg border border-border-light bg-white p-3 text-sm dark:border-border-dark dark:bg-boxdark"
                  placeholder="My Grid Bot"
                />
              </div>

              {/* Network Selection */}
              <div>
                <label className="mb-2 block text-sm font-semibold">Blockchain Network</label>
                <CustomDropdown
                  options={networkOptions.map(n => ({ value: n.value, label: n.label }))}
                  value={chainId}
                  onChange={(val) => {
                    setChainId(Number(val));
                    setGridPairs([]); // Reset pairs on network change
                  }}
                  placeholder="Select network"
                />
              </div>

              {/* Wallet Selection */}
              <PrivateKeySelector
                chainId={chainId}
                selectedKeyId={privateKeyId}
                onKeySelect={setPrivateKeyId}
                onAddKey={() => setShowAddKeyModal(true)}
                label="Trading Wallet"
              />

              {/* Total Investment */}
              <div>
                <label className="mb-2 block text-sm font-semibold">Total Investment (USDT)</label>
                <input
                  type="number"
                  value={totalInvestAmount}
                  onChange={(e) => setTotalInvestAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-border-light bg-white p-3 text-sm dark:border-border-dark dark:bg-boxdark"
                  placeholder="10000"
                  min="0"
                  step="100"
                />
                <div className="mt-2 flex gap-2">
                  {[25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      onClick={() => handleQuickInvestAmount(pct)}
                      className="flex-1 rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Equal Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border-light bg-white p-3 dark:border-border-dark dark:bg-boxdark">
                <div>
                  <span className="text-sm font-semibold">Equal Distribution</span>
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    Split investment equally across all pairs
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={splitEqual}
                    onChange={(e) => setSplitEqual(e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>

              {/* Reinvest Rate */}
              <div>
                <label className="mb-2 block text-sm font-semibold">Reinvest Rate (%)</label>
                <CustomDropdown
                  options={[
                    { value: 0, label: '0% (All to Profit Wallet)' },
                    { value: 25, label: '25%' },
                    { value: 50, label: '50%' },
                    { value: 75, label: '75%' },
                    { value: 100, label: '100% (Full Reinvest)' },
                  ]}
                  value={reinvestRatePct}
                  onChange={(val) => setReinvestRatePct(Number(val))}
                  placeholder="Select reinvest rate"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveStep(1)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-3 font-semibold text-white hover:from-primary/90 hover:to-secondary/90"
                >
                  Next: Add Grid Pairs
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Grid Pairs Setup */}
          {activeStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Existing Pairs */}
              {gridPairs.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configured Grid Pairs ({gridPairs.length}/5)</h3>
                  {gridPairs.map((pair, idx) => (
                    <div
                      key={pair.id}
                      className="rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold">{pair.pair}</h4>
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                              {pair.preset}
                            </span>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-text-light-secondary dark:text-text-dark-secondary">Investment:</span>
                              <p className="font-semibold">${pair.investAmountUsdt.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-text-light-secondary dark:text-text-dark-secondary">Buy Trigger:</span>
                              <p className="font-semibold text-red-500">{pair.buyThresholdPct}%</p>
                            </div>
                            <div>
                              <span className="text-text-light-secondary dark:text-text-dark-secondary">Sell Target:</span>
                              <p className="font-semibold text-green-500">+{pair.roiSellPct}%</p>
                            </div>
                            <div>
                              <span className="text-text-light-secondary dark:text-text-dark-secondary">Fees:</span>
                              <p className="font-semibold">{pair.buyFeePct}% / {pair.sellFeePct}%</p>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveGridPair(pair.id)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Pair Button */}
              {gridPairs.length < 5 && !showAddPairModal && (
                <button
                  onClick={() => setShowAddPairModal(true)}
                  className="w-full rounded-lg border-2 border-dashed border-primary bg-primary/5 p-6 text-primary hover:bg-primary/10"
                >
                  <Plus className="mx-auto h-8 w-8 mb-2" />
                  <p className="font-semibold">Add Grid Pair ({gridPairs.length}/5)</p>
                </button>
              )}

              {/* Add Pair Modal */}
              {showAddPairModal && (
                <div className="rounded-lg border border-primary bg-surface-light p-6 dark:bg-surface-dark">
                  <h3 className="mb-4 text-lg font-semibold">Add New Grid Pair</h3>
                  
                  {/* Trading Pair */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-semibold">Trading Pair</label>
                    <CustomDropdown
                      options={availablePairs.map(p => ({ value: p.pair, label: p.pair }))}
                      value={newPairSymbol}
                      onChange={(val) => setNewPairSymbol(String(val))}
                      placeholder="Select pair"
                    />
                  </div>

                  {/* Preset */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-semibold">Preset Strategy</label>
                    <CustomDropdown
                      options={[
                        { value: 'Neutral', label: 'Neutral (Balanced)' },
                        { value: 'Bull', label: 'Bull (Aggressive Buy)' },
                        { value: 'Bear', label: 'Bear (Conservative)' },
                        { value: 'Custom', label: 'Custom' },
                      ]}
                      value={newPairPreset}
                      onChange={(val) => setNewPairPreset(val as PresetType)}
                      placeholder="Select preset"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Buy Threshold */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold">Buy Threshold (%)</label>
                      <input
                        type="number"
                        value={newPairBuyThreshold}
                        onChange={(e) => setNewPairBuyThreshold(Number(e.target.value))}
                        className="w-full rounded-lg border border-border-light bg-white p-2 text-sm dark:border-border-dark dark:bg-boxdark"
                        placeholder="-4"
                        step="0.1"
                      />
                      <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        Negative = price drop
                      </p>
                    </div>

                    {/* Sell Target */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold">ROI Target (%)</label>
                      <input
                        type="number"
                        value={newPairSellTarget}
                        onChange={(e) => setNewPairSellTarget(Number(e.target.value))}
                        className="w-full rounded-lg border border-border-light bg-white p-2 text-sm dark:border-border-dark dark:bg-boxdark"
                        placeholder="2"
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Buy Fee */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold">Buy Fee (%)</label>
                      <input
                        type="number"
                        value={newPairBuyFee}
                        onChange={(e) => setNewPairBuyFee(Number(e.target.value))}
                        className="w-full rounded-lg border border-border-light bg-white p-2 text-sm dark:border-border-dark dark:bg-boxdark"
                        placeholder="0.1"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    {/* Sell Fee */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold">Sell Fee (%)</label>
                      <input
                        type="number"
                        value={newPairSellFee}
                        onChange={(e) => setNewPairSellFee(Number(e.target.value))}
                        className="w-full rounded-lg border border-border-light bg-white p-2 text-sm dark:border-border-dark dark:bg-boxdark"
                        placeholder="0.1"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAddPairModal(false);
                        resetNewPairForm();
                      }}
                      className="flex-1 rounded-lg border border-border-light bg-white px-4 py-2 text-sm font-medium dark:border-border-dark dark:bg-boxdark"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddGridPair}
                      className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                    >
                      Add Pair
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveStep(0)}
                  className="flex-1 rounded-lg border border-border-light bg-white px-6 py-3 font-medium dark:border-border-dark dark:bg-boxdark"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateBot}
                  disabled={gridPairs.length === 0 || isCreatingBot}
                  className="flex-1 rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-3 font-semibold text-white hover:from-primary/90 hover:to-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingBot ? 'Creating Bot...' : 'Create & Start Bot'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Monitor & Trade */}
          {activeStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Bot Controls */}
              <div className="rounded-lg bg-surface-light p-6 dark:bg-surface-dark">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{botName}</h2>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {gridPairs.length} grid pair{gridPairs.length !== 1 ? 's' : ''} • ${totalInvestAmount.toFixed(2)} invested
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsRunning(!isRunning)}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold ${
                        isRunning
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause Bot
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Start Bot
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-surface-light p-4 dark:bg-surface-dark">
                  <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    <DollarSign className="h-4 w-4" />
                    Total Profit
                  </div>
                  <p className={`mt-1 text-2xl font-bold ${botStats.totalNetProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${botStats.totalNetProfit.toFixed(2)}
                  </p>
                </div>
                
                <div className="rounded-lg bg-surface-light p-4 dark:bg-surface-dark">
                  <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    <Percent className="h-4 w-4" />
                    Avg ROI
                  </div>
                  <p className={`mt-1 text-2xl font-bold ${botStats.averageRoi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {botStats.averageRoi >= 0 ? '+' : ''}{botStats.averageRoi.toFixed(2)}%
                  </p>
                </div>
                
                <div className="rounded-lg bg-surface-light p-4 dark:bg-surface-dark">
                  <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    <BarChart3 className="h-4 w-4" />
                    Win Rate
                  </div>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {botStats.winRate.toFixed(1)}%
                  </p>
                </div>
                
                <div className="rounded-lg bg-surface-light p-4 dark:bg-surface-dark">
                  <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    <Clock className="h-4 w-4" />
                    Total Trades
                  </div>
                  <p className="mt-1 text-2xl font-bold">
                    {botStats.totalTrades}
                  </p>
                </div>
              </div>

              {/* Trade History */}
              <div className="rounded-lg bg-surface-light p-6 dark:bg-surface-dark">
                <h3 className="mb-4 text-lg font-semibold">Trade History</h3>
                
                {tradeHistory.length === 0 ? (
                  <div className="py-12 text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-text-light-secondary dark:text-text-dark-secondary opacity-50" />
                    <p className="mt-4 text-text-light-secondary dark:text-text-dark-secondary">
                      No trades yet. Bot is monitoring for buy opportunities.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="border-b border-border-light dark:border-border-dark">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Pair</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Buy Price</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Sell Price</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Quantity</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Net Profit</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradeHistory.map((trade) => (
                          <tr key={trade.id} className="border-b border-border-light dark:border-border-dark">
                            <td className="px-4 py-3 text-sm font-medium">{trade.pair}</td>
                            <td className="px-4 py-3 text-sm">${trade.buyPrice.toFixed(4)}</td>
                            <td className="px-4 py-3 text-sm">${trade.sellPrice.toFixed(4)}</td>
                            <td className="px-4 py-3 text-sm">{trade.quantity.toFixed(6)}</td>
                            <td className={`px-4 py-3 text-sm font-semibold ${trade.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              ${trade.netProfit.toFixed(2)}
                            </td>
                            <td className={`px-4 py-3 text-sm font-semibold ${trade.netRoiPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {trade.netRoiPct >= 0 ? '+' : ''}{trade.netRoiPct.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Alerts */}
              {alertsEnabled && alerts.filter(a => !a.dismissed).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Alerts</h3>
                  {alerts.filter(a => !a.dismissed).map(alert => (
                    <div
                      key={alert.id}
                      className={`flex items-start justify-between rounded-lg p-4 ${
                        alert.type === 'error'
                          ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
                          : alert.type === 'warning'
                          ? 'bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                          : alert.type === 'success'
                          ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                          : 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold">{alert.title}</h4>
                          <p className="text-sm">{alert.message}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDismissAlert(alert.id)}
                        className="text-text-light-secondary hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Back to Edit */}
              <button
                onClick={() => setActiveStep(1)}
                className="w-full rounded-lg border border-border-light bg-white px-6 py-3 font-medium dark:border-border-dark dark:bg-boxdark"
              >
                Edit Grid Configuration
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Add Private Key Modal */}
      <AnimatePresence>
        {showAddKeyModal && (
          <AddPrivateKeyModal
            isOpen={showAddKeyModal}
            onClose={() => setShowAddKeyModal(false)}
            chainId={chainId}
            onKeyCreated={() => {
              setShowAddKeyModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
