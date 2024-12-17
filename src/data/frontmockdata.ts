export const mockHistoricalTrades = [
    { date: '2023-01-01', profit: 100 },
    { date: '2023-01-02', profit: 150 },
    { date: '2023-01-03', profit: 80 },
    { date: '2023-01-04', profit: 200 },
    { date: '2023-01-05', profit: 120 },
  ];
  
  export const tradingPairs = [
    { name: 'ETH/USDT', volume: '1,234,567', change: '+5.67%' },
    { name: 'BTC/USDT', volume: '9,876,543', change: '-2.34%' },
    { name: 'LINK/ETH', volume: '456,789', change: '+1.23%' },
    { name: 'UNI/ETH', volume: '789,012', change: '-0.45%' },
  ];
  
  export const initialParameters = {
    tokenAddress: '',
    buyAmount: '',
    maxGasFee: '',
    slippageTolerance: '',
    selectedExchange: '',
    strategyType: 'aggressive' as const,
    autoProfitTakePercentage: '',
    stopLossPercentage: '',
    backrunningEnabled: false,
    sandwichTradingEnabled: false,
    webhookNotificationUrl: ''
  };
  
  export type Parameters = typeof initialParameters;
  
  