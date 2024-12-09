import React from 'react';
import { Select } from '@mantine/core';
import { cryptoData } from '../data/mockdata';

interface CryptoSelectorProps {
  selectedCrypto: string;
  onSelectCrypto: (cryptoId: string) => void;
}

const CryptoSelector: React.FC<CryptoSelectorProps> = ({ selectedCrypto, onSelectCrypto }) => {
  const cryptoOptions = cryptoData.map((crypto) => ({
    value: crypto.id,
    label: `${crypto.name} (${crypto.symbol})`,
    symbol: crypto.symbol,
  }));

  return (
    <Select
      data={cryptoOptions}
      value={selectedCrypto}
      onChange={(value) => onSelectCrypto(value as string)}
      searchable
      maxDropdownHeight={280}
      placeholder="Search for a cryptocurrency"
      className="w-full max-w-xs"
    />
  );
};

export default CryptoSelector;

