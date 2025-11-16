'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { showNotification } from '@mantine/notifications';
import {
  TrendingUp,
  Activity,
  Calendar,
  Pause,
  Play,
  Trash2,
  ArrowLeft,
  AlertCircle,
  BarChart3,
  Coins,
  DollarSign,
  Percent,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import {
  apiClient,
  pauseBot,
  resumeBot,
  deleteBot,
  fetchBotTradeHistory,
} from '../utils/apiClient';

// Token address to name mapping
const tokenAddressToName: Record<string, { symbol: string; name: string }> = {
  // Ethereum Mainnet
  '0xA0b86a33E6441b4dc5029316a4B3D3536aDF38F5': { symbol: 'USDC', name: 'USD Coin' },
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', name: 'Tether' },
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': { symbol: 'WBTC', name: 'Wrapped Bitcoin' },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: 'WETH', name: 'Wrapped Ethereum' },

  // Polygon
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { symbol: 'USDC', name: 'USD Coin' },
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: 'USDT', name: 'Tether' },
  '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': { symbol: 'WBTC', name: 'Wrapped Bitcoin' },
  '0x7ceb23fd6f88b48c8f58f96b81b6c2f8f2f8f8f8': { symbol: 'WETH', name: 'Wrapped Ethereum' },

  // BSC
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { symbol: 'USDC', name: 'USD Coin' },
  '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', name: 'Tether' },
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c': { symbol: 'BTCB', name: 'Bitcoin BEP20' },
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': { symbol: 'WBNB', name: 'Wrapped BNB' },

  // Monad Testnet
  '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea': { symbol: 'USDC', name: 'USD Coin' },
  '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D': { symbol: 'USDT', name: 'Tether' },
  '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d': { symbol: 'WBTC', name: 'Wrapped Bitcoin' },
  '0xB5a30b0FDc42e3E9760Cb8449Fb37': { symbol: 'WETH', name: 'Wrapped Ethereum' },
  '0x5387C85A4965769f6B0Df430638a1388493486F1': { symbol: 'WSOL', name: 'Wrapped SOL' },

  // Solana Mainnet
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana' },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether' },
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': { symbol: 'RAY', name: 'Raydium' },
  'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt': { symbol: 'SRM', name: 'Serum' },
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': { symbol: 'ORCA', name: 'Orca' },
  'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac': { symbol: 'MNGO', name: 'Mango' },
  'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT': { symbol: 'STEP', name: 'Step Finance' },
};

// Helper function to get token info from address
const getTokenInfo = (tokenAddress: string) => {
  const tokenInfo = tokenAddressToName[tokenAddress];
  return (
    tokenInfo || {
      symbol: tokenAddress.substring(0, 6),
      name: `Token ${tokenAddress.substring(0, 6)}`,
    }
  );
};

// Helper function to format numbers with proper decimals
const formatAmount = (amount: number | string, decimals: number = 6) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  
  // For very small numbers, use more decimals
  if (num < 0.01) {
    return num.toFixed(8);
  }
  // For normal numbers, use specified decimals
  return num.toFixed(decimals);
};

// Helper function to format currency values with smart decimal handling
const formatCurrency = (amount: number | string, currency: string = 'USD') => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return '$0.00';
  
  // For very small values, show more decimal places
  if (Math.abs(num) < 0.01) {
    return `$${num.toFixed(8)}`;
  }
  // For small values, show 4 decimal places
  else if (Math.abs(num) < 1) {
    return `$${num.toFixed(4)}`;
  }
  // For normal values, use standard currency formatting
  else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }
};

// Helper function to calculate total value with debugging
const calculateTotalValue = (amount: number | string, price: number | string) => {
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(amountNum) || isNaN(priceNum)) return 0;
  
  const totalValue = amountNum * priceNum;
  
  // Debug logging to help identify issues
  console.log(`Trade calculation: ${amountNum} × ${priceNum} = ${totalValue}`);
  
  return totalValue;
};

