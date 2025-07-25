import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { isValidAddress, getBlockchainType, formatAddressForDisplay } from '../utils/addressUtils';

interface BlockchainAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  chainId: number;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const BlockchainAddressInput: React.FC<BlockchainAddressInputProps> = ({
  value,
  onChange,
  chainId,
  placeholder,
  label,
  disabled = false,
  className = '',
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  
  const blockchainType = getBlockchainType(chainId);
  
  useEffect(() => {
    if (value.trim()) {
      const valid = isValidAddress(value, chainId);
      setIsValid(valid);
      setShowValidation(true);
    } else {
      setIsValid(null);
      setShowValidation(false);
    }
  }, [value, chainId]);

  const getPlaceholderText = () => {
    if (placeholder) return placeholder;
    
    switch (blockchainType) {
      case 'solana':
        return 'Enter Solana address (44 characters)';
      case 'evm':
        return 'Enter 0x address (42 characters)';
      default:
        return 'Enter token address';
    }
  };

  const getValidationMessage = () => {
    if (!showValidation || isValid === null) return null;
    
    if (isValid) {
      return (
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
          <Check className="h-4 w-4" />
          <span className="text-xs">Valid {blockchainType.toUpperCase()} address</span>
        </div>
      );
    } else {
      const expectedFormat = blockchainType === 'solana' 
        ? 'Expected: 32-44 character Solana address' 
        : 'Expected: 0x followed by 40 hex characters';
        
      return (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <X className="h-4 w-4" />
          <span className="text-xs">{expectedFormat}</span>
        </div>
      );
    }
  };

  const getBorderColor = () => {
    if (!showValidation) return 'border-gray-200 dark:border-gray-600';
    if (isValid) return 'border-green-300 dark:border-green-600';
    return 'border-red-300 dark:border-red-600';
  };

  const getIconColor = () => {
    if (blockchainType === 'solana') return 'text-purple-500';
    return 'text-blue-500';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
          <AlertCircle className={`mr-2 h-4 w-4 ${getIconColor()}`} />
          {label}
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            ({blockchainType.toUpperCase()})
          </span>
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={getPlaceholderText()}
          disabled={disabled}
          className={`w-full rounded-xl border-2 bg-[#FAFBFC] px-4 py-3 pr-12 text-gray-900 transition-all duration-200 focus:bg-[#FFFFFF] focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:focus:bg-gray-700 ${getBorderColor()}`}
          spellCheck={false}
          autoComplete="off"
        />
        
        {/* Validation Icon */}
        {showValidation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
          </div>
        )}
      </div>
      
      {/* Validation Message */}
      {getValidationMessage()}
      
      {/* Address Preview */}
      {value && isValid && (
        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Preview: {formatAddressForDisplay(value, chainId)}
          </div>
        </div>
      )}
      
      {/* Blockchain Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {blockchainType === 'solana' && (
          <span>✨ Solana blockchain - Supports Jupiter DEX aggregation</span>
        )}
        {blockchainType === 'evm' && (
          <span>⛽ EVM blockchain - Supports 0x API aggregation</span>
        )}
      </div>
    </div>
  );
}; 