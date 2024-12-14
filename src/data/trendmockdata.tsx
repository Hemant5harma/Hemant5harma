export interface CryptoData {
    value: string;
    label: string;
    price: number;
    volume: number;
  }
  
  export const cryptoData: CryptoData[] = [
    { value: 'BTC', label: 'Bitcoin', price: 30000, volume: 5000000000 },
    { value: 'ETH', label: 'Ethereum', price: 2000, volume: 2000000000 },
    { value: 'SOL', label: 'Solana', price: 50, volume: 500000000 },
    { value: 'ADA', label: 'Cardano', price: 1.2, volume: 300000000 },
    { value: 'DOT', label: 'Polkadot', price: 20, volume: 200000000 },
    { value: 'LINK', label: 'Chainlink', price: 15, volume: 150000000 },
    { value: 'UNI', label: 'Uniswap', price: 25, volume: 180000000 },
    { value: 'AAVE', label: 'Aave', price: 300, volume: 120000000 },
    { value: 'MATIC', label: 'Polygon', price: 1.5, volume: 250000000 },
    { value: 'ATOM', label: 'Cosmos', price: 40, volume: 130000000 },
  ];
  
  