/**
 * Utility functions for private key validation and handling
 */

export interface PrivateKeyValidation {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

/**
 * Validate a private key format
 * @param privateKey - The private key to validate
 * @returns Validation result with error message if invalid
 */
export const validatePrivateKey = (privateKey: string): PrivateKeyValidation => {
  if (!privateKey) {
    return {
      isValid: false,
      error: 'Private key cannot be empty'
    };
  }

  // Remove whitespace
  const cleanKey = privateKey.trim();

  // Remove 0x prefix if present
  const keyWithoutPrefix = cleanKey.startsWith('0x') ? cleanKey.slice(2) : cleanKey;

  // Check length (should be exactly 64 hex characters)
  if (keyWithoutPrefix.length !== 64) {
    return {
      isValid: false,
      error: `Private key must be exactly 64 hex characters. Current length: ${keyWithoutPrefix.length}`
    };
  }

  // Check if all characters are valid hex
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(keyWithoutPrefix)) {
    return {
      isValid: false,
      error: 'Private key must contain only hex characters (0-9, a-f, A-F)'
    };
  }

  // Check if it's not all zeros (invalid private key)
  if (keyWithoutPrefix === '0'.repeat(64)) {
    return {
      isValid: false,
      error: 'Invalid private key: cannot be all zeros'
    };
  }

  return {
    isValid: true,
    formatted: keyWithoutPrefix.toLowerCase()
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