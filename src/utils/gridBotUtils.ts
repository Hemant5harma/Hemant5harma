// Grid Bot Utility Functions - Fee-aware calculations and helpers
import {
  SellTargetCalculation,
  BuyQuantityCalculation,
  DropPercentCalculation,
  GridPairConfig,
  FeeMode,
} from '../types/gridBot';

/**
 * Calculate the 24h high drop percentage
 * Formula: drop_pct = ((current - high24) / high24) * 100
 * 
 * @param currentPrice Current market price
 * @param high24h 24-hour high price
 * @returns Drop percentage (negative when price dropped from high)
 */
export function calculateDropPercent(
  currentPrice: number,
  high24h: number
): DropPercentCalculation {
  if (high24h <= 0) {
    return { dropPct: 0, shouldBuy: false };
  }
  
  const dropPct = ((currentPrice - high24h) / high24h) * 100;
  return { dropPct, shouldBuy: false }; // shouldBuy will be set by caller based on threshold
}

/**
 * Check if buy condition is met
 * Buy when: drop_pct <= buy_threshold_pct
 * 
 * @param dropPct Current drop percentage (negative)
 * @param buyThresholdPct Buy threshold (negative, e.g., -4 means buy when dropped 4%)
 */
export function shouldTriggerBuy(dropPct: number, buyThresholdPct: number): boolean {
  // Both values are negative; buy when dropPct is lower (more negative) than threshold
  return dropPct <= buyThresholdPct;
}

/**
 * Calculate buy quantity accounting for fees
 * Formula: Q = (A - buy_fee) / Pb
 * 
 * @param investAmount Amount to invest in quote currency (e.g., USDT)
 * @param buyPrice Current buy price
 * @param buyFeePct Buy fee percentage (e.g., 0.1 for 0.1%)
 * @param feeMode Whether fees are taken in quote or base currency
 */
export function calculateBuyQuantity(
  investAmount: number,
  buyPrice: number,
  buyFeePct: number,
  feeMode: FeeMode = 'quote_fee'
): BuyQuantityCalculation {
  const buyFeeFraction = buyFeePct / 100;
  
  if (feeMode === 'quote_fee') {
    // Fee taken in quote currency (USDT)
    const buyFee = investAmount * buyFeeFraction;
    const netBuyAmount = investAmount - buyFee;
    const quantity = netBuyAmount / buyPrice;
    
    return {
      investedAmount: investAmount,
      buyFee,
      netBuyAmount,
      quantity,
    };
  } else {
    // Fee taken in base currency (e.g., SOL)
    // First calculate gross quantity, then deduct fee
    const grossQuantity = investAmount / buyPrice;
    const buyFeeInBase = grossQuantity * buyFeeFraction;
    const quantity = grossQuantity - buyFeeInBase;
    const buyFee = buyFeeInBase * buyPrice; // Convert to quote for accounting
    
    return {
      investedAmount: investAmount,
      buyFee,
      netBuyAmount: investAmount,
      quantity,
    };
  }
}

/**
 * Calculate the exact sell target price that nets the desired ROI after fees
 * 
 * EXACT FORMULA: Ps = Pb * (1 + r) / ((1 - fb) * (1 - fs))
 * 
 * This ensures that after paying both buy and sell fees, the net proceeds
 * equal the invested amount times (1 + roi).
 * 
 * @param buyPrice The price at which the asset was bought
 * @param roiTargetPct Target ROI percentage (e.g., 2 for 2%)
 * @param buyFeePct Buy fee percentage (e.g., 0.1 for 0.1%)
 * @param sellFeePct Sell fee percentage (e.g., 0.1 for 0.1%)
 * @param quantity Quantity of base asset bought
 * @param investedAmount Original invested amount
 */
export function calculateSellTargetPrice(
  buyPrice: number,
  roiTargetPct: number,
  buyFeePct: number,
  sellFeePct: number,
  quantity: number,
  investedAmount: number
): SellTargetCalculation {
  const r = roiTargetPct / 100; // Convert to fraction
  const fb = buyFeePct / 100;   // Buy fee fraction
  const fs = sellFeePct / 100;  // Sell fee fraction
  
  // Exact formula: Ps = Pb * (1 + r) / ((1 - fb) * (1 - fs))
  const sellTargetPrice = (buyPrice * (1 + r)) / ((1 - fb) * (1 - fs));
  
  // Calculate expected proceeds
  const expectedGrossProceeds = quantity * sellTargetPrice;
  const expectedSellFee = expectedGrossProceeds * fs;
  const expectedNetProceeds = expectedGrossProceeds - expectedSellFee;
  const expectedNetProfit = expectedNetProceeds - investedAmount;
  
  return {
    sellTargetPrice,
    expectedGrossProceeds,
    expectedSellFee,
    expectedNetProceeds,
    expectedNetProfit,
  };
}

