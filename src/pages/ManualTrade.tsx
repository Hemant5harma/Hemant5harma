import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../utils/apiClient';
import { showNotification } from '@mantine/notifications';

// Simple SVG Icons
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} text-black dark:text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ArrowsUpDownIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} text-black dark:text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
    />
  </svg>
);

const Cog6ToothIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} text-black dark:text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} text-black dark:text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

// Types
interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  balance?: string;
}

interface Network {
  chain_id: number;
  name: string;
  shortName: string;
  rpc_url: string;
  network_name: string;
  isTestnet?: boolean;
}

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

// Network configurations - backend will handle Infura RPC URLs with API keys
const networkOptions: Network[] = [
  {
    chain_id: 1,
    name: 'Ethereum Mainnet',
    shortName: 'ETH',
    rpc_url: 'https://mainnet.infura.io/v3/INFURA_KEY', // Backend will replace with actual key
    network_name: 'Ethereum Mainnet',
    isTestnet: false,
  },
  {
    chain_id: 137,
    name: 'Polygon',
    shortName: 'MATIC',
    rpc_url: 'https://polygon-mainnet.infura.io/v3/INFURA_KEY', // Backend will replace with actual key
    network_name: 'Polygon',
    isTestnet: false,
  },
  {
    chain_id: 56,
    name: 'Binance Smart Chain',
    shortName: 'BSC',
    rpc_url: 'https://bsc-mainnet.infura.io/v3/INFURA_KEY', // Backend will replace with actual key
    network_name: 'Binance Smart Chain',
    isTestnet: false,
  },
  {
    chain_id: 42161,
    name: 'Arbitrum One',
    shortName: 'ARB',
    rpc_url: 'https://arbitrum-mainnet.infura.io/v3/INFURA_KEY', // Backend will replace with actual key
    network_name: 'Arbitrum One',
    isTestnet: false,
  },
  {
    chain_id: 97,
    name: 'BSC Testnet',
    shortName: 'tBNB',
    rpc_url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    network_name: 'BSC Testnet',
    isTestnet: true,
  },
  {
    chain_id: 10143,
    name: 'Monad Testnet',
    shortName: 'Monad',
    rpc_url: 'https://testnet-rpc.monad.xyz', // Monad doesn't use Infura
    network_name: 'Monad Testnet',
    isTestnet: true,
  },
];

// Real token addresses by network
const tokensByNetwork: Record<number, Token[]> = {
  // Ethereum Mainnet
  1: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xa0b86a33e6441b4dc5029316a4b3d3536adf38f5',
      decimals: 6,
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      decimals: 6,
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      decimals: 8,
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      decimals: 18,
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      decimals: 18,
    },
    {
      symbol: 'LINK',
      name: 'Chainlink',
      address: '0x514910771af9ca656af840dff83e8264ecf986ca',
      decimals: 18,
    },
    {
      symbol: 'UNI',
      name: 'Uniswap',
      address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      decimals: 18,
    },
  ],
  // Polygon
  137: [
    {
      symbol: 'MATIC',
      name: 'Polygon',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      decimals: 6,
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      decimals: 6,
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
      decimals: 8,
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      address: '0x7ceb23fd6f88b48c8f58f96b81b6c2f8f2f8f8f8',
      decimals: 18,
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x8f3cf7ad23cd3cacdbd9735aff958023239c6a063',
      decimals: 18,
    },
  ],
  // Binance Smart Chain
  56: [
    {
      symbol: 'BNB',
      name: 'Binance Coin',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      decimals: 18,
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0x55d398326f99059ff775485246999027b3197955',
      decimals: 18,
    },
    {
      symbol: 'BTCB',
      name: 'Bitcoin BEP20',
      address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
      decimals: 18,
    },
    {
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      decimals: 18,
    },
    {
      symbol: 'CAKE',
      name: 'PancakeSwap',
      address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
      decimals: 18,
    },
  ],
  // Arbitrum One
  42161: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      decimals: 6,
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      decimals: 6,
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      decimals: 8,
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      decimals: 18,
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      decimals: 18,
    },
  ],
  // BSC Testnet
  97: [
    {
      symbol: 'tBNB',
      name: 'Testnet BNB',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18,
    },
    {
      symbol: 'USDT',
      name: 'Tether (testnet)',
      address: '0x7ef95a0fee0dd31b22626fa2e10ee6a223f8a684',
      decimals: 18,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin (testnet)',
      address: '0x64544969ed7ebf5f083679233325356ebe738930',
      decimals: 18,
    },
    {
      symbol: 'BUSD',
      name: 'BUSD (testnet)',
      address: '0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee',
      decimals: 18,
    },
    {
      symbol: 'CAKE',
      name: 'PancakeSwap (testnet)',
      address: '0xfae44cf6309598c2557bb265bf0401d594db97da',
      decimals: 18,
    },
  ],

  // Monad Testnet
  10143: [
    {
      symbol: 'MON',
      name: 'Monad',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18,
    },
    {
      symbol: 'USDC',
      name: 'USDC (testnet)',
      address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
      decimals: 6,
    },
    {
      symbol: 'USDT',
      name: 'USDT (testnet)',
      address: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
      decimals: 6,
    },
    {
      symbol: 'WBTC',
      name: 'WBTC (testnet)',
      address: '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d',
      decimals: 8,
    },
    {
      symbol: 'WSOL',
      name: 'WSOL (testnet)',
      address: '0x5387C85A4965769f6B0Df430638a1388493486F1',
      decimals: 9,
    },
  ],
};

