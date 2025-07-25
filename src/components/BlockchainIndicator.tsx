import React from 'react';
import { Zap, Globe, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { getBlockchainType, getNetworkName } from '../utils/addressUtils';

interface BlockchainIndicatorProps {
  chainId: number;
  className?: string;
  showDetails?: boolean;
  status?: 'connected' | 'connecting' | 'error' | 'disconnected';
}

export const BlockchainIndicator: React.FC<BlockchainIndicatorProps> = ({
  chainId,
  className = '',
  showDetails = true,
  status = 'connected',
}) => {
  const blockchainType = getBlockchainType(chainId);
  const networkName = getNetworkName(chainId);

  const getBlockchainIcon = () => {
    switch (blockchainType) {
      case 'solana':
        return <Zap className="h-5 w-5 text-purple-500" />;
      case 'evm':
        return <Globe className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'disconnected':
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Connected';
    }
  };

  const getBlockchainFeatures = () => {
    switch (blockchainType) {
      case 'solana':
        return {
          speed: 'Ultra Fast',
          fees: 'Ultra Low',
          api: 'Jupiter',
          color: 'purple',
        };
      case 'evm':
        return {
          speed: 'Standard',
          fees: 'Variable',
          api: '0x API',
          color: 'blue',
        };
      default:
        return {
          speed: 'Unknown',
          fees: 'Unknown',
          api: 'Unknown',
          color: 'gray',
        };
    }
  };

  const features = getBlockchainFeatures();

  const getBackgroundGradient = () => {
    switch (blockchainType) {
      case 'solana':
        return 'from-purple-500/10 to-pink-500/10';
      case 'evm':
        return 'from-blue-500/10 to-cyan-500/10';
      default:
        return 'from-gray-500/10 to-gray-600/10';
    }
  };

  const getBorderColor = () => {
    switch (blockchainType) {
      case 'solana':
        return 'border-purple-200 dark:border-purple-800';
      case 'evm':
        return 'border-blue-200 dark:border-blue-800';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div
      className={`rounded-xl bg-gradient-to-r ${getBackgroundGradient()} border ${getBorderColor()} p-4 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getBlockchainIcon()}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {networkName}
            </h3>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Chain ID Badge */}
        <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800/80 dark:text-gray-300">
          Chain {chainId}
        </div>
      </div>

      {/* Details */}
      {showDetails && status === 'connected' && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Speed
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {features.speed}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Fees
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {features.fees}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              DEX API
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {features.api}
            </div>
          </div>
        </div>
      )}

      {/* Blockchain Type Badge */}
      <div className="mt-3 flex justify-center">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            blockchainType === 'solana'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
              : blockchainType === 'evm'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
          }`}
        >
          {blockchainType === 'solana' && '✨ Solana Blockchain'}
          {blockchainType === 'evm' && '⛽ EVM Compatible'}
          {blockchainType === 'unknown' && '❓ Unknown Chain'}
        </span>
      </div>
    </div>
  );
}; 