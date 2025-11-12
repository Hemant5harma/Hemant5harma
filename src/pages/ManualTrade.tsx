import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, getWalletBalances } from '../utils/apiClient';
import { showNotification } from '@mantine/notifications';
import {
  networkOptions,
  tokensByNetwork,
  getExplorerTxUrl,
  type Token,
  type Network,
} from '../data/networkData';
import PrivateKeySelector from '../components/PrivateKeySelector';
import AddPrivateKeyModal from '../components/AddPrivateKeyModal';
import { Search, X } from 'lucide-react';

// Types (keeping the same)
interface QuoteData {
  sell_token: string;
  buy_token: string;
  sell_amount: string;
  buy_amount: string;
  price: string;
  estimated_gas: string;
  gas_price: string;
  slippage_bps: number;
  expires_at: string;
  price_impact?: string;
}

interface TradeHistory {
  id: string;
  sell_token: string;
  buy_token: string;
  sell_amount: string;
  buy_amount: string;
  transaction_hash: string;
  status: string;
  created_at: string;
  chain_id: number;
  network_name: string;
}

const calculateExchangeRate = (
  sellAmount: string,
  buyAmount: string,
  sellDecimals: number,
  buyDecimals: number,
) => {
  try {
    const sellAmountBN = BigInt(sellAmount);
    const buyAmountBN = BigInt(buyAmount);

    // Convert to proper decimal format
    const sellAmountFormatted = Number(sellAmountBN) / Math.pow(10, sellDecimals);
    const buyAmountFormatted = Number(buyAmountBN) / Math.pow(10, buyDecimals);

    // Calculate exchange rate: 1 sellToken = ? buyToken
    const exchangeRate = buyAmountFormatted / sellAmountFormatted;

    return exchangeRate.toFixed(6);
  } catch (error) {
    console.error('Error calculating exchange rate:', error);
    return '0.000000';
  }
};

// Helper function to get token symbol and decimals from address (supports both EVM and Solana)
const getTokenInfo = (address: string, chainId: number) => {
  const tokens = tokensByNetwork[chainId] || [];
  
  // For Solana (chain 900), use case-sensitive comparison since Solana addresses are case-sensitive
  // For EVM chains, use case-insensitive comparison
  const token = chainId === 900 
    ? tokens.find((t) => t.address === address)
    : tokens.find((t) => t.address.toLowerCase() === address.toLowerCase());

  if (token) {
    return {
      symbol: token.symbol,
      decimals: token.decimals,
      name: token.name,
    };
  }

  // Fallback for common native token addresses
  if (address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    // Native token fallback based on chain
    const nativeTokens: Record<number, { symbol: string; decimals: number; name: string }> = {
      1: { symbol: 'ETH', decimals: 18, name: 'Ethereum' },
      137: { symbol: 'MATIC', decimals: 18, name: 'Polygon' },
      56: { symbol: 'BNB', decimals: 18, name: 'Binance Coin' },
      42161: { symbol: 'ETH', decimals: 18, name: 'Ethereum' },
      8453: { symbol: 'ETH', decimals: 18, name: 'Ethereum' },
      10: { symbol: 'ETH', decimals: 18, name: 'Ethereum' },
      43114: { symbol: 'AVAX', decimals: 18, name: 'Avalanche' },
      10143: { symbol: 'MON', decimals: 18, name: 'Monad' },
    };
    return nativeTokens[chainId] || { symbol: 'ETH', decimals: 18, name: 'Ethereum' };
  }

  // Fallback for Solana native token (SOL)
  if (chainId === 900 && address === 'So11111111111111111111111111111111111111112') {
    return { symbol: 'SOL', decimals: 9, name: 'Solana' };
  }

  // Unknown token fallback - adjust display for Solana vs EVM addresses
  const displaySymbol = chainId === 900 
    ? address.substring(0, 4) + '...' + address.substring(address.length - 4)  // Solana addresses are longer
    : address.substring(0, 6) + '...';  // EVM addresses

  return {
    symbol: displaySymbol,
    decimals: chainId === 900 ? 9 : 18,  // Solana tokens typically use 9 decimals, EVM uses 18
    name: 'Unknown Token',
  };
};

