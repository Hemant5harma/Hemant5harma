/**
 * Utility functions for private key validation and handling (EVM and Solana)
 */

export interface PrivateKeyValidation {
  isValid: boolean;
  error?: string;
  formatted?: string;
  type?: 'evm' | 'solana';
}

/**
 * Validate an EVM private key format
 */
const validateEVMPrivateKey = (privateKey: string): PrivateKeyValidation => {
  // Remove 0x prefix if present
  const keyWithoutPrefix = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

  // Check length (should be exactly 64 hex characters)
  if (keyWithoutPrefix.length !== 64) {
    return {
      isValid: false,
      error: `EVM private key must be exactly 64 hex characters. Current length: ${keyWithoutPrefix.length}`,
    };
  }

  // Check if all characters are valid hex
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(keyWithoutPrefix)) {
    return {
      isValid: false,
      error: 'EVM private key must contain only hex characters (0-9, a-f, A-F)',
    };
  }

  // Check if it's not all zeros (invalid private key)
  if (keyWithoutPrefix === '0'.repeat(64)) {
    return {
      isValid: false,
      error: 'Invalid private key: cannot be all zeros',
    };
  }

  return {
    isValid: true,
    formatted: keyWithoutPrefix.toLowerCase(),
    type: 'evm',
  };
};

/**
 * Validate a Solana private key format
 */
const validateSolanaPrivateKey = (privateKey: string): PrivateKeyValidation => {
  try {
    // Solana private keys can be:
    // 1. Base58 encoded (common format from wallets)
    // 2. Hex encoded (128 characters for 64 bytes)
    // 3. Array format (comma-separated numbers)

    // Check for hex format (128 chars = 64 bytes)
    if (privateKey.length === 128) {
      const hexRegex = /^[0-9a-fA-F]+$/;
      if (hexRegex.test(privateKey)) {
        return {
          isValid: true,
          formatted: privateKey.toLowerCase(),
          type: 'solana',
        };
      }
    }

    // Check for array format [1,2,3,...]
    if (privateKey.startsWith('[') && privateKey.endsWith(']')) {
      try {
        const arr = JSON.parse(privateKey);
        if (Array.isArray(arr) && (arr.length === 32 || arr.length === 64)) {
          return {
            isValid: true,
            formatted: privateKey,
            type: 'solana',
          };
        }
      } catch {
        return {
          isValid: false,
          error: 'Invalid Solana array format',
        };
      }
    }

    // Check for Base58 format (length typically 44-88 characters)
    if (privateKey.length >= 32 && privateKey.length <= 88) {
      // Basic Base58 character check
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
      if (base58Regex.test(privateKey)) {
        return {
          isValid: true,
          formatted: privateKey,
          type: 'solana',
        };
      }
    }

    return {
      isValid: false,
      error: 'Invalid Solana private key format. Expected Base58 (44-88 chars), hex (128 chars), or array format.',
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid Solana private key format',
    };
  }
};

/**
 * Validate a private key format (supports both EVM and Solana)
 * @param privateKey - The private key to validate
 * @returns Validation result with error message if invalid
 */
export const validatePrivateKey = (privateKey: string): PrivateKeyValidation => {
  if (!privateKey) {
    return {
      isValid: false,
      error: 'Private key cannot be empty',
    };
  }

  // Remove whitespace
  const cleanKey = privateKey.trim();

  // Try EVM format first
  const evmValidation = validateEVMPrivateKey(cleanKey);
  if (evmValidation.isValid) {
    return evmValidation;
  }

  // Try Solana format
  const solanaValidation = validateSolanaPrivateKey(cleanKey);
  if (solanaValidation.isValid) {
    return solanaValidation;
  }

  // If neither format is valid, return the most helpful error
  return {
    isValid: false,
    error: 'Invalid private key format. Must be either:\n• EVM: 64 hex characters (with or without 0x prefix)\n• Solana: Base58 encoded, hex (128 chars), or array format',
  };
};

/**
 * Format a private key by removing 0x prefix and converting to lowercase
 * @param privateKey - The private key to format
 * @returns Formatted private key (64 hex characters, lowercase)
 */
export const formatPrivateKey = (privateKey: string): string => {
  const cleanKey = privateKey.trim();
  const keyWithoutPrefix = cleanKey.startsWith('0x') ? cleanKey.slice(2) : cleanKey;
  return keyWithoutPrefix.toLowerCase();
};

/**
 * Mask a private key for display purposes
 * @param privateKey - The private key to mask
 * @returns Masked private key (shows first 6 and last 4 characters)
 */
export const maskPrivateKey = (privateKey: string): string => {
  if (!privateKey || privateKey.length < 10) {
    return '••••••••••••••••';
  }

  const formatted = formatPrivateKey(privateKey);
  return `${formatted.slice(0, 6)}••••••••••••••••••••••••••••••••••••••••••••••••••••${formatted.slice(-4)}`;
};

/**
 * Check if a string looks like a private key (for input validation)
 * @param input - The input string to check
 * @returns True if the input looks like a private key
 */
export const looksLikePrivateKey = (input: string): boolean => {
  const cleanInput = input.trim().replace(/^0x/, '');
  return cleanInput.length >= 32 && /^[0-9a-fA-F]+$/.test(cleanInput);
};