/**
 * Approximate sell price for quick UI preview
 * Formula: Ps ≈ Pb * (1 + r + fee_margin) where fee_margin ≈ fb + fs
 */
export function calculateApproximateSellPrice(
  buyPrice: number,
  roiTargetPct: number,
  buyFeePct: number,
  sellFeePct: number
): number {
  const r = roiTargetPct / 100;
  const feeMargin = (buyFeePct + sellFeePct) / 100;
  return buyPrice * (1 + r + feeMargin);
}

/**
 * Calculate realized profit after a sell
 */
export function calculateRealizedProfit(
  investedAmount: number,
  sellProceeds: number,
  buyFee: number,
  sellFee: number
): { grossProfit: number; netProfit: number; netRoiPct: number } {
  const grossProfit = sellProceeds - investedAmount;
  const totalFees = buyFee + sellFee;
  const netProfit = sellProceeds - investedAmount - sellFee; // buyFee already deducted from quantity
  const netRoiPct = (netProfit / investedAmount) * 100;
  
  return { grossProfit, netProfit, netRoiPct };
}

/**
 * Calculate reinvestment split
 */
export function calculateReinvestment(
  profit: number,
  reinvestRatePct: number
): { reinvestAmount: number; profitWalletAmount: number } {
  const reinvestFraction = reinvestRatePct / 100;
  const reinvestAmount = profit * reinvestFraction;
  const profitWalletAmount = profit - reinvestAmount;
  
  return { reinvestAmount, profitWalletAmount };
}

/**
 * Distribute investment equally across pairs
 */
export function distributeInvestmentEqually(
  totalAmount: number,
  pairCount: number
): number {
  if (pairCount <= 0) return 0;
  return totalAmount / pairCount;
}

/**
 * Validate grid pair configuration
 */
export function validateGridPairConfig(config: Partial<GridPairConfig>): string[] {
  const errors: string[] = [];
  
  if (!config.pair) {
    errors.push('Trading pair is required');
  }
  
  if (!config.investAmountUsdt || config.investAmountUsdt <= 0) {
    errors.push('Investment amount must be greater than 0');
  }
  
  if (config.buyThresholdPct === undefined || config.buyThresholdPct >= 0) {
    errors.push('Buy threshold must be a negative number (e.g., -4 for 4% drop)');
  }
  
  if (!config.roiSellPct || config.roiSellPct <= 0) {
    errors.push('ROI sell target must be a positive number');
  }
  
  if (config.buyFeePct === undefined || config.buyFeePct < 0) {
    errors.push('Buy fee must be 0 or greater');
  }
  
  if (config.sellFeePct === undefined || config.sellFeePct < 0) {
    errors.push('Sell fee must be 0 or greater');
  }
  
  return errors;
}

/**
 * Check if price data is stale (older than threshold)
 */
export function isPriceDataStale(lastUpdated: number, staleThresholdMs: number = 30000): boolean {
  return Date.now() - lastUpdated > staleThresholdMs;
}

/**
 * Format price for display with appropriate decimal places
 */
export function formatPrice(price: number, decimals: number = 4): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

/**
 * Format percentage for display
 */
export function formatPercentage(pct: number, showSign: boolean = true): string {
  const formatted = pct.toFixed(2);
  if (showSign && pct > 0) return `+${formatted}%`;
  return `${formatted}%`;
}

/**
 * Generate unique ID for grid pairs/orders
 */
export function generateGridId(): string {
  return `grid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse time duration to milliseconds
 */
export function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)\s*(second|minute|hour|day|week|month)s?$/i);
  if (!match) return 60000; // Default to 1 minute
  
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  
  const multipliers: Record<string, number> = {
    second: 1000,
    minute: 60000,
    hour: 3600000,
    day: 86400000,
    week: 604800000,
    month: 2592000000,
  };
  
  return value * (multipliers[unit] || 60000);
}

/**
 * Calculate time since timestamp in human-readable format
 */
export function formatTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
