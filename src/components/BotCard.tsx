import { Link } from 'react-router-dom';
import SparklineChart from './SparklineChart';

interface Bot {
  id: number;
  user_id: number;
  name: string;
  frequency: string;
  status: string;
  chain_id: number;
  network_name?: string;
  next_execution_time: string | null;
  coins: {
    id: number;
    bot_id: number;
    token_address: string;
    amount: number;
    threshold: number;
  }[];
  performance: {
    total_trades: number;
    total_volume: number;
    apy: number;
    three_month_perf: number;
    six_month_perf: number;
    total_perf: number;
  };
}

// Network options to map chain_id to network name
const networkOptions = [
  { value: 1, label: 'Ethereum Mainnet', shortName: 'Ethereum', color: 'blue' },
  { value: 137, label: 'Polygon', shortName: 'Polygon', color: 'purple' },
  { value: 56, label: 'Binance Smart Chain', shortName: 'BNB Chain', color: 'yellow' },
  { value: 10143, label: 'Monad Testnet', shortName: 'Monad', color: 'gray' },
  { value: 900, label: 'Solana', shortName: 'Solana', color: 'purple' },
  { value: 42161, label: 'Arbitrum', shortName: 'Arbitrum', color: 'blue' },
];

// Token address to name mapping
const tokenAddressToName: Record<string, { symbol: string; name: string; logo?: string }> = {
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

  // Solana Mainnet
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana' },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether' },
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

// Generate sparkline data based on performance
const generateSparklineData = (perf: number) => {
  const data = [];
  const direction = perf >= 0 ? -1 : 1; // Negative for upward trend in chart
  const volatility = Math.max(2, Math.abs(perf) / 5);
  
  let value = 50;
  for (let i = 0; i < 26; i++) {
    const randomWalk = (Math.random() - 0.5) * volatility;
    const trend = direction * (Math.abs(perf) / 100) * 0.5;
    const change = randomWalk + trend;
    value = Math.max(5, Math.min(95, value + change));
    data.push(value);
  }

  return data;
};

export default function BotCard({ bot }: { bot: Bot }) {
  const network = networkOptions.find((n) => n.value === bot.chain_id) || {
    label: `Chain ${bot.chain_id}`,
    shortName: `Chain ${bot.chain_id}`,
    color: 'gray',
  };
  const networkDisplayName = bot.network_name || network.shortName;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400';
      case 'stopped':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400';
    }
  };

  const getNetworkColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400';
      case 'purple':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400';
    }
  };

  const sparklineData = generateSparklineData(bot.performance?.total_perf || 0);
  const chartColor = (bot.performance?.total_perf || 0) >= 0 ? '#10B981' : '#EF4444';
  const trend = (bot.performance?.total_perf || 0) >= 0 ? 'up' : 'down';
  const thirtyDayPerf = bot.performance?.three_month_perf || 0;

  return (
    <Link to={`/bot-details/${bot.id}`} className="block">
      <div className="flex flex-col bg-white dark:bg-[#181a2e] rounded-xl p-5 gap-4 border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300">
        {/* Header with Status Badge */}
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{bot.name}</h3>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(bot.status)}`}>
            {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
          </span>
        </div>

        {/* Frequency and Network */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400">Frequency</span>
            <span className="text-gray-800 dark:text-gray-200 font-medium">{bot.frequency}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400">Network</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${getNetworkColor(network.color)}`}
            >
            {networkDisplayName}
          </span>
        </div>
        </div>

        {/* Sparkline Chart */}
        <div className="h-16">
          <SparklineChart data={sparklineData} color={chartColor} trend={trend} height={64} width={100} />
          </div>

        {/* Performance Metrics */}
        <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
          <div>
            <span className="text-gray-500 dark:text-gray-400">APY</span>
            <p
              className={`text-base font-bold ${
                (bot.performance?.apy || 0) >= 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
              }`}
            >
              {(bot.performance?.apy || 0).toFixed(1)}%
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">30d</span>
            <p
              className={`text-base font-bold ${
                thirtyDayPerf >= 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
              }`}
            >
              {thirtyDayPerf >= 0 ? '+' : ''}
              {thirtyDayPerf.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Token Allocation */}
        {bot.coins && bot.coins.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Allocation:</span>
            <div className="flex -space-x-2">
              {bot.coins.slice(0, 3).map((coin) => {
              const tokenInfo = getTokenInfo(coin.token_address);
              return (
                <div
                  key={coin.id}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#181a2e] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white"
                    title={tokenInfo.name}
                  >
                    {tokenInfo.symbol.substring(0, 2)}
                  </div>
                );
              })}
              {bot.coins.length > 3 && (
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#181a2e] bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">
                  +{bot.coins.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
    </Link>
  );
}
