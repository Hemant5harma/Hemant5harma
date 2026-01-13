import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiClient, getWalletBalances } from '../utils/apiClient';
import { showNotification } from '@mantine/notifications';
import {
  networkOptions,
  tokensByNetwork,
  type Token,
  type Network,
} from '../data/networkData';
import PrivateKeySelector from '../components/PrivateKeySelector';
import AddPrivateKeyModal from '../components/AddPrivateKeyModal';
import { Search, X, ArrowLeft, MoreVertical, ArrowUpDown } from 'lucide-react';

// Types
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

const calculateExchangeRate = (
  sellAmount: string,
  buyAmount: string,
  sellDecimals: number,
  buyDecimals: number,
) => {
  try {
    const sellAmountBN = BigInt(sellAmount);
    const buyAmountBN = BigInt(buyAmount);
    const sellAmountFormatted = Number(sellAmountBN) / Math.pow(10, sellDecimals);
    const buyAmountFormatted = Number(buyAmountBN) / Math.pow(10, buyDecimals);
    const exchangeRate = buyAmountFormatted / sellAmountFormatted;
    return exchangeRate.toFixed(6);
  } catch (error) {
    console.error('Error calculating exchange rate:', error);
    return '0.000000';
  }
};

const ManualTrade: React.FC = () => {
  const navigate = useNavigate();
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
  const [quoteError, setQuoteError] = useState<string>('');
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPrivateKeyId, setSelectedPrivateKeyId] = useState<number | null>(null);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [keyRefreshCounter, setKeyRefreshCounter] = useState(0);

  useEffect(() => {
    const tokens = tokensByNetwork[selectedNetwork.chain_id] || [];
    if (tokens.length >= 2) {
      setSellToken(tokens[0]);
      setBuyToken(tokens[1]);
    }
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
        // Silent fail
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

      await apiClient.post('/mtrades/execute', tradeRequest);
      showNotification({
        title: 'Swap Executed! 🎉',
        message: `Successfully swapped ${sellAmount} ${sellToken.symbol} for ${buyAmount} ${buyToken.symbol}`,
        color: 'green',
      });

      setSellAmount('');
      setBuyAmount('');
      setQuote(null);
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

  const getSellTokenBalance = () => {
    if (!sellToken) return '0.000000';
    const bal = sellToken.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' || 
      (selectedNetwork.chain_id === 900 && sellToken.address === 'So11111111111111111111111111111111111111112')
      ? nativeBalance
      : balances[sellToken.address] || '0';
    const dec = sellToken.decimals;
    try {
      return (Number(bal) / Math.pow(10, dec)).toFixed(6);
    } catch {
      return '0.000000';
    }
  };


  const formatUSDValue = (amount: string, token: Token | null) => {
    if (!amount || !token) return '$0.00';
    // Simplified USD calculation - in production, fetch real prices
    const price = token.symbol === 'USDT' || token.symbol === 'USDC' ? 1 : 3000;
    return `$${(parseFloat(amount) * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const TokenSelector = () => (
    <AnimatePresence>
      {isTokenSelectorOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsTokenSelectorOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-card-light shadow-2xl dark:bg-card-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Select Token</h3>
                  <p className="text-sm text-white/80">{selectedNetwork.name}</p>
                </div>
                <button
                  onClick={() => setIsTokenSelectorOpen(false)}
                  className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="border-b border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border-2 border-border-light bg-background-light py-3 pl-10 pr-4 text-text-light-primary transition-all focus:border-primary focus:bg-card-light focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-text-dark-primary"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto bg-background-light p-2 dark:bg-background-dark">
              {filteredTokens.length > 0 ? (
                <div className="space-y-1">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.address}
                      onClick={() => selectToken(token)}
                      className="flex w-full items-center justify-between rounded-xl bg-background-light p-4 transition-all hover:bg-card-light dark:bg-background-dark dark:hover:bg-card-dark"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
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
            className="w-full max-w-md rounded-2xl bg-card-light shadow-2xl dark:bg-card-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Swap Settings</h3>
                  <p className="text-sm text-white/80">Configure your trading preferences</p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="bg-surface-light p-6 dark:bg-surface-dark">
              <div className="mb-6">
                <label className="mb-4 block text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                  Slippage Tolerance
                </label>
                <div className="mb-4 grid grid-cols-4 gap-2">
                  {[10, 50, 100, 300].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`rounded-xl px-2 py-3 text-sm font-semibold transition-all ${
                        slippage === value
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                          : 'bg-background-light text-text-light-primary hover:bg-card-light dark:bg-background-dark dark:text-text-dark-primary dark:hover:bg-card-dark'
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
                  className="w-full rounded-xl border-2 border-border-light bg-background-light px-4 py-3 text-text-light-primary transition-all focus:border-primary focus:bg-card-light focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-text-dark-primary"
                  placeholder="Custom %"
                  step="0.01"
                  min="0.01"
                  max="50"
                />
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary py-4 font-semibold text-white transition-all hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg"
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
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
      {/* Mobile Header */}
      <header className="flex items-center justify-between border-b border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark sm:hidden">
        <button
          onClick={() => navigate(-1)}
          className="text-text-light-primary dark:text-text-dark-primary"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
          Manual Trade
        </h1>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="text-text-light-primary dark:text-text-dark-primary"
        >
          <MoreVertical className="h-6 w-6" />
        </button>
      </header>

      {/* Desktop Header */}
      <div className="hidden sm:block">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Manual Trade
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Mobile Layout - Single Column */}
        <div className="mx-auto max-w-2xl space-y-6 sm:hidden">
          {/* Mobile Swap Interface */}
          <div className="relative">
            <div className="space-y-3 rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
              {/* From Section */}
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  <span>From</span>
                  {sellToken && (
                    <span>
                      Balance: {getSellTokenBalance()} {sellToken.symbol}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-transparent text-3xl font-semibold text-text-light-primary placeholder:text-text-light-secondary focus:outline-none dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary"
                    />
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {formatUSDValue(sellAmount, sellToken)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (sellToken) {
                          const bal = getSellTokenBalance();
                          setSellAmount(bal);
                        }
                      }}
                      className="text-sm font-semibold text-primary"
                    >
                      Max
                    </button>
                    <button
                      onClick={() => openTokenSelector('sell')}
                      className="flex items-center space-x-2 rounded-full bg-primary/10 px-3 py-2 text-primary"
                    >
                      {sellToken ? (
                        <>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                            {sellToken.symbol.substring(0, 2)}
                          </div>
                          <span className="font-semibold">{sellToken.symbol}</span>
                        </>
                      ) : (
                        <span className="font-semibold">Select</span>
                      )}
                      <span className="material-symbols-outlined text-xl">expand_more</span>
                    </button>
                  </div>
                </div>
              </div>

              <hr className="border-border-light dark:border-border-dark" />

              {/* To Section */}
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  <span>To</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={buyAmount || '0.0'}
                      readOnly
                      placeholder="0.0"
                      className="w-full bg-transparent text-3xl font-semibold text-text-light-primary placeholder:text-text-light-secondary focus:outline-none dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary"
                    />
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {formatUSDValue(buyAmount, buyToken)}
                    </p>
                  </div>
                  <button
                    onClick={() => openTokenSelector('buy')}
                    className="flex items-center space-x-2 rounded-full bg-background-light px-3 py-2 dark:bg-background-dark"
                  >
                    {buyToken ? (
                      <>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                          {buyToken.symbol.substring(0, 2)}
                        </div>
                        <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                          {buyToken.symbol}
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                        Select
                      </span>
                    )}
                    <span className="material-symbols-outlined text-xl text-text-light-secondary dark:text-text-dark-secondary">
                      expand_more
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={swapTokens}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border-light bg-surface-light p-2 dark:border-border-dark dark:bg-surface-dark"
            >
              <ArrowUpDown className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
            </button>
          </div>

          {/* Mobile Swap Action Button */}
          <button
            onClick={executeSwap}
            disabled={!quote || loading || !sellAmount || !sellToken || !buyToken || quoteLoading || !!quoteError}
            className="w-full rounded-md bg-primary py-3.5 font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Swapping...' : 'Swap'}
          </button>

          {/* Mobile Network Selector */}
          <div>
            <label
              className="mb-1 block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary"
              htmlFor="network-mobile"
            >
              Network
            </label>
            <div className="relative">
              <select
                id="network-mobile"
                value={selectedNetwork.chain_id}
                onChange={(e) => handleNetworkChange(Number(e.target.value))}
                className="w-full appearance-none rounded-md border border-border-light bg-surface-light py-3 px-4 text-text-light-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-border-dark dark:bg-surface-dark dark:text-text-dark-primary"
              >
                {networkOptions.map((net) => (
                  <option key={net.chain_id} value={net.chain_id}>
                    {net.name}{net.isTestnet ? ' (Testnet)' : ''}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary">
                expand_more
              </span>
            </div>
          </div>

          {/* Mobile Wallet Selector */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
              Wallet
            </label>
            <div className="rounded-lg border border-border-light bg-surface-light p-3 dark:border-border-dark dark:bg-surface-dark">
              <PrivateKeySelector
                key={`${selectedNetwork.chain_id}-${keyRefreshCounter}`}
                chainId={selectedNetwork.chain_id}
                selectedKeyId={selectedPrivateKeyId}
                onKeySelect={(keyId) => setSelectedPrivateKeyId(keyId)}
                onAddKey={() => setShowAddKeyModal(true)}
                label=""
              />
            </div>
          </div>

          {/* Mobile Quote Details */}
          <div className="rounded-lg border border-border-light bg-surface-light p-4 text-center dark:border-border-dark dark:bg-surface-dark">
            <h3 className="mb-1 text-md font-semibold text-text-light-primary dark:text-text-dark-primary">
              Quote Details
            </h3>
            {quote && sellToken && buyToken ? (
              <div className="mt-4 space-y-2 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-text-light-secondary dark:text-text-dark-secondary">Price:</span>
                  <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    1 {sellToken.symbol} = {calculateExchangeRate(quote.sell_amount, quote.buy_amount, sellToken.decimals, buyToken.decimals)} {buyToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light-secondary dark:text-text-dark-secondary">Slippage:</span>
                  <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    {slippage / 100}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light-secondary dark:text-text-dark-secondary">Network Fee:</span>
                  <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    ~${(Number.parseInt(quote.estimated_gas || '0') * 0.00000002).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Enter amount to see quote
              </p>
            )}
          </div>

          {/* Mobile Error Display */}
          {quoteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-lg text-red-500">error</span>
                <p className="text-sm text-red-700 dark:text-red-300">{quoteError}</p>
              </div>
            </div>
          )}

          {quoteLoading && (
            <p className="text-center text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Getting quote...
            </p>
          )}
        </div>

        {/* Desktop Layout - Two Columns */}
        <div className="hidden mx-auto max-w-7xl sm:grid sm:grid-cols-3 sm:gap-6">
          {/* Left Column - Swap Interface (2/3 width) */}
          <div className="col-span-2 space-y-6">
            <div className="relative">
              <div className="space-y-3 rounded-lg border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark">
                {/* From Section */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    <span>From</span>
                    {sellToken && (
                      <span>
                        Balance: {getSellTokenBalance()} {sellToken.symbol}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-transparent text-3xl font-semibold text-text-light-primary placeholder:text-text-light-secondary focus:outline-none dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary"
                      />
                      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {formatUSDValue(sellAmount, sellToken)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (sellToken) {
                            const bal = getSellTokenBalance();
                            setSellAmount(bal);
                          }
                        }}
                        className="text-sm font-semibold text-primary"
                      >
                        Max
                      </button>
                      <button
                        onClick={() => openTokenSelector('sell')}
                        className="flex items-center space-x-2 rounded-full bg-primary/10 px-3 py-2 text-primary"
                      >
                        {sellToken ? (
                          <>
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                              {sellToken.symbol.substring(0, 2)}
                            </div>
                            <span className="font-semibold">{sellToken.symbol}</span>
                          </>
                        ) : (
                          <span className="font-semibold">Select</span>
                        )}
                        <span className="material-symbols-outlined text-xl">expand_more</span>
                      </button>
                    </div>
                  </div>
                </div>

                <hr className="border-border-light dark:border-border-dark" />

                {/* To Section */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    <span>To</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={buyAmount || '0.0'}
                        readOnly
                        placeholder="0.0"
                        className="w-full bg-transparent text-3xl font-semibold text-text-light-primary placeholder:text-text-light-secondary focus:outline-none dark:text-text-dark-primary dark:placeholder:text-text-dark-secondary"
                      />
                      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {formatUSDValue(buyAmount, buyToken)}
                      </p>
                    </div>
                    <button
                      onClick={() => openTokenSelector('buy')}
                      className="flex items-center space-x-2 rounded-full bg-background-light px-3 py-2 dark:bg-background-dark"
                    >
                      {buyToken ? (
                        <>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                            {buyToken.symbol.substring(0, 2)}
                          </div>
                          <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                            {buyToken.symbol}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                          Select
                        </span>
                      )}
                      <span className="material-symbols-outlined text-xl text-text-light-secondary dark:text-text-dark-secondary">
                        expand_more
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <button
                onClick={swapTokens}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border-light bg-surface-light p-2 dark:border-border-dark dark:bg-surface-dark"
              >
                <ArrowUpDown className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" />
              </button>
            </div>

            {/* Desktop Swap Action Button */}
            <button
              onClick={executeSwap}
              disabled={!quote || loading || !sellAmount || !sellToken || !buyToken || quoteLoading || !!quoteError}
              className="w-full rounded-md bg-primary py-3.5 font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Swapping...' : 'Swap'}
            </button>

            {/* Desktop Error Display */}
            {quoteError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-lg text-red-500">error</span>
                  <p className="text-sm text-red-700 dark:text-red-300">{quoteError}</p>
                </div>
              </div>
            )}

            {quoteLoading && (
              <p className="text-center text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Getting quote...
              </p>
            )}
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Network Selector */}
            <div>
              <label
                className="mb-1 block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary"
                htmlFor="network-desktop"
              >
                Network
              </label>
              <div className="relative">
                <select
                  id="network-desktop"
                  value={selectedNetwork.chain_id}
                  onChange={(e) => handleNetworkChange(Number(e.target.value))}
                  className="w-full appearance-none rounded-md border border-border-light bg-surface-light py-3 px-4 text-text-light-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-border-dark dark:bg-surface-dark dark:text-text-dark-primary"
                >
                  {networkOptions.map((net) => (
                    <option key={net.chain_id} value={net.chain_id}>
                      {net.name}{net.isTestnet ? ' (Testnet)' : ''}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary">
                  expand_more
                </span>
              </div>
            </div>

            {/* Wallet Selector */}
            <div>
              <label className="mb-1 block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
                Wallet
              </label>
              <div className="rounded-lg border border-border-light bg-surface-light p-3 dark:border-border-dark dark:bg-surface-dark">
                <PrivateKeySelector
                  key={`${selectedNetwork.chain_id}-${keyRefreshCounter}`}
                  chainId={selectedNetwork.chain_id}
                  selectedKeyId={selectedPrivateKeyId}
                  onKeySelect={(keyId) => setSelectedPrivateKeyId(keyId)}
                  onAddKey={() => setShowAddKeyModal(true)}
                  label=""
                />
              </div>
            </div>

            {/* Quote Details */}
            <div className="rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
              <h3 className="mb-1 text-md font-semibold text-text-light-primary dark:text-text-dark-primary">
                Quote Details
              </h3>
              {quote && sellToken && buyToken ? (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-light-secondary dark:text-text-dark-secondary">Price:</span>
                    <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      1 {sellToken.symbol} = {calculateExchangeRate(quote.sell_amount, quote.buy_amount, sellToken.decimals, buyToken.decimals)} {buyToken.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-light-secondary dark:text-text-dark-secondary">Slippage:</span>
                    <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      {slippage / 100}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-light-secondary dark:text-text-dark-secondary">Network Fee:</span>
                    <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      ~${(Number.parseInt(quote.estimated_gas || '0') * 0.00000002).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Enter amount to see quote
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <TokenSelector />
      <SettingsModal />

      <AddPrivateKeyModal
        isOpen={showAddKeyModal}
        onClose={() => setShowAddKeyModal(false)}
        chainId={selectedNetwork.chain_id}
        onKeyCreated={() => {
          setKeyRefreshCounter((prev) => prev + 1);
          setShowAddKeyModal(false);
        }}
      />
    </div>
  );
};

export default ManualTrade;
