import React, { useState } from 'react';
import { X, Key, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../utils/apiClient';
import { validatePrivateKey } from '../utils/privateKeyUtils';

interface AddPrivateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainId: number;
  onKeyCreated?: () => void;
}

const AddPrivateKeyModal: React.FC<AddPrivateKeyModalProps> = ({
  isOpen,
  onClose,
  chainId,
  onKeyCreated,
}) => {
  const [name, setName] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getKeyType = (chainId: number): string => {
    return chainId === 900 ? 'solana' : 'evm';
  };

  const keyType = getKeyType(chainId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!name.trim()) {
      setError('Please enter a wallet name');
      return;
    }
    
    if (!privateKey.trim()) {
      setError('Please enter a private key');
      return;
    }

    // Validate private key format and check for type mismatch
    const validation = validatePrivateKey(privateKey.trim());
    
    if (!validation.isValid) {
      setError(validation.error || 'Invalid private key format');
      return;
    }

    // Check if the detected key type matches the selected network type
    if (validation.type === 'solana' && keyType === 'evm') {
      setError('This appears to be a Solana private key, but you are adding an EVM wallet. Please select a Solana network (chain ID 900) or use an EVM private key (64 hex characters).');
      return;
    }
    
    if (validation.type === 'evm' && keyType === 'solana') {
      setError('This appears to be an EVM private key, but you are adding a Solana wallet. Please select an EVM network or use a Solana private key.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/private-keys/', {
        name: name.trim(),
        private_key: privateKey.trim(),
        key_type: keyType,
      });

      setSuccess(true);
      setTimeout(() => {
        if (onKeyCreated) onKeyCreated();
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating private key:', err);
      // Extract error message from various possible formats
      let errorMessage = 'Failed to add wallet. Please check your private key.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setPrivateKey('');
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 rounded-full bg-primary/10 p-2">
                  <Key className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Add {keyType === 'solana' ? 'Solana' : 'EVM'} Wallet
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Import your private key
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
              >
                <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
              >
                <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                Wallet added successfully!
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Wallet Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Trading Wallet, Main Wallet"
                  className="w-full rounded-xl border-2 border-gray-200 bg-[#FAFBFC] px-4 py-3 text-gray-900 transition-all duration-200 focus:border-primary focus:bg-[#FFFFFF] focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:focus:border-primary dark:focus:bg-gray-700"
                  disabled={loading || success}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Private Key
                </label>
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder={
                    keyType === 'solana'
                      ? 'Enter your Solana private key (any format: Base58, hex, Base64, JSON, CSV, etc.)'
                      : 'Enter your EVM private key (0x...)'
                  }
                  rows={3}
                  className="w-full rounded-xl border-2 border-gray-200 bg-[#FAFBFC] px-4 py-3 font-mono text-sm text-gray-900 transition-all duration-200 focus:border-primary focus:bg-[#FFFFFF] focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:focus:border-primary dark:focus:bg-gray-700"
                  disabled={loading || success}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  🔒 Your private key is encrypted and stored securely
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  disabled={loading || success}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading || success}
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Added
                    </>
                  ) : (
                    'Add Wallet'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddPrivateKeyModal;

