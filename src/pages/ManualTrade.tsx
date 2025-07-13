import type React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../utils/apiClient';
import { showNotification } from '@mantine/notifications';
import {
  networkOptions,
  tokensByNetwork,
  getExplorerUrls,
  getExplorerTxUrl,
  type Token,
  type Network,
} from '../data/networkData';
import {
  ChevronDown,
  ArrowUpDown,
  Settings,
  RefreshCw,
  Zap,
  TrendingUp,
  Shield,
  Wallet,
  AlertTriangle,
  Info,
  ExternalLink,
  Search,
  X,
  Check,
  Clock,
  DollarSign,
} from 'lucide-react';

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

const formatPrice = (price: string | number) => {
  try {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '0.000000';

    // For very small numbers, use scientific notation
    if (numPrice < 0.000001 && numPrice > 0) {
      return numPrice.toExponential(4);
    }

    // For normal numbers, use appropriate decimal places
    if (numPrice < 1) {
      return numPrice.toFixed(6);
    } else if (numPrice < 1000) {
      return numPrice.toFixed(4);
    } else {
      return numPrice.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
  } catch (error) {
    return '0.000000';
  }
};

// Helper function to get token symbol and decimals from address
const getTokenInfo = (address: string, chainId: number) => {
  const tokens = tokensByNetwork[chainId] || [];
  const token = tokens.find((t) => t.address.toLowerCase() === address.toLowerCase());

  if (token) {
    return {
      symbol: token.symbol,
      decimals: token.decimals,
      name: token.name,
    };
  }

  // Fallback for common addresses
  if (address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    // Native token fallback based on chain
    const nativeTokens: Record<number, { symbol: string; decimals: number }> = {
      1: { symbol: 'ETH', decimals: 18 },
      137: { symbol: 'MATIC', decimals: 18 },
      56: { symbol: 'BNB', decimals: 18 },
      42161: { symbol: 'ETH', decimals: 18 },
      8453: { symbol: 'ETH', decimals: 18 },
      10: { symbol: 'ETH', decimals: 18 },
      43114: { symbol: 'AVAX', decimals: 18 },
      10143: { symbol: 'MON', decimals: 18 },
    };
    return nativeTokens[chainId] || { symbol: 'ETH', decimals: 18 };
  }

  // Unknown token fallback
  return {
    symbol: address.substring(0, 6) + '...',
    decimals: 18,
    name: 'Unknown Token',
  };
};

const ManualTrade: React.FC = () => {
  // All state management (keeping the same)
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networkOptions[4]);
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
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // All useEffect hooks and functions (keeping the same logic)
  useEffect(() => {
    const tokens = tokensByNetwork[selectedNetwork.chain_id] || [];
    if (tokens.length >= 2) {
      setSellToken(tokens[0]);
      setBuyToken(tokens[1]);
    }
    fetchTradeHistory();
  }, [selectedNetwork]);

  useEffect(() => {
    checkWalletConnection();
    if ((window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setConnectedWallet(accounts[0]);
        } else {
          setConnectedWallet(null);
          setTokenBalances({});
        }
      };

      const handleChainChanged = (chainId: string) => {
        const newChainId = Number.parseInt(chainId, 16);
        setWalletChainId(newChainId);
        setTokenBalances({});
        setTimeout(() => {
          fetchTokenBalances(true);
        }, 1000);
      };
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if ((window as any).ethereum.removeListener) {
          (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
          (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
      }
  }, []);

  const checkWalletConnection = async () => {
    if ((window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setConnectedWallet(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const fetchTokenBalances = async (forceRefresh = false) => {
    if (!connectedWallet) return;
    if (forceRefresh) {
      setTokenBalances({});
    }
    setBalanceLoading(true);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Balance fetch timeout after 30 seconds')), 30000);
    });
    try {
      await Promise.race([fetchBalancesFromWeb3(), timeoutPromise]);
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
      setTokenBalances({});
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchBalancesFromWeb3 = async () => {
    if (!connectedWallet || !(window as any).ethereum) return;
    try {
      const { BrowserProvider, Contract, isAddress, formatUnits } = await import('ethers');

      // Initialize provider from injected wallet
      const provider = new BrowserProvider((window as any).ethereum);

      // getNetwork().chainId is bigint in ethers v6 – convert safely to number
      const network = await provider.getNetwork();
      const walletChainId = Number(network.chainId);
      const walletNetwork = networkOptions.find((net) => net.chain_id === walletChainId);
      const tokensToFetch = tokensByNetwork[walletChainId] || [];

      if (!walletNetwork || tokensToFetch.length === 0) {
        setTokenBalances({});
        return;
      }

      const balances: Record<string, string> = {};
      try {
        const nativeBalance = await provider.getBalance(connectedWallet);
        const nativeAmount = formatUnits(nativeBalance, 18);
        balances['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'] = parseFloat(nativeAmount).toFixed(6);
      } catch (error) {
        balances['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'] = '0.00';
      }

      const erc20Abi = ['function balanceOf(address owner) view returns (uint256)'];
      for (const token of tokensToFetch) {
        if (token.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') continue;
        if (!isAddress(token.address)) {
          balances[token.address] = '0.00';
          continue;
        }
        try {
          const contract = new Contract(token.address, erc20Abi, provider);
          const balance = await contract.balanceOf(connectedWallet);
          const decimals = token.decimals ?? 18;
          const amount = parseFloat(formatUnits(balance, decimals));
          balances[token.address.toLowerCase()] = amount.toFixed(6);
        } catch (error) {
          balances[token.address.toLowerCase()] = '0.00';
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setTokenBalances(balances);
      setWalletChainId(walletChainId);
    } catch (error) {
      console.error('Web3 balance fetch failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (connectedWallet) {
      fetchTokenBalances();
    } else {
      setTokenBalances({});
      setWalletChainId(null);
    }
  }, [connectedWallet]);

  useEffect(() => {
    if (sellToken && tokenBalances[sellToken.address.toLowerCase()]) {
      setSellToken({
        ...sellToken,
        balance: tokenBalances[sellToken.address.toLowerCase()],
      });
    }
    if (buyToken && tokenBalances[buyToken.address.toLowerCase()]) {
      setBuyToken({
        ...buyToken,
        balance: tokenBalances[buyToken.address.toLowerCase()],
      });
    }
  }, [tokenBalances]);

  const handleMaxClick = (tokenType: 'sell' | 'buy') => {
    const token = tokenType === 'sell' ? sellToken : buyToken;
    if (!token || !token.balance) return;
    const balance = Number.parseFloat(token.balance);
    if (tokenType === 'sell') {
      if (token.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        const maxAmount = Math.max(0, balance - 0.01);
        setSellAmount(maxAmount.toString());
      } else {
        setSellAmount(balance.toString());
      }
    }
  };

  const fetchSupportedNetworks = async () => {
    try {
      console.log('🧪 Testing backend API connection...');
      const response = await apiClient.get('/mtrades/health');
      console.log('✅ Backend health check response:', response);
      showNotification({
        title: 'Backend Connected ✅',
        message: `Backend is healthy - Chain: ${response.chain_id || 'unknown'}`,
        color: 'green',
      });
    } catch (error: any) {
      console.error('❌ Backend connection failed:', error);
      let message = 'Backend unavailable - using fallback configuration';
      if (error.message === 'Unable to connect to server') {
        message = 'Backend server not running. Please start the backend on http://localhost:8000';
      }
      showNotification({
        title: 'Backend Connection Failed ⚠️',
        message,
        color: 'yellow',
      });
    }
  };

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
  }, [sellAmount, sellToken, buyToken, slippage, selectedNetwork]);

  const fetchQuote = async () => {
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
  };

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

  const refreshTransactionStatus = async (transaction_hash: string, chain_id: number) => {
    const status = await checkTransactionStatus(transaction_hash, chain_id);
    if (status && status.status !== 'pending') {
      await fetchTradeHistory();
    }
    return status;
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

  const openTokenSelector = (type: 'sell' | 'buy') => {
    setTokenSelectorType(type);
    setIsTokenSelectorOpen(true);
    setSearchTerm('');
  };

  const selectToken = (token: Token) => {
    if (tokenSelectorType === 'sell') {
      setSellToken(token);
    } else {
      setBuyToken(token);
    }
    setIsTokenSelectorOpen(false);
    setSearchTerm('');
  };

  const handleNetworkChange = (networkId: number) => {
    const network = networkOptions.find((n) => n.chain_id === networkId);
    if (network) {
      setSelectedNetwork(network);
      setSellToken(null);
      setBuyToken(null);
      setSellAmount('');
      setBuyAmount('');
      setQuote(null);
      const tokens = tokensByNetwork[networkId];
      if (tokens) {
        tokens.forEach((token) => {
          token.balance = undefined;
        });
      }
      if (connectedWallet) {
        fetchTokenBalances(true);
      }
    }
  };

  const switchWalletNetwork = async () => {
    if (!(window as any).ethereum || !connectedWallet) {
      showNotification({
        title: 'Wallet Error',
        message: 'No wallet connected or MetaMask not available',
        color: 'red',
      });
      return;
    }

    try {
      const chainIdHex = `0x${selectedNetwork.chain_id.toString(16)}`;
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      showNotification({
        title: 'Network Switched! ✅',
        message: `Successfully switched to ${selectedNetwork.name}`,
        color: 'green',
      });
      setTimeout(() => {
        fetchTokenBalances(true);
      }, 1000);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${selectedNetwork.chain_id.toString(16)}`,
                chainName: selectedNetwork.name,
                nativeCurrency: {
                  name: selectedNetwork.shortName,
                  symbol: selectedNetwork.shortName,
                  decimals: 18,
                },
                rpcUrls: [selectedNetwork.rpc_url],
                blockExplorerUrls: getExplorerUrls(selectedNetwork.chain_id),
              },
            ],
          });
          showNotification({
            title: 'Network Added! ✅',
            message: `Successfully added and switched to ${selectedNetwork.name}`,
            color: 'green',
          });
          setTimeout(() => {
            fetchTokenBalances(true);
          }, 1500);
        } catch (addError: any) {
          showNotification({
            title: 'Network Error',
            message: `Failed to add ${selectedNetwork.name}: ${addError.message}`,
            color: 'red',
          });
        }
      } else {
        showNotification({
          title: 'Network Error',
          message: `Failed to switch to ${selectedNetwork.name}: ${switchError.message}`,
          color: 'red',
        });
      }
    }
  };

  const currentTokens = tokensByNetwork[selectedNetwork.chain_id] || [];
  const filteredTokens = currentTokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
            className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-[#FFFFFF] shadow-2xl dark:bg-gray-800 dark:shadow-none"
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
            <div className="border-b border-gray-200 bg-[#FAFBFC] p-4 shadow-inner dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-[#FAFBFC] py-3 pl-10 pr-4 text-gray-900 transition-all duration-200 focus:border-primary focus:bg-[#FFFFFF] focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>

            {/* Token List */}
            <div className="max-h-96 overflow-y-auto bg-[#FAFBFC] p-2 shadow-inner dark:bg-gray-800 dark:shadow-none">
              {filteredTokens.length > 0 ? (
                <div className="space-y-1">
                  {filteredTokens.map((token) => {
                    const balance = tokenBalances[token.address.toLowerCase()] || '0.00';
                    const isLoading = balanceLoading && !tokenBalances[token.address.toLowerCase()];

                    return (
                      <button
                        key={token.address}
                        onClick={() => selectToken({ ...token, balance })}
                        className="flex w-full items-center justify-between rounded-xl bg-[#FAFBFC] p-4 transition-all duration-200 hover:bg-[#FFFFFF] hover:shadow-sm dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:shadow-none"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-lg">
                            {token.symbol.substring(0, 2)}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {token.symbol}
                            </div>
                            <div className="max-w-32 truncate text-sm text-gray-500 dark:text-gray-400">
                              {token.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {isLoading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
                          ) : (
                            <>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {parseFloat(balance).toFixed(6)}
                              </div>
                              <div className="text-xs text-gray-400">{token.symbol}</div>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mb-3 inline-flex rounded-full bg-gray-100 p-3 dark:bg-gray-700">
                    <Search className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">No tokens found</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-secondary/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className=" bg-[#FFFFFF] dark:bg-boxdark">
        <div className="mx-auto max-w-2xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 text-center"
          >
            <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-medium text-black dark:from-primary dark:to-secondary dark:text-white">
              <Zap className="mr-2 h-4 w-4" />
              Instant Token Swaps
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Swap
              </span>{' '}
              Tokens
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Trade cryptocurrencies instantly with the best rates across multiple networks
            </p>
          </motion.div>

          {/* Header Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchQuote}
                disabled={quoteLoading}
                className="flex items-center space-x-2 rounded-xl bg-white/80 px-4 py-3 font-medium text-gray-700 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl disabled:opacity-50 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
                title="Refresh Quote"
              >
                <RefreshCw className={`h-4 w-4 ${quoteLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={fetchSupportedNetworks}
                className="hidden items-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-primary/90 hover:to-secondary/90 hover:shadow-xl sm:flex"
                title="Test Backend Connection"
              >
                <Shield className="h-4 w-4" />
                <span>Test API</span>
              </button>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-xl bg-white/80 p-3 text-gray-700 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Settings className="h-5 w-5" />
            </button>
          </motion.div>

          {/* Network Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-6 overflow-hidden rounded-2xl bg-[#FFFFFF] shadow-xl dark:bg-gray-800/80 dark:shadow-none"
          >
            <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-semibold">Network</span>
                </div>
                {connectedWallet && (
                  <div className="flex items-center space-x-2 text-sm text-purple-100">
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline">Connected</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#FAFBFC] p-4 shadow-inner dark:bg-gray-800 dark:shadow-none">
              <div className="relative">
                <select
                  value={selectedNetwork.chain_id}
                  onChange={(e) => handleNetworkChange(Number.parseInt(e.target.value))}
                  className="w-full appearance-none rounded-xl border-2 border-gray-200 bg-[#FAFBFC] px-4 py-3 pr-12 font-medium text-gray-900 transition-all duration-200 focus:border-primary focus:bg-[#FFFFFF] focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary"
                >
                  {networkOptions.map((network) => (
                    <option key={network.chain_id} value={network.chain_id}>
                      {network.name} {network.isTestnet ? '(Testnet)' : ''}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400">
                  <ChevronDown className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full ${balanceLoading ? 'animate-pulse bg-yellow-500' : 'bg-green-500'}`}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedNetwork.name}
                    {balanceLoading && ' - Loading balances...'}
                  </span>
                </div>
                {connectedWallet && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="font-mono">
                      {connectedWallet.substring(0, 6)}...
                      {connectedWallet.substring(connectedWallet.length - 4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Wallet Connection Prompt */}
          {!connectedWallet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mb-6 overflow-hidden rounded-2xl bg-[#FFFFFF] shadow-xl dark:bg-gray-800/80 dark:shadow-none"
            >
              <div className="bg-[#FAFBFC] p-6 shadow-inner dark:bg-gray-800 dark:shadow-none">
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Connect Your Wallet
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      Connect your wallet to view token balances and execute trades. Go to the user
                      menu (top right) to connect.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Network Mismatch Warning */}
          {connectedWallet && walletChainId && walletChainId !== selectedNetwork.chain_id && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mb-6 overflow-hidden rounded-2xl bg-[#FFFFFF] shadow-xl dark:bg-gray-800/80 dark:shadow-none"
            >
              <div className="bg-[#FAFBFC] p-6 shadow-inner dark:bg-gray-800 dark:shadow-none">
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                    <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                      Network Mismatch
                    </h4>
                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      Your wallet is on{' '}
                      <span className="font-semibold">
                        {networkOptions.find((n) => n.chain_id === walletChainId)?.name ||
                          `Chain ${walletChainId}`}
                      </span>
                      , but you've selected{' '}
                      <span className="font-semibold">{selectedNetwork.name}</span>.
                    </p>
                    <button
                      onClick={switchWalletNetwork}
                      className="mt-3 inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <span>Switch Network</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Swap Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-6 overflow-hidden rounded-3xl bg-[#FFFFFF] shadow-xl dark:bg-gray-800/80 dark:shadow-none"
          >
            <div className="bg-[#FAFBFC] p-6 shadow-inner dark:bg-gray-800 dark:shadow-none sm:p-8">
              {/* Sell Token */}
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <label className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                    <DollarSign className="mr-2 h-4 w-4" />
                    You Pay
                  </label>
                  <div className="flex items-center space-x-2">
                    {balanceLoading ? (
                      <div className="flex items-center space-x-1">
                        <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Balance:{' '}
                          {sellToken?.balance
                            ? parseFloat(sellToken.balance).toFixed(6)
                            : '0.000000'}{' '}
                          {sellToken?.symbol}
                        </span>
                        {sellToken?.balance && Number.parseFloat(sellToken.balance) > 0 && (
                          <button
                            onClick={() => handleMaxClick('sell')}
                            className="rounded-lg bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-600 transition-colors hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50"
                          >
                            MAX
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 rounded-2xl bg-[#FAFBFC] p-4 shadow-inner dark:bg-gray-700 dark:shadow-none">
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-2xl font-bold text-gray-900 placeholder-gray-400 outline-none dark:text-white dark:placeholder-gray-500"
                  />
                  <button
                    onClick={() => openTokenSelector('sell')}
                    className="flex items-center space-x-3 rounded-2xl bg-white px-4 py-3 shadow-lg transition-all duration-200 hover:shadow-xl dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    {sellToken ? (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-lg">
                          {sellToken.symbol.substring(0, 2)}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {sellToken.symbol}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Select Token</span>
                    )}
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Swap Arrow */}
              <div className="mb-6 flex justify-center">
                <button
                  onClick={swapTokens}
                  className="group rounded-2xl bg-gradient-to-r from-primary to-secondary p-4 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:from-primary/90 hover:to-secondary/90 hover:shadow-xl"
                >
                  <ArrowUpDown className="h-5 w-5 transition-transform group-hover:rotate-180" />
                </button>
              </div>

              {/* Buy Token */}
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <label className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    You Receive
                  </label>
                  <div className="flex items-center space-x-2">
                    {balanceLoading ? (
                      <div className="flex items-center space-x-1">
                        <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Balance:{' '}
                        {buyToken?.balance ? parseFloat(buyToken.balance).toFixed(6) : '0.000000'}{' '}
                        {buyToken?.symbol}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 rounded-2xl bg-[#FAFBFC] p-4 shadow-inner dark:bg-gray-700 dark:shadow-none">
                  <input
                    type="number"
                    value={buyAmount}
                    readOnly
                    placeholder="0.0"
                    className="flex-1 bg-transparent text-2xl font-bold text-gray-900 placeholder-gray-400 outline-none dark:text-white dark:placeholder-gray-500"
                  />
                  <button
                    onClick={() => openTokenSelector('buy')}
                    className="flex items-center space-x-3 rounded-2xl bg-white px-4 py-3 shadow-lg transition-all duration-200 hover:shadow-xl dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    {buyToken ? (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-lg">
                          {buyToken.symbol.substring(0, 2)}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {buyToken.symbol}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Select Token</span>
                    )}
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Quote Loading */}
              {quoteLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-2xl bg-[#FAFBFC] p-4 shadow-inner dark:bg-gray-700 dark:shadow-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      Getting best price...
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Quote Error */}
              {quoteError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-2xl bg-[#FAFBFC] p-4 shadow-inner dark:bg-gray-700 dark:shadow-none"
                >
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      {quoteError}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Quote Information */}
              {quote && !quoteLoading && sellToken && buyToken && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-2xl bg-[#FAFBFC] p-4 shadow-inner dark:bg-gray-700 dark:shadow-none"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Exchange Rate</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        1 {sellToken.symbol} ={' '}
                        {calculateExchangeRate(
                          quote.sell_amount,
                          quote.buy_amount,
                          sellToken.decimals,
                          buyToken.decimals,
                        )}{' '}
                        {buyToken.symbol}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Slippage Tolerance</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {slippage / 100}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Estimated Gas</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {Number.parseInt(quote.estimated_gas || '0').toLocaleString()}
                      </span>
                    </div>
                    {quote.price_impact && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Price Impact</span>
                        <span
                          className={`font-semibold ${
                            Number.parseFloat(quote.price_impact) > 5
                              ? 'text-red-500'
                              : 'text-green-500'
                          }`}
                        >
                          {formatPrice(quote.price_impact)}%
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Swap Button */}
              <button
                onClick={executeSwap}
                disabled={
                  !quote ||
                  loading ||
                  !sellAmount ||
                  !sellToken ||
                  !buyToken ||
                  quoteLoading ||
                  (sellToken &&
                    buyToken &&
                    sellToken.address.toLowerCase() === buyToken.address.toLowerCase())
                }
                className={`group relative w-full overflow-hidden rounded-2xl p-1 shadow-xl transition-all duration-300 ${
                  quote &&
                  sellAmount &&
                  !loading &&
                  sellToken &&
                  buyToken &&
                  !quoteLoading &&
                  !(
                    sellToken &&
                    buyToken &&
                    sellToken.address.toLowerCase() === buyToken.address.toLowerCase()
                  )
                    ? 'bg-gradient-to-r from-primary to-secondary hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] dark:shadow-none'
                    : 'cursor-not-allowed bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <div className="rounded-xl bg-gradient-to-r from-primary to-secondary px-8 py-4 text-center">
                  <div className="flex items-center justify-center space-x-3">
                    {loading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span className="text-lg font-semibold text-white">Swapping...</span>
                      </>
                    ) : !sellToken || !buyToken ? (
                      <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                        Select Tokens
                      </span>
                    ) : sellToken &&
                      buyToken &&
                      sellToken.address.toLowerCase() === buyToken.address.toLowerCase() ? (
                      <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                        Cannot Swap Same Token
                      </span>
                    ) : !sellAmount ? (
                      <span className="text-lg font-semibold text-white">Enter Amount</span>
                    ) : quoteLoading ? (
                      <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                        Getting Quote...
                      </span>
                    ) : !quote ? (
                      <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                        Enter Amount to See Quote
                      </span>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 text-white" />
                        <span className="text-lg font-semibold text-white">
                          Swap {sellToken.symbol} for {buyToken.symbol}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Recent Trades */}
          {tradeHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="overflow-hidden rounded-3xl bg-[#FFFFFF] shadow-xl dark:bg-gray-800/80 dark:shadow-none"
            >
              <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">Recent Trades</span>
                  </div>
                  <button
                    onClick={() => {
                      fetchTradeHistory();
                      if (connectedWallet) {
                        fetchTokenBalances(true);
                      }
                    }}
                    disabled={balanceLoading}
                    className="flex items-center space-x-2 rounded-lg bg-white/20 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${balanceLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#FAFBFC] p-4 shadow-inner dark:bg-gray-800 dark:shadow-none">
                <div className="max-h-80 space-y-3 overflow-y-auto">
                  <AnimatePresence>
                    {tradeHistory.slice(0, 5).map((trade, index) => {
                      // Get token info using the helper function
                      const sellTokenInfo = getTokenInfo(trade.sell_token, trade.chain_id);
                      const buyTokenInfo = getTokenInfo(trade.buy_token, trade.chain_id);

                      const formatAmount = (amount: string, decimals = 18) => {
                        try {
                          const formatted = (
                            Number.parseFloat(amount) / Math.pow(10, decimals)
                          ).toFixed(6);
                          return Number.parseFloat(formatted).toString();
                        } catch {
                          return '0';
                        }
                      };

                      return (
                        <motion.div
                          key={trade.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="rounded-2xl bg-[#FAFBFC] p-4 shadow-sm dark:bg-gray-700 dark:shadow-none"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex min-w-0 flex-1 items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white shadow-lg">
                                  {sellTokenInfo.symbol.substring(0, 2)}
                                </div>
                                <ArrowUpDown className="h-3 w-3 text-gray-400" />
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white shadow-lg">
                                  {buyTokenInfo.symbol.substring(0, 2)}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                  {formatAmount(trade.sell_amount, sellTokenInfo.decimals)}{' '}
                                  {sellTokenInfo.symbol} →{' '}
                                  {formatAmount(trade.buy_amount, buyTokenInfo.decimals)}{' '}
                                  {buyTokenInfo.symbol}
                                </div>
                                <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(trade.created_at).toLocaleDateString()} •{' '}
                                  <span className="hidden sm:inline">
                                    {trade.network_name || `Chain ${trade.chain_id}`}
                                  </span>
                                  <span className="sm:hidden">
                                    {trade.network_name?.split(' ')[0] || `C${trade.chain_id}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-shrink-0 items-center space-x-2">
                              <div
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  trade.status === 'success'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : trade.status === 'failed'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}
                              >
                                {trade.status === 'success' ? (
                                  <Check className="inline h-3 w-3" />
                                ) : trade.status === 'failed' ? (
                                  <X className="inline h-3 w-3" />
                                ) : (
                                  <Clock className="inline h-3 w-3" />
                                )}
                              </div>
                              {trade.status === 'pending' && (
                                <button
                                  onClick={() =>
                                    refreshTransactionStatus(trade.transaction_hash, trade.chain_id)
                                  }
                                  className="rounded-lg bg-yellow-500 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-yellow-600"
                                  title="Check Status"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </button>
                              )}
                              <a
                                href={getExplorerTxUrl(trade.chain_id, trade.transaction_hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg bg-blue-500 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-600"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
                {tradeHistory.length > 5 && (
                  <div className="mt-4 text-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Showing 5 of {tradeHistory.length} trades
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TokenSelector />
      <SettingsModal />
    </div>
  );
};

export default ManualTrade;
