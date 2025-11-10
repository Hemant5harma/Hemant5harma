import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Key, Loader } from 'lucide-react';
import { apiClient, getWalletBalances } from '../utils/apiClient';
import { tokensByNetwork, Token } from '../data/networkData';

interface PrivateKeyInfo {
  id: number;
  name: string;
  address: string;
  key_type: string;
  is_default: boolean;
  balance?: string;
}

interface PrivateKeySelectorProps {
  chainId: number;
  selectedKeyId: number | null;
  onKeySelect: (keyId: number | null) => void;
  onAddKey?: () => void;
  label?: string;
}

const PrivateKeySelector: React.FC<PrivateKeySelectorProps> = ({
  chainId,
  selectedKeyId,
  onKeySelect,
  onAddKey,
  label = "Select Wallet",
}) => {
  const [keys, setKeys] = useState<PrivateKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseBalance, setPurchaseBalance] = useState<string>('');

  // Determine key type based on chain ID
  const getKeyType = (chainId: number): string => {
    return chainId === 900 ? 'solana' : 'evm';
  };

  useEffect(() => {
    const loadKeys = async () => {
      setLoading(true);
      try {
        const keyType = getKeyType(chainId);
        const data = await apiClient.get(`/private-keys/?key_type=${keyType}&chain_id=${chainId}`);
        setKeys(data);
        
        // Auto-select default or first key if none selected
        if (!selectedKeyId && data.length > 0) {
          const defaultKey = data.find((k: PrivateKeyInfo) => k.is_default) || data[0];
          onKeySelect(defaultKey.id);
        }
      } catch (error) {
        console.error('Error loading private keys:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]);

  const selectedKey = keys.find(k => k.id === selectedKeyId);

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper: find purchase token for a chain (USDT by default, USDC on Base, MON native on Monad, USDT on Solana)
  const getPurchaseToken = (cid: number): { token: Token | null; isNative: boolean; symbol: string; decimals: number } => {
    if (cid === 10143) {
      // Monad Testnet - MON native
      return {
        token: { symbol: 'MON', name: 'Monad', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18 },
        isNative: true,
        symbol: 'MON',
        decimals: 18,
      };
    }
    if (cid === 900) {
      // Solana - USDT SPL
      const t = (tokensByNetwork[900] || []).find(t => t.symbol === 'USDT') || null;
      return { token: t, isNative: false, symbol: 'USDT', decimals: t?.decimals || 6 };
    }
    // EVM - prefer USDT, Base prefers USDC
    const list = tokensByNetwork[cid] || [];
    const preferredSymbol = cid === 8453 ? 'USDC' : 'USDT';
    const t = list.find(t => t.symbol === preferredSymbol) || list.find(t => t.symbol === 'USDT') || null;
    return { token: t, isNative: false, symbol: (t?.symbol || preferredSymbol), decimals: t?.decimals || 6 };
  };

  // Fetch purchase token balance via backend mtrades/wallet/balances (single source of truth)
  useEffect(() => {
    const fetchPurchaseBalance = async () => {
      try {
        if (!chainId) return;
        const { token, isNative, symbol, decimals } = getPurchaseToken(chainId);
        const tokens: string[] = token ? [token.address] : [];
        const res = await getWalletBalances(chainId, tokens);
        let display = '';
        if (isNative || (token && token.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')) {
          const raw = BigInt(res.native_balance || '0');
          const denom = BigInt(Math.pow(10, decimals));
          const intPart = Number(raw / denom);
          const fracPart = Number(raw % denom) / Math.pow(10, decimals);
          display = `${(intPart + fracPart).toFixed(4)} ${symbol}`;
        } else if (token) {
          const found = (res.tokens || []).find((t: any) => t.address.toLowerCase() === token.address.toLowerCase());
          const rawStr = found?.balance || '0';
          const raw = BigInt(rawStr);
          const denom = BigInt(Math.pow(10, token.decimals));
          const intPart = Number(raw / denom);
          const fracPart = Number(raw % denom) / Math.pow(10, token.decimals);
          display = `${(intPart + fracPart).toFixed(4)} ${symbol}`;
        } else {
          display = '';
        }
        setPurchaseBalance(display);
      } catch (e) {
        setPurchaseBalance('');
      }
    };
    fetchPurchaseBalance();
  }, [chainId, selectedKeyId]);

  return (
    <div className="space-y-2">
      <label className="mb-3 flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
        <Key className="mr-2 h-5 w-5 text-primary" />
        {label}
      </label>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border-2 border-gray-200 bg-[#FAFBFC] px-4 py-3 dark:border-gray-600 dark:bg-gray-700/50">
          <Loader className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading wallets...</span>
        </div>
      ) : keys.length === 0 ? (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center dark:border-gray-600 dark:bg-gray-800/50">
            <Wallet className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              No wallets found for {getKeyType(chainId) === 'solana' ? 'Solana' : 'EVM chains'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Add a wallet to start trading
            </p>
          </div>
          {onAddKey && (
            <button
              onClick={onAddKey}
              className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Wallet
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <select
              value={selectedKeyId || ''}
              onChange={(e) => onKeySelect(e.target.value ? Number(e.target.value) : null)}
              className="w-full appearance-none rounded-xl border-2 border-gray-200 bg-[#FAFBFC] px-4 py-3 pr-12 text-gray-900 transition-all duration-200 focus:border-primary focus:bg-[#FFFFFF] focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:focus:border-primary dark:focus:bg-gray-700"
            >
              <option value="">Select a wallet</option>
              {keys.map((key) => (
                <option key={key.id} value={key.id}>
                  {key.name} ({truncateAddress(key.address)}){key.is_default ? ' ★' : ''}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          {selectedKey && (
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {selectedKey.name}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {selectedKey.address}
                  </p>
                  {purchaseBalance && (
                    <p className="mt-1 text-xs font-semibold text-green-700 dark:text-green-300">
                      💰 {purchaseBalance}
                    </p>
                  )}
                </div>
                {selectedKey.is_default && (
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    Default
                  </span>
                )}
              </div>
            </div>
          )}

          {onAddKey && (
            <button
              onClick={onAddKey}
              className="flex w-full items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Wallet
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivateKeySelector;