const ManualTrade: React.FC = () => {
  // State management
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networkOptions[4]); // Default to BSC Testnet
  const [sellToken, setSellToken] = useState<Token | null>(null);
  const [buyToken, setBuyToken] = useState<Token | null>(null);
  const [sellAmount, setSellAmount] = useState<string>('');
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(50); // 0.5%
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState<boolean>(false);
  const [tokenSelectorType, setTokenSelectorType] = useState<'sell' | 'buy'>('sell');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [quoteError, setQuoteError] = useState<string>('');

  // New state for balance management
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);

  // Initialize default tokens and fetch trade history
  useEffect(() => {
    const tokens = tokensByNetwork[selectedNetwork.chain_id] || [];
    if (tokens.length >= 2) {
      setSellToken(tokens[0]); // First token (native)
      setBuyToken(tokens[1]); // Second token (usually USDC)
    }
    // Fetch trade history on component mount (only if we have authentication)
    fetchTradeHistory();
  }, [selectedNetwork]);

  // Check wallet connection on component mount and listen for changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkWalletConnection();

    // Listen for account changes
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
        const newChainId = parseInt(chainId, 16);
        console.log('Chain changed to:', newChainId);
        setWalletChainId(newChainId);

        // Clear balances immediately when network changes
        setTokenBalances({});

        // Refresh balances for the new network with a small delay
        setTimeout(() => {
          console.log('Fetching balances for new network:', newChainId);
          fetchTokenBalances(true); // Force refresh - fetchTokenBalances already checks for connectedWallet
        }, 1000);
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);

      // Cleanup listeners
      return () => {
        if ((window as any).ethereum.removeListener) {
          (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
          (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // Check if wallet is connected
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

  // Fetch token balances using Web3 (works with all chains)
  const fetchTokenBalances = async (forceRefresh = false) => {
    if (!connectedWallet) return;

    if (forceRefresh) {
      console.log('Force refreshing balances...');
      setTokenBalances({}); // Clear immediately for force refresh
    }

    setBalanceLoading(true);

    // Add timeout to prevent getting stuck
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Balance fetch timeout after 30 seconds')), 30000);
    });

    try {
      await Promise.race([fetchBalancesFromWeb3(), timeoutPromise]);
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
      // Clear balances on error to avoid showing stale data
      setTokenBalances({});
    } finally {
      setBalanceLoading(false);
    }
  };

  // Fetch balances directly from Web3 (fetches for actual wallet network)
  const fetchBalancesFromWeb3 = async () => {
    if (!connectedWallet || !(window as any).ethereum) {
      console.log('No wallet connected or ethereum not available');
      return;
    }

    try {
      const { BrowserProvider, Contract, isAddress } = await import('ethers');
      const provider = new BrowserProvider((window as any).ethereum);

      // Get the actual wallet network (don't try to change it)
      const network = await provider.getNetwork();
      const walletChainId = Number(network.chainId);

      console.log(`Fetching balances for wallet network: Chain ID ${walletChainId}`);

      // Find the network configuration for the wallet's actual network
      const walletNetwork = networkOptions.find((net) => net.chain_id === walletChainId);
      const tokensToFetch = tokensByNetwork[walletChainId] || [];

      if (!walletNetwork) {
        console.log(`Unsupported network: Chain ID ${walletChainId}`);
        setTokenBalances({});
        return;
      }

      if (tokensToFetch.length === 0) {
        console.log(`No tokens configured for Chain ID ${walletChainId}`);
        setTokenBalances({});
        return;
      }

      const balances: Record<string, string> = {};

      // Get native token balance
      try {
        const nativeBalance = await provider.getBalance(connectedWallet);
        const nativeAmount = parseFloat(nativeBalance.toString()) / Math.pow(10, 18);
        balances['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'] = nativeAmount.toFixed(6);
        console.log(`Native balance: ${nativeAmount.toFixed(6)} ${walletNetwork.shortName}`);
      } catch (error) {
        console.error('Failed to fetch native balance:', error);
        balances['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'] = '0.00';
      }

      // Get ERC20 token balances with minimal ABI
      const erc20Abi = ['function balanceOf(address owner) view returns (uint256)'];

      for (const token of tokensToFetch) {
        if (token.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') continue;

        // Validate token address and skip invalid ones
        if (!isAddress(token.address)) {
          console.error(`Invalid token address: ${token.address}`);
          balances[token.address] = '0.00';
          continue;
        }

        try {
          const contract = new Contract(token.address, erc20Abi, provider);
          const balance = await contract.balanceOf(connectedWallet);
          const decimals = token.decimals || 18;
          const amount = parseFloat(balance.toString()) / Math.pow(10, decimals);
          balances[token.address.toLowerCase()] = amount.toFixed(6);
          console.log(`${token.symbol} balance: ${amount.toFixed(6)}`);
        } catch (error) {
          console.error(`Failed to fetch balance for ${token.symbol} (${token.address}):`, error);
          balances[token.address.toLowerCase()] = '0.00';
        }

        // Add small delay between calls to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setTokenBalances(balances);
      setWalletChainId(walletChainId);
      console.log(`Balance fetching completed successfully for ${walletNetwork.name}`);
    } catch (error) {
      console.error('Web3 balance fetch failed:', error);
      throw error;
    }
  };

  // Fetch token balances only when wallet connects or wallet network changes
  useEffect(() => {
    if (connectedWallet) {
      console.log('Wallet connected, fetching balances...');
      fetchTokenBalances();
    } else {
      // Clear balances when wallet disconnects
      setTokenBalances({});
      setWalletChainId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedWallet]);

  // Update token balances when tokens are selected and balances are available
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenBalances]);

  // Add max button functionality
  const handleMaxClick = (tokenType: 'sell' | 'buy') => {
    const token = tokenType === 'sell' ? sellToken : buyToken;
    if (!token || !token.balance) return;

    const balance = parseFloat(token.balance);
    if (tokenType === 'sell') {
      // For native tokens, leave some for gas
      if (token.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        const maxAmount = Math.max(0, balance - 0.01); // Leave 0.01 for gas
        setSellAmount(maxAmount.toString());
      } else {
        setSellAmount(balance.toString());
      }
    }
  };

  // Fetch supported networks from backend (optional - we already have hardcoded ones)
  const fetchSupportedNetworks = async () => {
    try {
      const response = await apiClient.get('/mtrades/networks');
      console.log('Supported networks from backend:', response);
      // You can use this to validate or extend your hardcoded networks
    } catch (error) {
      console.log('Using hardcoded networks (backend networks unavailable)');
    }
  };

  // Get quote when sell amount or tokens change
  useEffect(() => {
    if (sellAmount && parseFloat(sellAmount) > 0 && sellToken && buyToken) {
      const timeoutId = setTimeout(() => {
        fetchQuote();
      }, 800); // Debounce API calls

      return () => clearTimeout(timeoutId);
    } else {
      setBuyAmount('');
      setQuote(null);
      setQuoteError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellAmount, sellToken, buyToken, slippage, selectedNetwork]);

  const fetchQuote = async () => {
    if (!sellAmount || !sellToken || !buyToken) return;

    // Check if user is trying to swap same token
    if (sellToken.address.toLowerCase() === buyToken.address.toLowerCase()) {
      setQuoteError(
        'Swap not possible - you cannot swap the same token. Please select different tokens.',
      );
      setBuyAmount('');
      setQuote(null);
      return;
    }

    setQuoteLoading(true);
    setQuoteError('');
    try {
      // Safe conversion to Wei to avoid scientific notation
      const sellAmountFloat = parseFloat(sellAmount);
      if (isNaN(sellAmountFloat) || sellAmountFloat <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Use a more precise method to avoid scientific notation
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
        parseFloat(quoteData.buy_amount) / Math.pow(10, buyToken.decimals)
      ).toFixed(6);
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
        title: 'Swap Executed',
        message: `Successfully swapped ${sellAmount} ${sellToken.symbol} for ${buyAmount} ${buyToken.symbol}`,
        color: 'green',
      });

      // Reset form
      setSellAmount('');
      setBuyAmount('');
      setQuote(null);

      // Refresh trade history
      fetchTradeHistory();

      // Check transaction status once after 15 seconds (for fast networks like Monad)
      // Users can manually refresh for updates after this
      if (response.transaction_hash) {
        setTimeout(async () => {
          const status = await checkTransactionStatus(
            response.transaction_hash,
            selectedNetwork.chain_id,
          );
          if (status && status.status !== 'pending') {
            await fetchTradeHistory(); // Refresh if status changed
          }
        }, 15000); // Single check after 15 seconds
      }
    } catch (error) {
      console.error('Failed to execute swap:', error);
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
      // Don't show error notification for trade history - it's not critical
      // User might not be authenticated or backend might be down
      setTradeHistory([]); // Set empty array so UI doesn't break
    }
  };

  const checkTransactionStatus = async (transaction_hash: string, chain_id: number) => {
    try {
      const network = networkOptions.find((net) => net.chain_id === chain_id);
      if (!network) {
        console.error('Network not found for chain ID:', chain_id);
        return null;
      }

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
      // Only refresh trade history if status actually changed
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
  };

  const selectToken = (token: Token) => {
    if (tokenSelectorType === 'sell') {
      setSellToken(token);
    } else {
      setBuyToken(token);
    }
    setIsTokenSelectorOpen(false);
  };

  const handleNetworkChange = (networkId: number) => {
    const network = networkOptions.find((n) => n.chain_id === networkId);
    if (network) {
      setSelectedNetwork(network);

      // Clear previous token selections and balances
      setSellToken(null);
      setBuyToken(null);
      setSellAmount('');
      setBuyAmount('');
      setQuote(null);

      // Clear all token balances
      const tokens = tokensByNetwork[networkId];
      if (tokens) {
        tokens.forEach((token) => {
          token.balance = undefined;
        });
      }

      // Fetch fresh balances if wallet is connected
      if (connectedWallet) {
        fetchTokenBalances(true);
      }
    }
  };

  // Switch wallet network to match selected network
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

      // Try to switch to the network
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });

      showNotification({
        title: 'Network Switched',
        message: `Successfully switched to ${selectedNetwork.name}`,
        color: 'green',
      });

      // Just refresh balances after successful switch
      setTimeout(() => {
        fetchTokenBalances(true);
      }, 1000);
    } catch (switchError: any) {
      // If the network doesn't exist in the wallet, try to add it
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
            title: 'Network Added',
            message: `Successfully added and switched to ${selectedNetwork.name}`,
            color: 'green',
          });

          // Just refresh balances after successful addition
          setTimeout(() => {
            fetchTokenBalances(true);
          }, 1500);
        } catch (addError: any) {
          console.error('Error adding network:', addError);
          showNotification({
            title: 'Network Error',
            message: `Failed to add ${selectedNetwork.name}: ${addError.message}`,
            color: 'red',
          });
        }
      } else {
        console.error('Error switching network:', switchError);
        showNotification({
          title: 'Network Error',
          message: `Failed to switch to ${selectedNetwork.name}: ${switchError.message}`,
          color: 'red',
        });
      }
    }
  };

  // Helper function to get explorer URLs for network addition
  const getExplorerUrls = (chainId: number): string[] => {
    const explorers: Record<number, string[]> = {
      1: ['https://etherscan.io'],
      137: ['https://polygonscan.com'],
      42161: ['https://arbiscan.io'],
      56: ['https://bscscan.com'],
      97: ['https://testnet.bscscan.com'],
      10143: ['https://testnet.monadexplorer.com'],
    };
    return explorers[chainId] || ['https://etherscan.io'];
  };

  // Get current network tokens
  const currentTokens = tokensByNetwork[selectedNetwork.chain_id] || [];

  const TokenSelector = () => (
    <AnimatePresence>
      {isTokenSelectorOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setIsTokenSelectorOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="mx-4 max-h-96 w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 dark:bg-boxdark"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black dark:text-white">Select a token</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">{selectedNetwork.name}</span>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {currentTokens.map((token) => {
                const balance = tokenBalances[token.address.toLowerCase()] || '0.00';
                const isLoading = balanceLoading && !tokenBalances[token.address.toLowerCase()];

                return (
                  <button
                    key={token.address}
                    onClick={() => selectToken({ ...token, balance })}
                    className="flex w-full items-center justify-between rounded-xl p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-sm font-bold text-white">
                        {token.symbol.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-black dark:text-white">{token.symbol}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {isLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
                      ) : (
                        <div className="text-sm font-medium text-black dark:text-white">{balance}</div>
                      )}
                      {connectedWallet && (
                        <div className="text-xs text-gray-400">{token.symbol}</div>
                      )}
                    </div>
                  </button>
                );
              })}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setIsSettingsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 dark:bg-boxdark"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">Swap Settings</h3>

            {/* Slippage Settings */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">Slippage Tolerance</label>
              <div className="mb-2 flex space-x-2">
                {[10, 50, 100, 300].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      slippage === value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                    }`}
                  >
                    {value / 100}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={slippage / 100}
                onChange={(e) => setSlippage(parseFloat(e.target.value) * 100)}
                className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 text-black dark:text-white"
                placeholder="Custom %"
                step="0.01"
                min="0.01"
                max="50"
              />
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 dark:bg-boxdark-2">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Swap</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchQuote}
              disabled={quoteLoading}
              className="rounded-lg border bg-white p-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-boxdark dark:hover:bg-gray-700"
              title="Refresh Quote"
            >
              <RefreshIcon className={`h-5 w-5 text-black dark:text-white ${quoteLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={fetchSupportedNetworks}
              className="rounded-lg bg-blue-500 px-3 py-2 text-xs text-white transition-colors hover:bg-blue-600"
              title="Test Backend Connection"
            >
              Test API
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-lg border bg-white p-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-boxdark dark:hover:bg-gray-700"
            >
              <Cog6ToothIcon className="h-5 w-5 text-black dark:text-white" />
            </button>
          </div>
        </div>
 
        {/* Network Selector */}
        <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-boxdark">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium">Network</label>
            {connectedWallet && (
              <div className="text-xs text-gray-500 dark:text-gray-400">Web3 Balance Fetching</div>
            )}
          </div>
          <select
            value={selectedNetwork.chain_id}
            onChange={(e) => handleNetworkChange(parseInt(e.target.value))}
            className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {networkOptions.map((network) => (
              <option key={network.chain_id} value={network.chain_id}>
                {network.name} {network.isTestnet ? '(Testnet)' : ''}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`h-2 w-2 rounded-full ${balanceLoading ? 'animate-pulse bg-yellow-500' : 'bg-green-500'}`}
              ></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedNetwork.name} {selectedNetwork.isTestnet ? '(Testnet)' : ''}
                {balanceLoading && ' - Fetching balances...'}
              </span>
            </div>
            {connectedWallet && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>
                  {connectedWallet.substring(0, 6)}...
                  {connectedWallet.substring(connectedWallet.length - 4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Wallet Connection Prompt */}
        {!connectedWallet && (
          <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                <svg
                  className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Connect Your Wallet
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Connect your wallet to view token balances and execute trades. Go to the user menu
                  (top right) to connect.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Network Mismatch Warning */}
        {connectedWallet && walletChainId && walletChainId !== selectedNetwork.chain_id && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <div className="flex flex-1 items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <svg
                    className="h-4 w-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">Network Mismatch</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your wallet is on{' '}
                    {networkOptions.find((n) => n.chain_id === walletChainId)?.name ||
                      `Chain ${walletChainId}`}
                    , but you've selected {selectedNetwork.name}. Balances shown are for your
                    wallet's current network.
                  </p>
                </div>
              </div>
              <button
                onClick={switchWalletNetwork}
                className="ml-3 flex flex-shrink-0 items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                title={`Switch wallet to ${selectedNetwork.name}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l4-4"
                  />
                </svg>
                <span>Switch Network</span>
              </button>
            </div>
          </div>
        )}

        {/* Swap Interface */}
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-boxdark">
          {/* Sell Token */}
          <div className="mb-2">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                You pay
              </label>
              <div className="flex items-center space-x-2">
                {balanceLoading ? (
                  <div className="flex items-center space-x-1">
                    <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Balance: {sellToken?.balance || '0.00'}
                    </span>
                    {sellToken?.balance && parseFloat(sellToken.balance) > 0 && (
                      <button
                        onClick={() => handleMaxClick('sell')}
                        className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800"
                      >
                        MAX
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 border-none bg-transparent text-2xl font-semibold outline-none dark:text-white"
              />
              <button
                onClick={() => openTokenSelector('sell')}
                className="flex items-center space-x-2 rounded-xl border bg-white px-4 py-2 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {sellToken ? (
                  <>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-xs font-bold text-white">
                      {sellToken.symbol.charAt(0)}
                    </div>
                    <span className="font-medium text-black dark:text-white">{sellToken.symbol}</span>
                  </>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">Select token</span>
                )}
                <ChevronDownIcon className="h-4 w-4 text-black dark:text-white" />
              </button>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="my-4 flex justify-center">
            <button
              onClick={swapTokens}
              className="rounded-xl border-4 border-white bg-gray-100 p-3 transition-colors hover:bg-gray-200 dark:border-boxdark dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <ArrowsUpDownIcon className="h-5 w-5 text-black dark:text-white" />
            </button>
          </div>

          {/* Buy Token */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                You receive
              </label>
              <div className="flex items-center space-x-2">
                {balanceLoading ? (
                  <div className="flex items-center space-x-1">
                    <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Balance: {buyToken?.balance || '0.00'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
              <input
                type="number"
                value={buyAmount}
                readOnly
                placeholder="0.0"
                className="flex-1 border-none bg-transparent text-2xl font-semibold outline-none dark:text-white"
              />
              <button
                onClick={() => openTokenSelector('buy')}
                className="flex items-center space-x-2 rounded-xl border bg-white px-4 py-2 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {buyToken ? (
                  <>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-xs font-bold text-white">
                      {buyToken.symbol.charAt(0)}
                    </div>
                    <span className="font-medium text-black dark:text-white">{buyToken.symbol}</span>
                  </>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">Select token</span>
                )}
                <ChevronDownIcon className="h-4 w-4 text-black dark:text-white" />
              </button>
            </div>
          </div>

          {/* Quote Information */}
          {quoteLoading && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Getting best price...
                </span>
              </div>
            </div>
          )}

          {quoteError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <span className="text-sm text-red-700 dark:text-red-300">{quoteError}</span>
            </div>
          )}

          {quote && !quoteLoading && (
            <div className="mb-6 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Exchange Rate</span>
                  <span className="font-medium text-black dark:text-white">
                    1 {sellToken?.symbol} = {parseFloat(quote.price).toFixed(6)} {buyToken?.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Slippage Tolerance</span>
                  <span className="font-medium text-black dark:text-white">{slippage / 100}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Estimated Gas</span>
                  <span className="font-medium text-black dark:text-white">
                    {parseInt(quote.estimated_gas).toLocaleString()}
                  </span>
                </div>
                {quote.price_impact && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Price Impact</span>
                    <span
                      className={`font-medium ${parseFloat(quote.price_impact) > 5 ? 'text-red-500' : 'text-green-500'}`}
                    >
                      {quote.price_impact}%
                    </span>
                  </div>
                )}
              </div>
            </div>
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
            className={`w-full rounded-2xl py-4 text-lg font-semibold transition-all ${
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
                ? 'transform bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:scale-[1.02] hover:from-blue-600 hover:to-purple-600 hover:shadow-xl'
                : 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Swapping...</span>
              </div>
            ) : !sellToken || !buyToken ? (
              'Select tokens'
            ) : sellToken &&
              buyToken &&
              sellToken.address.toLowerCase() === buyToken.address.toLowerCase() ? (
              'Cannot swap same token'
            ) : !sellAmount ? (
              'Enter amount'
            ) : quoteLoading ? (
              'Getting quote...'
            ) : !quote ? (
              'Enter amount to see quote'
            ) : (
              `Swap ${sellToken.symbol} for ${buyToken.symbol}`
            )}
          </button>
        </div>

        {/* Recent Trades */}
        {tradeHistory.length > 0 && (
          <div className="rounded-2xl border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-boxdark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center text-lg font-semibold text-black dark:text-white">
                <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
                Recent Trades
              </h3>
              <button
                onClick={() => {
                  fetchTradeHistory();
                  if (connectedWallet) {
                    fetchTokenBalances(true); // Force refresh balances
                  }
                }}
                disabled={balanceLoading}
                className="flex items-center space-x-1 rounded-lg bg-gray-200 px-3 py-1 text-xs text-black transition-colors hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                title="Refresh Trades & Balances"
              >
                <span className={balanceLoading ? 'animate-spin' : ''}>↻</span>
                <span>Refresh</span>
              </button>
            </div>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {tradeHistory.slice(0, 5).map((trade) => {
                const sellTokenInfo = Object.values(tokensByNetwork)
                  .flat()
                  .find((t) => t.address.toLowerCase() === trade.sell_token.toLowerCase());
                const buyTokenInfo = Object.values(tokensByNetwork)
                  .flat()
                  .find((t) => t.address.toLowerCase() === trade.buy_token.toLowerCase());

                // Get the correct explorer URL based on chain_id
                const getExplorerUrl = (chainId: number, txHash: string) => {
                  const explorers: Record<number, string> = {
                    1: `https://etherscan.io/tx/${txHash}`,
                    137: `https://polygonscan.com/tx/${txHash}`,
                    42161: `https://arbiscan.io/tx/${txHash}`,
                    56: `https://bscscan.com/tx/${txHash}`,
                    97: `https://testnet.bscscan.com/tx/${txHash}`,
                    10143: `https://testnet.monadexplorer.com/tx/${txHash}`,
                  };
                  return explorers[chainId] || `https://etherscan.io/tx/${txHash}`;
                };

                const formatAmount = (amount: string, decimals: number = 18) => {
                  try {
                    const formatted = (parseFloat(amount) / Math.pow(10, decimals)).toFixed(4);
                    return parseFloat(formatted).toString(); // Remove trailing zeros
                  } catch {
                    return '0';
                  }
                };

                return (
                  <div
                    key={trade.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      {/* Trade Info - Compact */}
                      <div className="flex min-w-0 flex-1 items-center space-x-3">
                        {/* Token Icons - Smaller */}
                        <div className="flex items-center space-x-1">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-xs font-bold text-white">
                            {sellTokenInfo?.symbol.charAt(0) || '?'}
                          </div>
                          <span className="text-xs text-gray-400">→</span>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-green-600 text-xs font-bold text-white">
                            {buyTokenInfo?.symbol.charAt(0) || '?'}
                          </div>
                        </div>

                        {/* Trade Details - More Compact */}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {formatAmount(trade.sell_amount, sellTokenInfo?.decimals)}{' '}
                            {sellTokenInfo?.symbol} →{' '}
                            {formatAmount(trade.buy_amount, buyTokenInfo?.decimals)}{' '}
                            {buyTokenInfo?.symbol}
                          </div>
                          <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {new Date(trade.created_at).toLocaleDateString()} •{' '}
                            {trade.network_name || `Chain ${trade.chain_id}`}
                          </div>
                        </div>
                      </div>

                      {/* Status and Action - Compact */}
                      <div className="flex flex-shrink-0 items-center space-x-2">
                        <div
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            trade.status === 'success'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : trade.status === 'failed'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}
                        >
                          {trade.status === 'success'
                            ? '✓'
                            : trade.status === 'failed'
                              ? '✗'
                              : '⏳'}
                        </div>

                        {/* Refresh button for pending transactions */}
                        {trade.status === 'pending' && (
                          <button
                            onClick={() =>
                              refreshTransactionStatus(trade.transaction_hash, trade.chain_id)
                            }
                            className="rounded bg-yellow-500 px-2 py-1 text-xs text-white transition-colors hover:bg-yellow-600"
                            title="Check Status"
                          >
                            ↻
                          </button>
                        )}

                        <a
                          href={getExplorerUrl(trade.chain_id, trade.transaction_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-blue-500 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show more trades hint */}
            {tradeHistory.length > 5 && (
              <div className="mt-3 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing 5 of {tradeHistory.length} trades
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TokenSelector />
      <SettingsModal />
    </div>
  );
};

export default ManualTrade;
