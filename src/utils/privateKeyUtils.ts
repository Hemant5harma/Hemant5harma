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
 * Accepts all formats that SolanaKeyHandler can process:
 * - Base58 encoded (any length)
 * - Hex encoded (any length, with or without 0x prefix)
 * - Base64 encoded
 * - JSON array format [1,2,3,...]
 * - JSON object format {secretKey: [...]}
 * - Comma-separated integers
 */
const validateSolanaPrivateKey = (privateKey: string): PrivateKeyValidation => {
  try {
    const cleanKey = privateKey.trim();
    
    // Empty check
    if (!cleanKey || cleanKey.length < 1) {
      return {
        isValid: false,
        error: 'Private key cannot be empty',
      };
    }

    // Check for JSON array format [1,2,3,...]
    if (cleanKey.startsWith('[') && cleanKey.endsWith(']')) {
      try {
        const arr = JSON.parse(cleanKey);
        if (Array.isArray(arr) && arr.length > 0) {
          return {
            isValid: true,
            formatted: cleanKey,
            type: 'solana',
          };
        }
      } catch {
        // Not valid JSON, continue to other checks
      }
    }

    // Check for JSON object format {secretKey: [...]} or similar
    if (cleanKey.startsWith('{') && cleanKey.endsWith('}')) {
      try {
        const obj = JSON.parse(cleanKey);
        if (typeof obj === 'object' && obj !== null) {
          return {
            isValid: true,
            formatted: cleanKey,
            type: 'solana',
          };
        }
      } catch {
        // Not valid JSON, continue to other checks
      }
    }

    // Check for hex format (with or without 0x prefix, any length)
    let hexKey = cleanKey;
    if (hexKey.startsWith('0x') || hexKey.startsWith('0X')) {
      hexKey = hexKey.slice(2);
    }
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (hexRegex.test(hexKey) && hexKey.length >= 1) {
      return {
        isValid: true,
        formatted: cleanKey,
        type: 'solana',
      };
    }

    // Check for Base64 format
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (base64Regex.test(cleanKey) && cleanKey.length >= 1) {
      return {
        isValid: true,
        formatted: cleanKey,
        type: 'solana',
      };
    }

    // Check for Base58 format (Base58 characters, any reasonable length)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (base58Regex.test(cleanKey) && cleanKey.length >= 1) {
      return {
        isValid: true,
        formatted: cleanKey,
        type: 'solana',
      };
    }

    // Check for comma-separated integers (CSV format)
    if (cleanKey.includes(',')) {
      const parts = cleanKey.split(',');
      if (parts.length > 0 && parts.every(part => {
        const trimmed = part.trim();
        return trimmed === '' || (!isNaN(Number(trimmed)) && Number.isInteger(Number(trimmed)));
      })) {
        return {
          isValid: true,
          formatted: cleanKey,
          type: 'solana',
        };
      }
    }

    // If none of the above, still accept it - let the backend handler decide
    // This allows for any format that SolanaKeyHandler might support
    return {
      isValid: true,
      formatted: cleanKey,
      type: 'solana',
    };
  } catch {
    // Even on error, accept it - backend will validate properly
    return {
      isValid: true,
      formatted: privateKey.trim(),
      type: 'solana',
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
    error: 'Invalid private key format. Must be either:\n• EVM: 64 hex characters (with or without 0x prefix)\n• Solana: Any format (Base58, hex, Base64, JSON array/object, CSV, etc.)',
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
