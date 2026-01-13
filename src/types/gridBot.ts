// Type definitions for the Grid Trading Bot system

// Grid Pair Preset Types
export type PresetType = 'Neutral' | 'Bull' | 'Bear' | 'Custom';

// Preset configurations with buy thresholds and sell targets
export const GRID_PRESETS: Record<PresetType, { buy: number[]; sell: number[] }> = {
  Neutral: { buy: [-5, -10, -15, -20, -25], sell: [10, 15, 20, 25, 30] },
  Bull: { buy: [-3, -5, -7, -10, -12], sell: [5, 8, 10, 12, 15] },
  Bear: { buy: [-10, -15, -20, -25, -30], sell: [15, 20, 25, 30, 40] },
  Custom: { buy: [], sell: [] },
};

// Grid Order Status
export type GridOrderStatus =
  | 'idle'
  | 'watching'
  | 'buy_triggered'
  | 'bought'
  | 'sell_monitoring'
  | 'sell_triggered'
  | 'sold'
  | 'cancelled'
  | 'error';

// Fee mode for different exchanges
export type FeeMode = 'quote_fee' | 'base_fee';

// Single Grid Pair Configuration
export interface GridPairConfig {
  id: string;
  pair: string; // e.g., "SOL/USDT"
  baseSymbol: string; // e.g., "SOL"
  quoteSymbol: string; // e.g., "USDT"
  baseTokenAddress: string;
  quoteTokenAddress: string;
  walletId: number | null;
  investAmountUsdt: number;
  buyThresholdPct: number; // Negative number, e.g., -4.0 means 4% drop
  roiSellPct: number; // Positive number, e.g., 2.0 means 2% profit target
  buyFeePct: number; // e.g., 0.1 for 0.1%
  sellFeePct: number; // e.g., 0.1 for 0.1%
  feeMode: FeeMode;
  preset: PresetType;
  isActive: boolean;
}

// Grid Order (single buy/sell cycle)
export interface GridOrder {
  id: string;
  pairId: string;
  status: GridOrderStatus;
  buyThresholdPct: number;
  roiSellPct: number;
  buyPrice: number | null;
  buyQuantity: number | null;
  buyFee: number | null;
  buyTimestamp: number | null;
  sellTargetPrice: number | null;
  sellPrice: number | null;
  sellFee: number | null;
  sellTimestamp: number | null;
  realizedProfit: number | null;
  realizedRoi: number | null;
}

// Price Ticker Data
export interface TickerData {
  symbol: string;
  currentPrice: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  priceChange24hPct: number;
  lastUpdated: number;
  isStale: boolean;
}

// Grid Bot Configuration (full bot)
export interface GridBotConfig {
  id: string;
  name: string;
  chainId: number;
  privateKeyId: number | null;
  totalInvestAmountUsdt: number;
  splitEqual: boolean;
  reinvestRatePct: number; // 0, 25, 50, 75, 100
  profitsWalletId: number | null;
  pairs: GridPairConfig[];
  isRunning: boolean;
  createdAt: number;
  updatedAt: number;
}

// Grid Trade History Entry
export interface GridTradeHistoryEntry {
  id: string;
  botId: string;
  pairId: string;
  pair: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  investedAmount: number;
  buyFee: number;
  sellFee: number;
  grossProfit: number;
  netProfit: number;
  netRoiPct: number;
  buyTimestamp: number;
  sellTimestamp: number;
  reinvestedAmount: number;
  transferredToProfit: number;
}

// Bot Statistics
export interface GridBotStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalGrossProfit: number;
  totalNetProfit: number;
  totalFeesPaid: number;
  averageRoi: number;
  averageHoldTime: number; // in seconds
  totalCapitalAtRisk: number;
  totalReinvested: number;
}

// Alert types for the bot
export type AlertType = 'info' | 'warning' | 'error' | 'success';

export interface GridBotAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: number;
  dismissed: boolean;
}

// API Payloads
export interface CreateGridBotPayload {
  name: string;
  chain_id: number;
  private_key_id: number;
  total_invest_amount: number;
  split_equal: boolean;
  reinvest_rate_pct: number;
  profits_wallet_id: number | null;
  pairs: {
    pair: string;
    base_token_address: string;
    quote_token_address: string;
    invest_amount: number;
    buy_threshold_pct: number;
    roi_sell_pct: number;
    buy_fee_pct: number;
    sell_fee_pct: number;
    fee_mode: string;
    preset: string;
  }[];
}

// Calculation helpers types
export interface SellTargetCalculation {
  sellTargetPrice: number;
  expectedGrossProceeds: number;
  expectedSellFee: number;
  expectedNetProceeds: number;
  expectedNetProfit: number;
}

export interface BuyQuantityCalculation {
  investedAmount: number;
  buyFee: number;
  netBuyAmount: number;
  quantity: number;
}

export interface DropPercentCalculation {
  dropPct: number;
  shouldBuy: boolean;
}