const ManualTrade: React.FC = () => {
  // Simplified state management (removed balance-related state)
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networkOptions[0]);
  const [sellToken, setSellToken] = useState<Token | null>(null);
  const [buyToken, setBuyToken] = useState<Token | null>(null);
  const [sellAmount, setSellAmount] = useState<string>('');
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(50);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState<boolean>(false);
  const [tokenSelectorType, setTokenSelectorType] = useState<'sell' | 'buy'>('sell');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [quoteError, setQuoteError] = useState<string>('');
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  // Wallet/Private key state
  const [selectedPrivateKeyId, setSelectedPrivateKeyId] = useState<number | null>(null);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [keyRefreshCounter, setKeyRefreshCounter] = useState(0);

  // Simplified useEffect hooks (removed wallet connection logic)
  useEffect(() => {
    const tokens = tokensByNetwork[selectedNetwork.chain_id] || [];
    if (tokens.length >= 2) {
      setSellToken(tokens[0]);
      setBuyToken(tokens[1]);
    }
    fetchTradeHistory();
    // Reset balances on network change
    setBalances({});
    setNativeBalance('0');
  }, [selectedNetwork]);

  const fetchQuote = useCallback(async () => {
    if (!sellAmount || !sellToken || !buyToken) return;
    if (sellToken.address.toLowerCase() === buyToken.address.toLowerCase()) {
      setQuoteError('Cannot swap the same token. Please select different tokens.');
      setBuyAmount('');
      setQuote(null);
      return;
    }

    setQuoteLoading(true);
    setQuoteError('');
    try {
      const sellAmountFloat = Number.parseFloat(sellAmount);
      if (isNaN(sellAmountFloat) || sellAmountFloat <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const decimalsMultiplier = Math.pow(10, sellToken.decimals);
      const sellAmountWei = (sellAmountFloat * decimalsMultiplier).toLocaleString('fullwide', {
        useGrouping: false,
      });

      const quoteRequest = {
        sell_token: sellToken.address,
        buy_token: buyToken.address,
        sell_amount: sellAmountWei,
        slippage_bps: slippage,
        chain_id: selectedNetwork.chain_id,
        rpc_url: selectedNetwork.rpc_url,
      };

      const quoteData: QuoteData = await apiClient.post('/mtrades/quote', quoteRequest);
      setQuote(quoteData);
      const buyAmountFormatted = (
        Number.parseFloat(quoteData.buy_amount) / Math.pow(10, buyToken.decimals)
      ).toFixed(8);
      setBuyAmount(buyAmountFormatted);
    } catch (error: any) {
      console.error('Failed to fetch quote:', error);
      setQuoteError(error.message || 'Network error - unable to get quote');
    } finally {
      setQuoteLoading(false);
    }
  }, [sellAmount, sellToken, buyToken, slippage, selectedNetwork]);

  // Fetch balances whenever selected tokens change
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const tokenList = [sellToken?.address, buyToken?.address].filter(Boolean) as string[];
        if (tokenList.length === 0) return;
        const res = await getWalletBalances(selectedNetwork.chain_id, tokenList);
        setNativeBalance(res.native_balance || '0');
        const map: Record<string, string> = {};
        (res.tokens || []).forEach((t: any) => {
          map[t.address] = t.balance;
        });
        setBalances(map);
      } catch (e) {
        // Silent fail; UI already has notifications in apiClient
      }
    };
    fetchBalances();
  }, [selectedNetwork.chain_id, sellToken?.address, buyToken?.address]);

  useEffect(() => {
    if (sellAmount && Number.parseFloat(sellAmount) > 0 && sellToken && buyToken) {
      const timeoutId = setTimeout(() => {
        fetchQuote();
      }, 800);
      return () => clearTimeout(timeoutId);
    } else {
      setBuyAmount('');
      setQuote(null);
      setQuoteError('');
    }
  }, [sellAmount, sellToken, buyToken, slippage, selectedNetwork, fetchQuote]);

  const executeSwap = async () => {
    if (!quote || !sellToken || !buyToken) return;
    setLoading(true);
    try {
      const tradeRequest = {
        sell_token: sellToken.address,
        buy_token: buyToken.address,
        sell_amount: quote.sell_amount,
        slippage_bps: slippage,
        chain_id: selectedNetwork.chain_id,
        rpc_url: selectedNetwork.rpc_url,
      };

      const response = await apiClient.post('/mtrades/execute', tradeRequest);
      showNotification({
        title: 'Swap Executed! 🎉',
        message: `Successfully swapped ${sellAmount} ${sellToken.symbol} for ${buyAmount} ${buyToken.symbol}`,
        color: 'green',
      });

      setSellAmount('');
      setBuyAmount('');
      setQuote(null);
      fetchTradeHistory();

      if (response.transaction_hash) {
        setTimeout(async () => {
          const status = await checkTransactionStatus(
            response.transaction_hash,
            selectedNetwork.chain_id,
          );
          if (status && status.status !== 'pending') {
            await fetchTradeHistory();
          }
        }, 15000);
      }
    } catch (error) {
      console.error('Failed to execute swap:', error);
      showNotification({
        title: 'Swap Failed',
        message: 'Transaction failed. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTradeHistory = async () => {
    try {
      const response = await apiClient.get('/mtrades/history?limit=10');
      setTradeHistory(response);
    } catch (error: any) {
      console.error('Failed to fetch trade history:', error);
      setTradeHistory([]);
    }
  };

  const checkTransactionStatus = async (transaction_hash: string, chain_id: number) => {
    try {
      const network = networkOptions.find((net) => net.chain_id === chain_id);
      if (!network) return null;
      const statusResponse = await apiClient.get(
        `/mtrades/transaction/${transaction_hash}?chain_id=${chain_id}&rpc_url=${encodeURIComponent(network.rpc_url)}`,
      );
      return statusResponse;
    } catch (error) {
      console.error(`Failed to check status for ${transaction_hash}:`, error);
      return null;
    }
  };

  const swapTokens = () => {
    if (sellToken && buyToken) {
      const tempToken = sellToken;
      setSellToken(buyToken);
      setBuyToken(tempToken);
      setSellAmount(buyAmount);
      setBuyAmount('');
      setQuote(null);
    }
  };

  const openTokenSelector = useCallback((type: 'sell' | 'buy') => {
    setTokenSelectorType(type);
    setIsTokenSelectorOpen(true);
    setSearchTerm('');
  }, []);

  const selectToken = useCallback((token: Token) => {
    if (tokenSelectorType === 'sell') {
      setSellToken(token);
    } else {
      setBuyToken(token);
    }
    setIsTokenSelectorOpen(false);
    setSearchTerm('');
  }, [tokenSelectorType]);

  const handleNetworkChange = (networkId: number) => {
    const network = networkOptions.find((n) => n.chain_id === networkId);
    if (network) {
      setSelectedNetwork(network);
      setSellToken(null);
      setBuyToken(null);
      setSellAmount('');
      setBuyAmount('');
      setQuote(null);
    }
  };

  const filteredTokens = useMemo(() => {
    const currentTokens = tokensByNetwork[selectedNetwork.chain_id] || [];
    return currentTokens.filter(
      (token) =>
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [selectedNetwork.chain_id, searchTerm]);

  const TokenSelector = () => (
    <AnimatePresence>
      {isTokenSelectorOpen && (
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsTokenSelectorOpen(false)}
        >
          <motion.div
            initial={false}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-card-light shadow-2xl dark:bg-card-dark dark:shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Select Token</h3>
                  <p className="text-sm text-purple-100">{selectedNetwork.name}</p>
                </div>
                <button
                  onClick={() => setIsTokenSelectorOpen(false)}
                  className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="border-b border-border-light bg-background-light p-4 shadow-inner dark:border-border-dark dark:bg-background-dark dark:shadow-none">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border-2 border-border-light bg-background-light py-3 pl-10 pr-4 text-text-light-primary transition-all duration-200 focus:border-primary focus:bg-card-light focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-text-dark-primary dark:focus:border-primary"
                />
              </div>
            </div>

            {/* Token List */}
            <div className="max-h-96 overflow-y-auto bg-background-light p-2 shadow-inner dark:bg-background-dark dark:shadow-none">
              {filteredTokens.length > 0 ? (
                <div className="space-y-1">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.address}
                      onClick={() => selectToken(token)}
                      className="flex w-full items-center justify-between rounded-xl bg-background-light p-4 transition-all duration-200 hover:bg-card-light hover:shadow-sm dark:bg-background-dark dark:hover:bg-card-dark dark:hover:shadow-none"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-lg">
                          {token.symbol.substring(0, 2)}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                            {token.symbol}
                          </div>
                          <div className="max-w-32 truncate text-sm text-text-light-secondary dark:text-text-dark-secondary">
                            {token.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">Select</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mb-3 inline-flex rounded-full bg-card-light p-3 dark:bg-card-dark">
                    <Search className="h-6 w-6 text-text-light-secondary dark:text-text-dark-secondary" />
                  </div>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary">No tokens found</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const SettingsModal = () => (
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsSettingsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md rounded-2xl bg-[#FFFFFF] shadow-2xl dark:bg-gray-800 dark:shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Swap Settings</h3>
                  <p className="text-sm text-purple-100">Configure your trading preferences</p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="bg-[#FAFBFC] p-6 shadow-inner dark:bg-gray-800 dark:shadow-none">
              <div className="mb-6">
                <label className="mb-4 block text-lg font-semibold text-gray-900 dark:text-white">
                  Slippage Tolerance
                </label>
                <div className="mb-4 grid grid-cols-4 gap-2">
                  {[10, 50, 100, 300].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`rounded-xl px-2 py-3 text-sm font-semibold transition-all duration-200 ${
                        slippage === value
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg dark:shadow-none'
                          : 'bg-[#FAFBFC] text-gray-700 hover:bg-[#FFFFFF] hover:shadow-sm dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:shadow-none'
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
                  className="w-full rounded-xl border-2 border-gray-200 bg-[#FAFBFC] px-4 py-3 text-gray-900 transition-all duration-200 focus:border-primary focus:bg-[#FFFFFF] focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary"
                  placeholder="Custom %"
                  step="0.01"
                  min="0.01"
                  max="50"
                />
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary py-4 font-semibold text-white transition-all duration-200 hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg dark:shadow-none"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="w-full bg-background-light dark:bg-background-dark font-display">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <header className="relative flex items-center justify-between">
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/20 dark:from-primary/30 to-transparent blur-3xl -z-10"></div>
          <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black tracking-[-0.033em]">
            Manual Trade
            </h1>
        </header>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Swap Interface */}
          <div className="flex-1 flex flex-col gap-6 p-4 md:p-6 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            {/* From Token */}
            <div className="flex flex-col gap-3 p-4 bg-slate-100 dark:bg-black/20 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">From</p>
                  {sellToken && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Balance: {
                        (() => {
                          const bal = sellToken.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' || (selectedNetwork.chain_id === 900 && sellToken.address === 'So11111111111111111111111111111111111111112')
                            ? nativeBalance
                            : balances[sellToken.address] || '0';
                          const dec = sellToken.decimals;
                          try {
                            return (Number(bal) / Math.pow(10, dec)).toFixed(6);
                          } catch {
                            return '0';
                          }
                        })()
                      } {sellToken.symbol}
                  </p>
                  )}
                </div>
              <div className="flex items-center justify-between gap-4">
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    placeholder="0.0"
                  className="flex-1 bg-transparent text-slate-900 dark:text-white text-3xl font-bold p-0 border-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                  <button
                    onClick={() => openTokenSelector('sell')}
                  className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full h-10 px-4 bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    {sellToken ? (
                      <>
                      <div className="w-5 h-5 bg-center bg-no-repeat aspect-square bg-cover rounded-full bg-gradient-to-br from-primary to-secondary"></div>
                      <span className="truncate">{sellToken.symbol}</span>
                      </>
                    ) : (
                    <span className="truncate">Select</span>
                  )}
                  <span className="material-symbols-outlined text-lg">expand_more</span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {sellAmount && sellToken ? `$${(parseFloat(sellAmount) * (sellToken.symbol === 'ETH' ? 3000 : 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                </p>
                <button
                  onClick={() => {
                    if (sellToken) {
                      const bal = sellToken.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' || (selectedNetwork.chain_id === 900 && sellToken.address === 'So11111111111111111111111111111111111111112')
                        ? nativeBalance
                        : balances[sellToken.address] || '0';
                      const dec = sellToken.decimals;
                      try {
                        setSellAmount((Number(bal) / Math.pow(10, dec)).toString());
                      } catch {}
                    }
                  }}
                  className="text-primary text-sm font-bold hover:underline"
                >
                  Max
                  </button>
                </div>
              </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-9 z-10">
                <button
                  onClick={swapTokens}
                className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-4 border-background-light dark:border-slate-900/50 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                <span className="material-symbols-outlined text-2xl">swap_vert</span>
                </button>
              </div>

            {/* To Token */}
            <div className="flex flex-col gap-3 p-4 bg-slate-100 dark:bg-black/20 rounded-lg">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">To</p>
              <div className="flex items-center justify-between gap-4">
                  <input
                  type="text"
                  value={buyAmount || '0.0'}
                    readOnly
                    placeholder="0.0"
                  className="flex-1 bg-transparent text-slate-900 dark:text-white text-3xl font-bold p-0 border-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                  <button
                    onClick={() => openTokenSelector('buy')}
                  className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full h-10 px-4 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white text-sm font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                  >
                    {buyToken ? (
                      <>
                      <div className="w-5 h-5 bg-center bg-no-repeat aspect-square bg-cover rounded-full bg-gradient-to-br from-primary to-secondary"></div>
                      <span className="truncate">{buyToken.symbol}</span>
                      </>
                    ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">token</span>
                      <span className="truncate">Select Token</span>
                    </>
                    )}
                  <span className="material-symbols-outlined text-lg">expand_more</span>
                  </button>
                </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {buyAmount && buyToken ? `$${(parseFloat(buyAmount) * (buyToken.symbol === 'USDC' ? 1 : 3000)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
              </p>
              </div>

            {/* Error Display */}
            {quoteError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                  <p className="text-sm text-red-700 dark:text-red-300">{quoteError}</p>
                  </div>
              </div>
            )}

            {/* Swap Button */}
            <div className="flex flex-col gap-2">
              <button
                onClick={executeSwap}
                disabled={!quote || loading || !sellAmount || !sellToken || !buyToken || quoteLoading || !!quoteError}
                className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white text-base font-bold tracking-wide shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Swapping...' : 'Swap'}
              </button>
              {quoteLoading && (
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">Getting quote...</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-64 flex flex-col gap-4">
            {/* Network Selector */}
            <div className="p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Network</p>
              <select
                value={selectedNetwork.chain_id}
                onChange={(e) => handleNetworkChange(Number.parseInt(e.target.value))}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-black/20 hover:bg-slate-200 dark:hover:bg-black/30 transition-colors text-slate-800 dark:text-white font-semibold border-none focus:ring-2 focus:ring-primary"
              >
                {networkOptions.map((network) => (
                  <option key={network.chain_id} value={network.chain_id}>
                    {network.name} {network.isTestnet ? '(Testnet)' : ''}
                  </option>
                ))}
              </select>
                    </div>

            {/* Wallet Selector */}
            <div className="p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Wallet</p>
              <PrivateKeySelector
                key={`${selectedNetwork.chain_id}-${keyRefreshCounter}`}
                chainId={selectedNetwork.chain_id}
                selectedKeyId={selectedPrivateKeyId}
                onKeySelect={(keyId) => setSelectedPrivateKeyId(keyId)}
                onAddKey={() => setShowAddKeyModal(true)}
                label=""
              />
                    </div>

            {/* Quote Details */}
            <div className="p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex-1">
              <p className="text-slate-800 dark:text-white text-sm font-bold mb-3">Quote Details</p>
              <div className="flex flex-col gap-2.5 text-sm">
                {quote && sellToken && buyToken ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Price:</span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        1 {sellToken.symbol} = {calculateExchangeRate(quote.sell_amount, quote.buy_amount, sellToken.decimals, buyToken.decimals)} {buyToken.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Slippage:</span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium">{slippage / 100}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Network Fee:</span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        ~${(Number.parseInt(quote.estimated_gas || '0') * 0.00000002).toFixed(2)}
                        </span>
                      </div>
                  </>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Enter amount to see quote</p>
                    )}
                  </div>
                </div>
            </div>
        </div>

          {/* Recent Trades */}
          {tradeHistory.length > 0 && (
          <div className="flex flex-col gap-2 p-4 md:p-6 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <h2 className="text-slate-900 dark:text-white text-lg font-bold mb-2">Recent Trades</h2>
            <div className="flex flex-col">
              {tradeHistory.slice(0, 3).map((trade) => {
                      const sellTokenInfo = getTokenInfo(trade.sell_token, trade.chain_id);
                      const buyTokenInfo = getTokenInfo(trade.buy_token, trade.chain_id);
                      const formatAmount = (amount: string, decimals = 18) => {
                        try {
                    const formatted = (Number.parseFloat(amount) / Math.pow(10, decimals)).toFixed(6);
                          return Number.parseFloat(formatted).toString();
                        } catch {
                          return '0';
                        }
                      };
                const getStatusIcon = () => {
                  if (trade.status === 'success') return 'check_circle';
                  if (trade.status === 'failed') return 'cancel';
                  return 'hourglass_top';
                };
                const getStatusColor = () => {
                  if (trade.status === 'success') return 'text-green-500 bg-green-500/10 dark:bg-green-500/20';
                  if (trade.status === 'failed') return 'text-red-500 bg-red-500/10 dark:bg-red-500/20';
                  return 'text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20';
                };
                const getStatusText = () => {
                  if (trade.status === 'success') return 'Success';
                  if (trade.status === 'failed') return 'Failed';
                  return 'Pending';
                };
                const getStatusBadgeColor = () => {
                  if (trade.status === 'success') return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-500/20';
                  if (trade.status === 'failed') return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-500/20';
                  return 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-500/20';
                      };

                      return (
                  <div
                          key={trade.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4 border-b border-slate-200 dark:border-white/10 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center size-10 rounded-full ${getStatusColor()}`}>
                        <span className={`material-symbols-outlined ${getStatusColor().split(' ')[0]}`}>
                          {getStatusIcon()}
                                  </span>
                                </div>
                      <div>
                        <p className="text-slate-800 dark:text-white font-medium">
                          Swap {formatAmount(trade.sell_amount, sellTokenInfo.decimals)} {sellTokenInfo.symbol} for {formatAmount(trade.buy_amount, buyTokenInfo.decimals)} {buyTokenInfo.symbol}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          {new Date(trade.created_at).toLocaleString()} on {trade.network_name || `Chain ${trade.chain_id}`}
                        </p>
                              </div>
                            </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto sm:justify-end pl-14 sm:pl-0">
                      <div className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor()}`}>
                        {getStatusText()}
                              </div>
                              <a
                                href={getExplorerTxUrl(trade.chain_id, trade.transaction_hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                        className="text-primary text-sm font-semibold hover:underline"
                              >
                        Check Status
                              </a>
                            </div>
                          </div>
                      );
                    })}
                </div>
                  </div>
                )}
      </div>

      {/* Modals */}
      <TokenSelector />
      <SettingsModal />
      
      {/* Add Private Key Modal */}
      <AddPrivateKeyModal
        isOpen={showAddKeyModal}
        onClose={() => setShowAddKeyModal(false)}
        chainId={selectedNetwork.chain_id}
        onKeyCreated={() => {
          setKeyRefreshCounter(prev => prev + 1);
          setShowAddKeyModal(false);
        }}
      />
    </div>
  );
};

export default ManualTrade;


