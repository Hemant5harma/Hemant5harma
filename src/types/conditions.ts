// Type definitions for the trading condition system

export interface ConditionParams {
  // Price Drop
  threshold?: number;
  
  // RSI Oversold
  rsi_threshold?: number;
  
  // Volume Spike
  volume_multiplier?: number;
  
  // Support Level
  support_price?: number;
  tolerance?: number;
  
  // Moving Average Cross
  fast_ma?: number;
  slow_ma?: number;
  
  // Common
  timeframe?: string;
}

export interface TradingCondition {
  condition_type: 'price_drop' | 'rsi_oversold' | 'volume_spike' | 'support_level' | 'moving_average_cross';
  condition_params: ConditionParams;
  logic_operator?: 'AND' | 'OR';
}

export interface Asset {
  symbol: string;
  name: string;
  amount: number;
  threshold: number; // Backward compatibility
  token_address: string;
  condition_type?: string;
  condition_params?: ConditionParams;
  logic_operator?: string;
}

export interface ConditionType {
  value: string;
  label: string;
  description: string;
  icon: any;
  defaultParams: ConditionParams;
}

// API payload types
export interface CoinCreatePayload {
  token_address: string;
  amount: number;
  threshold: number;
  condition_type: string;
  condition_params: ConditionParams;
  logic_operator: string;
}

export interface BotCreatePayload {
  name: string;
  frequency: string;
  chain_id: number;
  rpc_url?: string;
  network_name?: string;
  coins: CoinCreatePayload[];
} 