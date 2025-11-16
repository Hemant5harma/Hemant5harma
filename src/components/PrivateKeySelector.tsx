import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Key, Loader } from 'lucide-react';
import { apiClient, getWalletBalances } from '../utils/apiClient';
import { tokensByNetwork, Token } from '../data/networkData';
import CustomDropdown from './CustomDropdown';

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
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          setKeys(data);
          
          // Auto-select default or first key if none selected
          if (!selectedKeyId && data.length > 0) {
            const defaultKey = data.find((k: PrivateKeyInfo) => k.is_default) || data[0];
            if (defaultKey) {
              onKeySelect(defaultKey.id);
            }
          }
        } else {
          console.warn('Unexpected response format from /private-keys:', data);
          setKeys([]);
        }
      } catch (error: any) {
        console.error('Error loading private keys:', error);
        setKeys([]);
        // Don't show notification here as apiClient already handles it
      } finally {
        setLoading(false);
      }
    };

    if (chainId) {
      loadKeys();
    }
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
      {label && (
        <label className="mb-2 flex items-center text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
          <Key className="mr-2 h-4 w-4 text-primary" />
          {label}
        </label>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border-2 border-border-light bg-surface-light px-4 py-3 dark:border-border-dark dark:bg-surface-dark">
          <Loader className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">Loading wallets...</span>
        </div>
      ) : keys.length === 0 ? (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-dashed border-border-light bg-surface-light p-4 text-center dark:border-border-dark dark:bg-surface-dark">
            <Wallet className="mx-auto h-8 w-8 text-text-light-secondary dark:text-text-dark-secondary" />
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              No wallets found for {getKeyType(chainId) === 'solana' ? 'Solana' : 'EVM chains'}
            </p>
            <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Add a wallet to start trading
            </p>
          </div>
          {onAddKey && (
            <button
              onClick={onAddKey}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-sm font-semibold text-white transition-all hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Wallet
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <CustomDropdown
            options={keys.map((key) => ({
              value: key.id,
              label: `${key.name} (${truncateAddress(key.address)})${key.is_default ? ' ★' : ''}`,
            }))}
            value={selectedKeyId}
            onChange={(value) => onKeySelect(value ? Number(value) : null)}
            placeholder="Select a wallet"
          />

          {selectedKey && (
            <div className="rounded-lg border border-border-light bg-primary/10 p-3 dark:border-border-dark dark:bg-primary/20">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    {selectedKey.name}
                  </p>
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary break-all font-mono">
                    {selectedKey.address}
                  </p>
                  {purchaseBalance && (
                    <p className="mt-1 text-xs font-semibold text-primary">
                      💰 {purchaseBalance}
                    </p>
                  )}
                </div>
                {selectedKey.is_default && (
                  <span className="rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary dark:bg-primary/30 dark:text-primary flex-shrink-0">
                    Default
                  </span>
                )}
              </div>
            </div>
          )}

          {onAddKey && (
            <button
              onClick={onAddKey}
              className="flex w-full items-center justify-center rounded-xl border-2 border-dashed border-border-light bg-transparent px-4 py-2 text-sm font-medium text-text-light-secondary transition-all hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-border-dark dark:text-text-dark-secondary dark:hover:border-primary"
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

