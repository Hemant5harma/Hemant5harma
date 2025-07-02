export interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface OrderBookEntry {
  amount: number;
  total: number;
  price: number;
}

export interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  currentPrice: number;
  availableAmount: number;
  chartData: ChartData[];
  orderBook: {
    sells: OrderBookEntry[];
    buys: OrderBookEntry[];
  };
}

export const cryptoData: CryptoData[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    currentPrice: 29345.67,
    availableAmount: 0.5,
    chartData: [
      { time: '2023-05-01', open: 29000, high: 29500, low: 28800, close: 29200 },
      { time: '2023-05-02', open: 29200, high: 29700, low: 29100, close: 29500 },
      { time: '2023-05-03', open: 29500, high: 30000, low: 29400, close: 29800 },
      { time: '2023-05-04', open: 29800, high: 30200, low: 29700, close: 30100 },
      { time: '2023-05-05', open: 30100, high: 30500, low: 29900, close: 29345.67 },
    ],
    orderBook: {
      sells: [
        { amount: 0.1, total: 2934.57, price: 29345.67 },
        { amount: 0.2, total: 5869.13, price: 29345.65 },
        { amount: 0.15, total: 4401.85, price: 29345.64 },
      ],
      buys: [
        { amount: 0.1, total: 2934.56, price: 29345.66 },
        { amount: 0.2, total: 5869.12, price: 29345.63 },
        { amount: 0.15, total: 4401.84, price: 29345.62 },
      ],
    },
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    currentPrice: 1856.23,
    availableAmount: 5.0,
    chartData: [
      { time: '2023-05-01', open: 1800, high: 1850, low: 1780, close: 1820 },
      { time: '2023-05-02', open: 1820, high: 1870, low: 1810, close: 1840 },
      { time: '2023-05-03', open: 1840, high: 1900, low: 1830, close: 1880 },
      { time: '2023-05-04', open: 1880, high: 1920, low: 1870, close: 1900 },
      { time: '2023-05-05', open: 1900, high: 1950, low: 1890, close: 1856.23 },
    ],
    orderBook: {
      sells: [
        { amount: 1.0, total: 1856.23, price: 1856.23 },
        { amount: 2.0, total: 3712.46, price: 1856.22 },
        { amount: 1.5, total: 2784.34, price: 1856.21 },
      ],
      buys: [
        { amount: 1.0, total: 1856.22, price: 1856.22 },
        { amount: 2.0, total: 3712.44, price: 1856.21 },
        { amount: 1.5, total: 2784.33, price: 1856.2 },
      ],
    },
  },
  {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    currentPrice: 0.37,
    availableAmount: 10000,
    chartData: [
      { time: '2023-05-01', open: 0.35, high: 0.36, low: 0.34, close: 0.355 },
      { time: '2023-05-02', open: 0.355, high: 0.365, low: 0.35, close: 0.36 },
      { time: '2023-05-03', open: 0.36, high: 0.37, low: 0.355, close: 0.365 },
      { time: '2023-05-04', open: 0.365, high: 0.375, low: 0.36, close: 0.37 },
      { time: '2023-05-05', open: 0.37, high: 0.38, low: 0.365, close: 0.37 },
    ],
    orderBook: {
      sells: [
        { amount: 1000, total: 370, price: 0.37 },
        { amount: 2000, total: 740, price: 0.3699 },
        { amount: 1500, total: 554.85, price: 0.3698 },
      ],
      buys: [
        { amount: 1000, total: 369.9, price: 0.3699 },
        { amount: 2000, total: 739.6, price: 0.3698 },
        { amount: 1500, total: 554.55, price: 0.3697 },
      ],
    },
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    currentPrice: 21.45,
    availableAmount: 100,
    chartData: [
      { time: '2023-05-01', open: 20.5, high: 21.0, low: 20.3, close: 20.8 },
      { time: '2023-05-02', open: 20.8, high: 21.2, low: 20.6, close: 21.0 },
      { time: '2023-05-03', open: 21.0, high: 21.5, low: 20.9, close: 21.3 },
      { time: '2023-05-04', open: 21.3, high: 21.7, low: 21.2, close: 21.5 },
      { time: '2023-05-05', open: 21.5, high: 21.8, low: 21.3, close: 21.45 },
    ],
    orderBook: {
      sells: [
        { amount: 10, total: 214.5, price: 21.45 },
        { amount: 20, total: 429, price: 21.44 },
        { amount: 15, total: 321.45, price: 21.43 },
      ],
      buys: [
        { amount: 10, total: 214.4, price: 21.44 },
        { amount: 20, total: 428.6, price: 21.43 },
        { amount: 15, total: 321.3, price: 21.42 },
      ],
    },
  },
  {
    id: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    currentPrice: 5.67,
    availableAmount: 500,
    chartData: [
      { time: '2023-05-01', open: 5.5, high: 5.6, low: 5.4, close: 5.55 },
      { time: '2023-05-02', open: 5.55, high: 5.65, low: 5.5, close: 5.6 },
      { time: '2023-05-03', open: 5.6, high: 5.7, low: 5.55, close: 5.65 },
      { time: '2023-05-04', open: 5.65, high: 5.75, low: 5.6, close: 5.7 },
      { time: '2023-05-05', open: 5.7, high: 5.8, low: 5.65, close: 5.67 },
    ],
    orderBook: {
      sells: [
        { amount: 50, total: 283.5, price: 5.67 },
        { amount: 100, total: 567, price: 5.66 },
        { amount: 75, total: 424.5, price: 5.65 },
      ],
      buys: [
        { amount: 50, total: 283, price: 5.66 },
        { amount: 100, total: 565, price: 5.65 },
        { amount: 75, total: 423.75, price: 5.64 },
      ],
    },
  },
];

export const availableUSDT = 10000;
