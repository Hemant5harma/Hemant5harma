import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import BotCard from '../components/BotCard';
import { fetchBots } from '../utils/apiClient';

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
  '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea': { symbol: 'USDC', name: 'USDC (testnet)' },
  '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D': { symbol: 'USDT', name: 'USDT (testnet)' },
  '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d': { symbol: 'WBTC', name: 'WBTC (testnet)' },
  '0xB5a30b0FDc42e3E9760Cb8449Fb37': { symbol: 'WETH', name: 'WETH (testnet)' },
  '0x5387C85A4965769f6B0Df430638a1388493486F1': { symbol: 'WSOL', name: 'WSOL (testnet)' },

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

export default function ManageBots() {
  const [bots, setBots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      setIsLoading(true);
      const fetchedBots = await fetchBots();
      setBots(fetchedBots);
    } catch (error) {
      console.error('Failed to fetch bots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBots = useMemo(() => {
    if (!searchTerm) return bots;
    return bots.filter(
      (bot) =>
        bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bot.network_name && bot.network_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        bot.coins.some((coin: any) => {
          const tokenInfo = getTokenInfo(coin.token_address);
          return (
            tokenInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tokenInfo.symbol.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }),
    );
  }, [bots, searchTerm]);

  return (
    <div className="w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-gray-900 dark:text-white text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
          Manage Bots
        </h1>
        <Link
          to="/bots/dca"
          className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 sm:h-11 bg-primary hover:bg-primary/90 text-white gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold leading-normal tracking-[0.015em] px-3 sm:px-4 transition-colors min-h-[44px] touch-manipulation w-full sm:w-auto"
        >
          <span className="material-symbols-outlined text-base filled">add</span>
          <span className="truncate">New Bot</span>
        </Link>
      </header>

      {/* Search */}
      <div className="mb-6 sm:mb-8">
        <label className="flex flex-col w-full">
          <div className="relative flex w-full flex-1 items-stretch rounded-lg h-11 sm:h-12">
            <div className="text-gray-400 dark:text-[#9399c8] pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 sm:pl-4">
              <span className="material-symbols-outlined text-lg sm:text-xl">search</span>
            </div>
            <input
              type="text"
              placeholder="Search bots by name, network, or asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#242847] h-full placeholder:text-gray-400 dark:placeholder:text-[#9399c8] pl-10 sm:pl-12 pr-3 sm:pr-4 text-sm sm:text-base font-normal leading-normal"
            />
          </div>
        </label>
      </div>

      {/* Bot Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col bg-white dark:bg-[#181a2e] rounded-xl p-5 gap-4 border border-gray-200 dark:border-gray-800 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="h-6 w-3/5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-1/5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
                <div className="space-y-2 w-1/3">
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-2 w-1/3">
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-1/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex -space-x-2">
                  <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-[#181a2e]"></div>
                  <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-[#181a2e]"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBots.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {filteredBots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      ) : (
        <div className="w-full text-center py-12 sm:py-16 lg:py-24 px-4">
          <div className="inline-flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 dark:bg-primary/20 mb-4 sm:mb-6">
            <span className="material-symbols-outlined text-primary dark:text-blue-300 text-3xl sm:text-4xl">
              smart_toy
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            You haven't created any bots yet.
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">
            Get started by creating a new trading bot.
          </p>
          <Link
            to="/bots/dca"
            className="flex mx-auto cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 sm:h-11 bg-primary hover:bg-primary/90 text-white gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold leading-normal tracking-[0.015em] px-3 sm:px-4 transition-colors min-h-[44px] touch-manipulation max-w-xs"
          >
            <span className="material-symbols-outlined text-base filled">add</span>
            <span className="truncate">Create New Bot</span>
          </Link>
        </div>
      )}
    </div>
  );
}
