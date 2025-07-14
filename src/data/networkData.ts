// Types
export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  balance?: string;
}

export interface Network {
  chain_id: number;
  name: string;
  shortName: string;
  rpc_url: string;
  network_name: string;
  isTestnet?: boolean;
}

// Network configurations - backend will handle Infura RPC URLs with API keys
export const networkOptions: Network[] = [
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
    chain_id: 10143,
    name: 'Monad Testnet',
    shortName: 'MON',
    rpc_url: 'https://testnet-rpc.monad.xyz', // Monad doesn't use Infura
    network_name: 'Monad Testnet',
    isTestnet: true,
  },
  {
    chain_id: 8453,
    name: 'Base',
    shortName: 'ETH',
    rpc_url: 'https://base-mainnet.infura.io/v3/INFURA_KEY',
    network_name: 'Base',
    isTestnet: false,
  },
  {
    chain_id: 10,
    name: 'Optimism',
    shortName: 'ETH',
    rpc_url: 'https://optimism-mainnet.infura.io/v3/INFURA_KEY',
    network_name: 'Optimism',
    isTestnet: false,
  },
  {
    chain_id: 43114,
    name: 'Avalanche',
    shortName: 'AVAX',
    rpc_url: 'https://avalanche-mainnet.infura.io/v3/INFURA_KEY',
    network_name: 'Avalanche',
    isTestnet: false,
  },
];

// Real token addresses by network
export const tokensByNetwork: Record<number, Token[]> = {
  // Ethereum Mainnet
  1: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18,
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
  // Base
  8453: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      decimals: 6,
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0xfde4c96c8593536e31f229ea441861537e2fe8b0',
      decimals: 6,
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      address: '0x4200000000000000000000000000000000000006',
      decimals: 18,
    },
  ],
  // Optimism
  10: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
      decimals: 6,
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
      decimals: 6,
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      address: '0x4200000000000000000000000000000000000006',
      decimals: 18,
    },
  ],
  // Avalanche
  43114: [
    {
      symbol: 'AVAX',
      name: 'Avalanche',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
      decimals: 6,
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      address: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
      decimals: 6,
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      address: '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab',
      decimals: 18,
    },
  ],
};

// Helper function to get explorer URLs for network addition
export const getExplorerUrls = (chainId: number): string[] => {
  const explorers: Record<number, string[]> = {
    1: ['https://etherscan.io'],
    137: ['https://polygonscan.com'],
    42161: ['https://arbiscan.io'],
    56: ['https://bscscan.com'],
    10143: ['https://testnet.monadexplorer.com'],
    8453: ['https://basescan.org'],
    10: ['https://optimistic.etherscan.io'],
    43114: ['https://snowtrace.io'],
  };
  return explorers[chainId] || ['https://etherscan.io'];
};

// Helper function to get explorer transaction URL
export const getExplorerTxUrl = (chainId: number, txHash: string): string => {
  const explorers: Record<number, string> = {
    1: `https://etherscan.io/tx/${txHash}`,
    137: `https://polygonscan.com/tx/${txHash}`,
    42161: `https://arbiscan.io/tx/${txHash}`,
    56: `https://bscscan.com/tx/${txHash}`,
    10143: `https://testnet.monadexplorer.com/tx/${txHash}`,
    8453: `https://basescan.org/tx/${txHash}`,
    10: `https://optimistic.etherscan.io/tx/${txHash}`,
    43114: `https://snowtrace.io/tx/${txHash}`,
  };
  return explorers[chainId] || `https://etherscan.io/tx/${txHash}`;
};