export default function BotDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [tradeHistoryLoading, setTradeHistoryLoading] = useState(false);

  // Action loading states
  const [pauseLoading, setPauseLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Modal states
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Add a function to load trade history
  const loadTradeHistory = useCallback(async () => {
    if (!id) return;

    setTradeHistoryLoading(true);
    try {
      const trades = await fetchBotTradeHistory(Number.parseInt(id));
      setTradeHistory(trades);
    } catch (error) {
      console.error('Error loading trade history:', error);
    } finally {
      setTradeHistoryLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);

    const fetchBotData = async () => {
      try {
        const data = await apiClient.get(`/bots/${id}`);
        setBot(data);
        await loadTradeHistory();
      } catch (error) {
        console.error('Error fetching bot:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBotData();
  }, [id, loadTradeHistory]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg text-text-light-secondary dark:text-text-dark-secondary">
            Loading bot details...
          </p>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light px-4 dark:bg-background-dark">
        <div className="w-full max-w-md rounded-2xl border border-border-light bg-card-light p-8 text-center shadow-lg dark:border-border-dark dark:bg-card-dark">
          <div className="mb-4 inline-flex rounded-full bg-red-50 p-4 dark:bg-red-900/20">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Bot Not Found
          </h2>
          <p className="mb-6 text-text-light-secondary dark:text-text-dark-secondary">
            The bot you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/bots/manage')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5" />
            Return to Bots
          </button>
        </div>
      </div>
    );
  }

  const { name, frequency, status, next_execution_time, coins } = bot;

  // Safely access performance data with fallback to empty object
  const performance = bot.performance || {
    total_trades: 0,
    total_volume: 0,
    apy: 0,
    three_month_perf: 0,
    six_month_perf: 0,
    total_perf: 0,
  };

  // Handle pause action with confirmation
  const handlePause = async () => {
    setPauseLoading(true);
    try {
      await pauseBot(bot.id);
      const updatedBot = await apiClient.get(`/bots/${bot.id}`);
      setBot(updatedBot);
      showNotification({
        title: 'Bot Paused',
        message: 'Bot has been paused successfully',
        color: 'yellow',
      });
    } catch (error) {
      console.error('Error pausing bot:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to pause bot',
        color: 'red',
      });
    } finally {
      setPauseLoading(false);
      setPauseModalOpen(false);
    }
  };

  // Handle resume action
  const handleResume = async () => {
    setResumeLoading(true);
    try {
      await resumeBot(bot.id);
      const updatedBot = await apiClient.get(`/bots/${bot.id}`);
      setBot(updatedBot);
      showNotification({
        title: 'Bot Resumed',
        message: 'Bot is now running',
        color: 'green',
      });
    } catch (error) {
      console.error('Error resuming bot:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to resume bot',
        color: 'red',
      });
    } finally {
      setResumeLoading(false);
    }
  };

  // Handle exit (delete) action with confirmation
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteBot(bot.id);
      showNotification({
        title: 'Bot Deleted',
        message: 'Bot has been deleted successfully',
        color: 'blue',
      });
      navigate('/bots/manage');
    } catch (error) {
      console.error('Error deleting bot:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to delete bot',
        color: 'red',
      });
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  };


  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background-light py-4 sm:py-6 lg:py-8 dark:bg-background-dark">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => navigate('/bots/manage')}
            className="mb-3 sm:mb-4 inline-flex items-center gap-1.5 sm:gap-2 text-text-light-secondary transition-colors hover:text-primary dark:text-text-dark-secondary dark:hover:text-primary min-h-[44px] touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base font-medium">Back to Bots</span>
          </button>
        </motion.div>

        {/* Pause Confirmation Modal */}
        <AnimatePresence>
          {pauseModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm"
              onClick={() => setPauseModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md rounded-xl sm:rounded-2xl border border-border-light bg-card-light p-4 sm:p-6 shadow-2xl dark:border-border-dark dark:bg-card-dark"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  Confirm Pause
                </h3>
                <p className="mb-4 sm:mb-6 text-sm sm:text-base text-text-light-secondary dark:text-text-dark-secondary">
                  Are you sure you want to pause this bot? It will stop executing trades until resumed.
                </p>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => setPauseModalOpen(false)}
                    className="rounded-lg border border-border-light bg-card-light px-4 py-2.5 sm:py-2 text-sm sm:text-base font-medium text-text-light-secondary transition-colors hover:bg-border-light dark:border-border-dark dark:bg-card-dark dark:text-text-dark-secondary dark:hover:bg-border-dark min-h-[44px] touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePause}
                    disabled={pauseLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-2.5 sm:py-2 text-sm sm:text-base font-medium text-white transition-colors hover:bg-yellow-600 disabled:opacity-50 min-h-[44px] touch-manipulation"
                  >
                    {pauseLoading && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    )}
                    Pause Bot
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md rounded-xl sm:rounded-2xl border border-border-light bg-card-light p-4 sm:p-6 shadow-2xl dark:border-border-dark dark:bg-card-dark"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                  Confirm Deletion
                </h3>
                <p className="mb-4 sm:mb-6 text-sm sm:text-base text-text-light-secondary dark:text-text-dark-secondary">
                  Are you sure you want to delete this bot? This action cannot be undone.
                </p>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="rounded-lg border border-border-light bg-card-light px-4 py-2.5 sm:py-2 text-sm sm:text-base font-medium text-text-light-secondary transition-colors hover:bg-border-light dark:border-border-dark dark:bg-card-dark dark:text-text-dark-secondary dark:hover:bg-border-dark min-h-[44px] touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 sm:py-2 text-sm sm:text-base font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 min-h-[44px] touch-manipulation"
                  >
                    {deleteLoading && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    )}
                    Delete Bot
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
            {/* Bot Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border-light bg-card-light shadow-soft dark:border-border-dark dark:bg-card-dark"
            >
              <div className="bg-gradient-to-r from-primary to-secondary px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
                <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words">{name}</h1>
                    <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-semibold ${
                          status.toLowerCase() === 'running'
                            ? 'bg-green-500 text-white'
                            : status.toLowerCase() === 'paused'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {status.toLowerCase() === 'running' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        ) : status.toLowerCase() === 'paused' ? (
                          <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                        <span className="whitespace-nowrap">{status.toUpperCase()}</span>
                      </span>
                      <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/90">
                        <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="whitespace-nowrap">{frequency}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {status === 'running' && (
                      <button
                        onClick={() => setPauseModalOpen(true)}
                        disabled={pauseLoading}
                        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-white/20 px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30 disabled:opacity-50 min-h-[44px] touch-manipulation"
                      >
                        {pauseLoading ? (
                          <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                        <span>Pause</span>
                      </button>
                    )}
                    
                    {status === 'paused' && (
                      <button
                        onClick={handleResume}
                        disabled={resumeLoading}
                        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-white/20 px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30 disabled:opacity-50 min-h-[44px] touch-manipulation"
                      >
                        {resumeLoading ? (
                          <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                        <span>Resume</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => setDeleteModalOpen(true)}
                      disabled={deleteLoading}
                      className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border-2 border-white/30 bg-transparent px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 disabled:opacity-50 min-h-[44px] touch-manipulation"
                    >
                      {deleteLoading ? (
                        <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Next Execution Info */}
              <div className="border-t border-border-light bg-surface-light p-3 sm:p-4 lg:p-6 dark:border-border-dark dark:bg-surface-dark">
                <div className="flex items-center gap-2 sm:gap-3 text-text-light-secondary dark:text-text-dark-secondary">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide">Next Execution</p>
                    <p className="mt-0.5 text-xs sm:text-sm font-semibold text-text-light-primary dark:text-text-dark-primary break-words">
                      {formatDate(next_execution_time)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl sm:rounded-3xl border border-border-light bg-card-light p-4 shadow-soft dark:border-border-dark dark:bg-card-dark sm:p-6 lg:p-8"
            >
              <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                Performance Metrics
              </h2>

              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                {/* 3M Performance */}
                <div className="flex flex-col items-center rounded-xl sm:rounded-2xl border border-border-light bg-background-light p-3 sm:p-4 lg:p-6 transition-all hover:shadow-md dark:border-border-dark dark:bg-background-dark">
                  <div className="mb-2 sm:mb-3 rounded-full bg-primary/10 p-2 sm:p-3 dark:bg-primary/20">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary text-center">
                    3M Performance
                  </p>
                  <p
                    className={`mt-1 sm:mt-2 text-lg sm:text-xl lg:text-2xl font-bold ${
                      performance.three_month_perf >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {performance.three_month_perf >= 0 ? '+' : ''}
                    {performance.three_month_perf.toFixed(2)}%
                  </p>
                </div>

                {/* 6M Performance */}
                <div className="flex flex-col items-center rounded-xl sm:rounded-2xl border border-border-light bg-background-light p-3 sm:p-4 lg:p-6 transition-all hover:shadow-md dark:border-border-dark dark:bg-background-dark">
                  <div className="mb-2 sm:mb-3 rounded-full bg-primary/10 p-2 sm:p-3 dark:bg-primary/20">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary text-center">
                    6M Performance
                  </p>
                  <p
                    className={`mt-1 sm:mt-2 text-lg sm:text-xl lg:text-2xl font-bold ${
                      performance.six_month_perf >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {performance.six_month_perf >= 0 ? '+' : ''}
                    {performance.six_month_perf.toFixed(2)}%
                  </p>
                </div>

                {/* Total Performance */}
                <div className="flex flex-col items-center rounded-xl sm:rounded-2xl border border-border-light bg-background-light p-3 sm:p-4 lg:p-6 transition-all hover:shadow-md dark:border-border-dark dark:bg-background-dark">
                  <div className="mb-2 sm:mb-3 rounded-full bg-green-500/10 p-2 sm:p-3 dark:bg-green-500/20">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary text-center">
                    Total Performance
                  </p>
                  <p
                    className={`mt-1 sm:mt-2 text-lg sm:text-xl lg:text-2xl font-bold ${
                      performance.total_perf >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {performance.total_perf >= 0 ? '+' : ''}
                    {performance.total_perf.toFixed(2)}%
                  </p>
                </div>

                {/* Total Trades */}
                <div className="flex flex-col items-center rounded-xl sm:rounded-2xl border border-border-light bg-background-light p-3 sm:p-4 lg:p-6 transition-all hover:shadow-md dark:border-border-dark dark:bg-background-dark">
                  <div className="mb-2 sm:mb-3 rounded-full bg-purple-500/10 p-2 sm:p-3 dark:bg-purple-500/20">
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary text-center">
                    Total Trades
                  </p>
                  <p className="mt-1 sm:mt-2 text-lg sm:text-xl lg:text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                    {performance.total_trades}
                  </p>
                </div>

                {/* Total Volume */}
                <div className="flex flex-col items-center rounded-xl sm:rounded-2xl border border-border-light bg-background-light p-3 sm:p-4 lg:p-6 transition-all hover:shadow-md dark:border-border-dark dark:bg-background-dark">
                  <div className="mb-2 sm:mb-3 rounded-full bg-blue-500/10 p-2 sm:p-3 dark:bg-blue-500/20">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary text-center">
                    Total Volume
                  </p>
                  <p className="mt-1 sm:mt-2 text-base sm:text-lg lg:text-2xl font-bold text-text-light-primary dark:text-text-dark-primary break-words">
                    ${performance.total_volume.toFixed(2)}
                  </p>
                </div>

                {/* APY */}
                <div className="flex flex-col items-center rounded-xl sm:rounded-2xl border border-border-light bg-background-light p-3 sm:p-4 lg:p-6 transition-all hover:shadow-md dark:border-border-dark dark:bg-background-dark">
                  <div className="mb-2 sm:mb-3 rounded-full bg-amber-500/10 p-2 sm:p-3 dark:bg-amber-500/20">
                    <Percent className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary text-center">
                    APY
                  </p>
                  <p className="mt-1 sm:mt-2 text-lg sm:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">
                    {performance.apy.toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Trade History Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-2xl sm:rounded-3xl border border-border-light bg-card-light p-4 shadow-soft dark:border-border-dark dark:bg-card-dark sm:p-6 lg:p-8"
            >
              <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                Trade History
              </h2>

              {tradeHistoryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="ml-3 text-text-light-secondary dark:text-text-dark-secondary">
                    Loading trade history...
                  </p>
                </div>
              ) : tradeHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-light bg-background-light py-12 dark:border-border-dark dark:bg-background-dark">
                  <div className="mb-4 rounded-full bg-primary/10 p-4 dark:bg-primary/20">
                    <Activity className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary">
                    No trade history available for this bot
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop view */}
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full min-w-[600px]">
                      <thead className="border-b-2 border-border-light bg-background-light dark:border-border-dark dark:bg-background-dark">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                            Date
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                            Token
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                            Amount (USDT)
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                            Price
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                            Fee
                          </th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                            Total Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light dark:divide-border-dark">
                        {tradeHistory.map((trade, index) => (
                          <tr
                            key={trade.id}
                            className="transition-colors hover:bg-background-light dark:hover:bg-background-dark"
                          >
                            <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-text-light-primary dark:text-text-dark-primary whitespace-nowrap">
                              {new Date(trade.trade_time).toLocaleString()}
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4">
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-primary dark:bg-primary/20">
                                {getTokenInfo(trade.token_address).name}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-text-light-primary dark:text-text-dark-primary">
                              {formatAmount(trade.amount)}
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                              {formatCurrency(trade.trade_price)}
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-text-light-secondary dark:text-text-dark-secondary">
                              {trade.fee_native !== undefined && trade.fee_native !== null
                                ? `${formatAmount(trade.fee_native)} ${trade.fee_currency ?? ''}`
                                : '-'}
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(calculateTotalValue(trade.amount, trade.trade_price))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile/Tablet view - card-based layout */}
                  <div className="space-y-3 sm:space-y-4 lg:hidden">
                    {tradeHistory.map((trade, index) => (
                      <motion.div
                        key={trade.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-2xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary dark:bg-primary/20">
                            {getTokenInfo(trade.token_address).name}
                          </span>
                          <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                            {new Date(trade.trade_time).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                              Amount (USDT)
                            </p>
                            <p className="mt-1 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                              {formatAmount(trade.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                              Price
                            </p>
                            <p className="mt-1 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                              {formatCurrency(trade.trade_price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                              Fee
                            </p>
                            <p className="mt-1 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                              {trade.fee_native !== undefined && trade.fee_native !== null
                                ? `${formatAmount(trade.fee_native)} ${trade.fee_currency ?? ''}`
                                : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                              Total Value
                            </p>
                            <p className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(calculateTotalValue(trade.amount, trade.trade_price))}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* Right Column - Coin Allocations */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl sm:rounded-3xl border border-border-light bg-card-light p-4 shadow-soft dark:border-border-dark dark:bg-card-dark sm:p-6 lg:sticky lg:top-24"
            >
              <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  Asset Allocations
                </h2>
              </div>

              {coins && coins.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {coins.map((coin: any, index: number) => {
                    const tokenInfo = getTokenInfo(coin.token_address);
                    const progressValue = Math.min(100, (coin.amount / (coin.threshold || 1)) * 100);

                    return (
                      <motion.div
                        key={coin.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-xl sm:rounded-2xl border border-border-light bg-background-light p-3 sm:p-4 transition-all hover:shadow-md dark:border-border-dark dark:bg-background-dark"
                      >
                        {/* Token Header */}
                        <div className="mb-2 sm:mb-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-sm flex-shrink-0">
                              <span className="text-[10px] sm:text-xs font-bold">
                                {tokenInfo.symbol.substring(0, 3)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-semibold text-text-light-primary dark:text-text-dark-primary truncate">
                                {tokenInfo.name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-text-light-secondary dark:text-text-dark-secondary truncate">
                                {tokenInfo.symbol}
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-green-500/10 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-green-600 dark:bg-green-500/20 dark:text-green-400 flex-shrink-0">
                            <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                            <span className="hidden sm:inline">Active</span>
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="mb-2 sm:mb-3">
                          <p className="text-[10px] sm:text-xs text-text-light-secondary dark:text-text-dark-secondary">
                            Investment Amount
                          </p>
                          <p className="mt-0.5 sm:mt-1 text-base sm:text-lg font-bold text-text-light-primary dark:text-text-dark-primary break-words">
                            ${coin.amount} USDT
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2 sm:mb-3">
                          <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                              style={{ width: `${progressValue}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Trading Condition */}
                        <div className="rounded-lg sm:rounded-xl border border-border-light bg-card-light p-2 sm:p-3 dark:border-border-dark dark:bg-card-dark">
                          <p className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
                            Trading Condition
                          </p>
                          <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-text-light-primary dark:text-text-dark-primary break-words">
                            {coin.condition_type
                              ? coin.condition_type
                                  .split('_')
                                  .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ')
                              : 'Price Drop'}
                          </p>
                          {coin.condition_params && (
                            <div className="space-y-0.5 sm:space-y-1">
                              {Object.entries(coin.condition_params).map(([key, value]: [string, any]) => (
                                <div
                                  key={key}
                                  className="flex justify-between gap-2 text-[10px] sm:text-xs text-text-light-secondary dark:text-text-dark-secondary"
                                >
                                  <span className="truncate">{key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}:</span>
                                  <span className="font-medium text-text-light-primary dark:text-text-dark-primary whitespace-nowrap ml-2">
                                    {typeof value === 'number'
                                      ? key.includes('threshold') || key.includes('price')
                                        ? key.includes('tolerance')
                                          ? `${(value * 100).toFixed(1)}%`
                                          : key.includes('price')
                                            ? `$${value.toFixed(4)}`
                                            : `${value}%`
                                        : value.toString()
                                      : value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-light bg-background-light py-12 dark:border-border-dark dark:bg-background-dark">
                  <div className="mb-4 rounded-full bg-primary/10 p-4 dark:bg-primary/20">
                    <Coins className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    No asset allocations found
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
