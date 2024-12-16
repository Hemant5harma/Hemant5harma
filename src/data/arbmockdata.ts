import { IconType } from 'react-icons';
import { FaBitcoin, FaEthereum, FaDollarSign } from 'react-icons/fa';

export interface Exchange {
  name: string;
  blockchain: string;
  assets: string[];
  liquidityPool: string;
  icon: IconType;
}

export interface ArbitrageParams {
  minPriceDifference: number;
  maxGasCost: number;
  maxSlippage: number;
  flashLoanFee: number;
}

export interface RiskChartData {
  name: string;
  risk: number;
}

export interface ArbitrageOpportunity {
  sourceExchange: string;
  targetExchange: string;
  asset: string;
  priceDifference: number;
  profitPotential: boolean;
}

export const exchanges: Exchange[] = [
  { 
    name: 'Uniswap', 
    blockchain: 'Ethereum',
    assets: ['ETH', 'USDC', 'DAI'],
    liquidityPool: '$500M',
    icon: FaEthereum
  },
  { 
    name: 'SushiSwap', 
    blockchain: 'Ethereum',
    assets: ['ETH', 'USDT', 'WBTC'],
    liquidityPool: '$350M',
    icon: FaEthereum
  },
  {
    name: 'PancakeSwap',
    blockchain: 'Binance Smart Chain',
    assets: ['BNB', 'CAKE', 'BUSD'],
    liquidityPool: '$450M',
    icon: FaDollarSign
  },
  {
    name: 'Curve',
    blockchain: 'Ethereum',
    assets: ['DAI', 'USDC', 'USDT'],
    liquidityPool: '$600M',
    icon: FaDollarSign
  },
  {
    name: 'Balancer',
    blockchain: 'Ethereum',
    assets: ['BAL', 'WETH', 'USDC'],
    liquidityPool: '$300M',
    icon: FaEthereum
  }
];

export const initialArbitrageParams: ArbitrageParams = {
  minPriceDifference: 0.5,
  maxGasCost: 50,
  maxSlippage: 0.3,
  flashLoanFee: 0.09
};

export const riskChartData: RiskChartData[] = [
  { name: 'Gas Cost', risk: 50 },
  { name: 'Slippage', risk: 0.3 },
  { name: 'Flash Loan Fee', risk: 0.09 }
];

export const initialArbitrageOpportunities: ArbitrageOpportunity[] = [
  {
    sourceExchange: 'Uniswap',
    targetExchange: 'SushiSwap',
    asset: 'ETH',
    priceDifference: 0.7,
    profitPotential: true
  },
  {
    sourceExchange: 'PancakeSwap',
    targetExchange: 'Curve',
    asset: 'USDC',
    priceDifference: 0.4,
    profitPotential: false
  },
  {
    sourceExchange: 'Balancer',
    targetExchange: 'Uniswap',
    asset: 'WETH',
    priceDifference: 0.9,
    profitPotential: true
  },
  {
    sourceExchange: 'Curve',
    targetExchange: 'SushiSwap',
    asset: 'DAI',
    priceDifference: 0.6,
    profitPotential: true
  },
  {
    sourceExchange: 'SushiSwap',
    targetExchange: 'Balancer',
    asset: 'WBTC',
    priceDifference: 0.3,
    profitPotential: false
  },
  {
    sourceExchange: 'Uniswap',
    targetExchange: 'Curve',
    asset: 'USDC',
    priceDifference: 0.8,
    profitPotential: true
  },
  {
    sourceExchange: 'PancakeSwap',
    targetExchange: 'Balancer',
    asset: 'BNB',
    priceDifference: 1.2,
    profitPotential: true
  },
  {
    sourceExchange: 'Curve',
    targetExchange: 'Uniswap',
    asset: 'USDT',
    priceDifference: 0.5,
    profitPotential: true
  }
];

export const initialSimulationResults = {
  totalPotentialProfit: initialArbitrageOpportunities.reduce((sum, opp) => sum + (opp.profitPotential ? 1000 : 0), 0),
  totalRisk: initialArbitrageOpportunities.length,
  opportunities: initialArbitrageOpportunities
};

