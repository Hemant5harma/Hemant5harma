/**
 * Address validation and formatting utilities for both EVM and Solana blockchains
 */

// Regular expressions for address validation
const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Validate if an address is a valid EVM address
 */
export const isValidEVMAddress = (address: string): boolean => {
  return EVM_ADDRESS_REGEX.test(address);
};

/**
 * Validate if an address is a valid Solana address
 */
export const isValidSolanaAddress = (address: string): boolean => {
  // Basic format check first
  if (!SOLANA_ADDRESS_REGEX.test(address)) {
    return false;
  }
  
  // Additional checks for common invalid addresses
  if (address.length < 32 || address.length > 44) {
    return false;
  }
  
  return true;
};

/**
 * Detect blockchain type based on chain ID
 */
export const getBlockchainType = (chainId: number): 'evm' | 'solana' | 'unknown' => {
  if (chainId === 900) {
    return 'solana';
  } else if ([1, 137, 42161, 43114, 56, 8453, 10, 10143].includes(chainId)) {
    return 'evm';
  }
  return 'unknown';
};

/**
 * Validate address based on blockchain type
 */
export const isValidAddress = (address: string, chainId: number): boolean => {
  const blockchainType = getBlockchainType(chainId);
  
  switch (blockchainType) {
    case 'evm':
      return isValidEVMAddress(address) || address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    case 'solana':
      return isValidSolanaAddress(address);
    default:
      return false;
  }
};

/**
 * Format address for display (truncate long addresses)
 */
export const formatAddressForDisplay = (address: string, chainId: number): string => {
  const blockchainType = getBlockchainType(chainId);
  
  if (blockchainType === 'solana') {
    // Solana addresses are longer, show more characters
    if (address.length > 20) {
      return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
    }
  } else {
    // EVM addresses
    if (address.length > 15) {
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
  }
  
  return address;
};

/**
 * Get native token address for a given chain
 */
export const getNativeTokenAddress = (chainId: number): string => {
  const blockchainType = getBlockchainType(chainId);
  
  if (blockchainType === 'solana') {
    return 'So11111111111111111111111111111111111111112'; // Wrapped SOL
  } else {
    return '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'; // ETH/native EVM token representation
  }
};

/**
 * Normalize address for comparison (handle case sensitivity)
 */
export const normalizeAddress = (address: string, chainId: number): string => {
  const blockchainType = getBlockchainType(chainId);
  
  if (blockchainType === 'solana') {
    // Solana addresses are case-sensitive
    return address;
  } else {
    // EVM addresses are case-insensitive
    return address.toLowerCase();
  }
};

/**
 * Check if an address represents a native token
 */
export const isNativeToken = (address: string, chainId: number): boolean => {
  const blockchainType = getBlockchainType(chainId);
  
  if (blockchainType === 'solana') {
    return address === 'So11111111111111111111111111111111111111112';
  } else {
    return address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
  }
};

/**
 * Get blockchain network name from chain ID
 */
export const getNetworkName = (chainId: number): string => {
  const networks: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    43114: 'Avalanche',
    56: 'BSC',
    8453: 'Base',
    10: 'Optimism',
    10143: 'Monad Testnet',
    900: 'Solana',
  };
  
  return networks[chainId] || `Unknown (${chainId})`;
};

/**
 * Get explorer URL for an address
 */
export const getAddressExplorerUrl = (address: string, chainId: number): string => {
  const explorers: Record<number, string> = {
    1: `https://etherscan.io/address/${address}`,
    137: `https://polygonscan.com/address/${address}`,
    42161: `https://arbiscan.io/address/${address}`,
    56: `https://bscscan.com/address/${address}`,
    10143: `https://testnet.monadexplorer.com/address/${address}`,
    8453: `https://basescan.org/address/${address}`,
    10: `https://optimistic.etherscan.io/address/${address}`,
    43114: `https://snowtrace.io/address/${address}`,
    900: `https://explorer.solana.com/address/${address}`,
  };
  
  return explorers[chainId] || `https://etherscan.io/address/${address}`;
};

/**
 * Convert amount to display format based on token decimals
 */
export const formatTokenAmount = (
  amount: string | number,
  decimals: number,
  maxDecimals: number = 6
): string => {
  try {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0';
    
    const divisor = Math.pow(10, decimals);
    const formattedAmount = numAmount / divisor;
    
    if (formattedAmount === 0) return '0';
    
    // For very small amounts, use scientific notation
    if (formattedAmount < 0.000001 && formattedAmount > 0) {
      return formattedAmount.toExponential(3);
    }
    
    // For normal amounts, limit decimal places
    const decimalPlaces = Math.min(maxDecimals, decimals);
    return formattedAmount.toFixed(decimalPlaces).replace(/\.?0+$/, '');
  } catch (error) {
    return '0';
  }
};

/**
 * Convert display amount to raw token amount (add decimals)
 */
export const parseTokenAmount = (amount: string, decimals: number): string => {
  try {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '0';
    
    const multiplier = Math.pow(10, decimals);
    const rawAmount = Math.floor(numAmount * multiplier);
    
    return rawAmount.toString();
  } catch (error) {
    return '0';
  }
};

/**
 * Get default decimal places for a blockchain
 */
export const getDefaultDecimals = (chainId: number): number => {
  const blockchainType = getBlockchainType(chainId);
  return blockchainType === 'solana' ? 9 : 18;
};

/**
 * Validate token amount input
 */
export const isValidTokenAmount = (amount: string): boolean => {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0 && numAmount < Infinity;
}; 