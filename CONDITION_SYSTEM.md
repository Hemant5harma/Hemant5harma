# Multi-Condition Trading Bot System

## Overview

The enhanced trading bot system now supports multiple trading conditions beyond the simple price drop threshold. This allows users to create sophisticated DCA (Dollar-Cost Averaging) strategies based on various technical indicators and market conditions.

## Supported Condition Types

### 1. Price Drop (price_drop)
**Description**: Buy when the token price drops by a specified percentage within 24 hours.

**Parameters**:
```json
{
  "threshold": 5.0  // Percentage drop required to trigger buy (e.g., 5.0 = 5%)
}
```

**Example**: Buy when price drops by 7% or more in the last 24 hours.

### 2. RSI Oversold (rsi_oversold)
**Description**: Buy when the Relative Strength Index indicates oversold conditions.

**Parameters**:
```json
{
  "rsi_threshold": 30,   // RSI level considered oversold (typically 30 or below)
  "timeframe": "1h"      // Timeframe for RSI calculation (15m, 1h, 4h, 1d)
}
```

**Example**: Buy when 1-hour RSI falls below 30.

### 3. Volume Spike (volume_spike)
**Description**: Buy when trading volume increases significantly above average.

**Parameters**:
```json
{
  "volume_multiplier": 2.0,  // Volume must be X times higher than average
  "timeframe": "24h"         // Timeframe to compare volume (1h, 4h, 24h)
}
```

**Example**: Buy when 24-hour volume is 2x higher than usual.

### 4. Support Level (support_level)
**Description**: Buy when the token price approaches a predefined support level.

**Parameters**:
```json
{
  "support_price": 1.25,  // Target support price in USDT
  "tolerance": 0.02       // Price tolerance around support (2% = 0.02)
}
```

**Example**: Buy when price hits $1.25 ± 2%.

### 5. Moving Average Cross (moving_average_cross)
**Description**: Buy when fast moving average crosses above slow moving average (bullish signal).

**Parameters**:
```json
{
  "fast_ma": 20,      // Fast MA period (e.g., 20-period)
  "slow_ma": 50,      // Slow MA period (e.g., 50-period)
  "timeframe": "1h"   // Timeframe for MA calculation (15m, 1h, 4h, 1d)
}
```

**Example**: Buy when 20-period MA crosses above 50-period MA on 1-hour chart.

## Database Schema

### Coin Table Changes
The `coins` table has been extended with the following fields:

```sql
ALTER TABLE coins ADD COLUMN condition_type VARCHAR DEFAULT 'price_drop';
ALTER TABLE coins ADD COLUMN condition_params JSON DEFAULT '{"threshold": 5.0}';
ALTER TABLE coins ADD COLUMN logic_operator VARCHAR DEFAULT 'AND';
```

## API Changes

### Bot Creation Payload
```json
{
  "name": "My Advanced DCA Bot",
  "frequency": "1 hour",
  "chain_id": 1,
  "rpc_url": "https://eth-mainnet.g.alchemy.com/v2/your-api-key",
  "network_name": "Ethereum Mainnet",
  "coins": [
    {
      "token_address": "0x...",
      "amount": 10.0,
      "threshold": 5.0,
      "condition_type": "rsi_oversold",
      "condition_params": {
        "rsi_threshold": 30,
        "timeframe": "1h"
      },
      "logic_operator": "AND"
    }
  ]
}
```

## Frontend Components

### ConditionBuilder Component
A reusable React component that provides:
- Dynamic condition type selection
- Parameter configuration based on condition type
- Type-safe form inputs
- Real-time validation

### Usage Example
```tsx
import ConditionBuilder from '../components/ConditionBuilder';

<ConditionBuilder
  value={{
    condition_type: "price_drop",
    condition_params: { threshold: 5.0 },
    logic_operator: "AND"
  }}
  onChange={(conditionData) => handleConditionChange(conditionData)}
/>
```

## Backend Implementation

### Condition Evaluation
The trading logic now uses a flexible condition evaluation system:

```python
async def evaluate_trading_condition(coin: Coin, price_data: dict, chain_id: int) -> bool:
    """Evaluate trading condition based on coin's condition_type and parameters"""
    
    condition_type = getattr(coin, 'condition_type', 'price_drop')
    condition_params = getattr(coin, 'condition_params', {"threshold": coin.threshold})
    
    if condition_type == "price_drop":
        return evaluate_price_drop_condition(coin, price_data, condition_params)
    elif condition_type == "rsi_oversold":
        return await evaluate_rsi_condition(coin, price_data, condition_params, chain_id)
    # ... other conditions
```

### Backward Compatibility
The system maintains full backward compatibility:
- Existing bots continue to work with the original price drop logic
- Legacy bots automatically get `condition_type="price_drop"` and `condition_params={"threshold": original_threshold}`
- No data migration required for existing deployments

## Installation & Migration

1. **Update Database Schema**:
   ```bash
   cd backend
   python migrations/add_condition_fields.py
   ```

2. **Install Dependencies**:
   - Backend: No new dependencies required
   - Frontend: Uses existing Mantine components

3. **Test the System**:
   ```bash
   cd backend
   python test_conditions.py
   ```

## Configuration Examples

### Conservative DCA Strategy
```json
{
  "condition_type": "price_drop",
  "condition_params": {
    "threshold": 3.0
  }
}
```

### Aggressive Buy-the-Dip Strategy
```json
{
  "condition_type": "rsi_oversold",
  "condition_params": {
    "rsi_threshold": 25,
    "timeframe": "4h"
  }
}
```

### Volume-Based Strategy
```json
{
  "condition_type": "volume_spike",
  "condition_params": {
    "volume_multiplier": 3.0,
    "timeframe": "24h"
  }
}
```

### Support Level Strategy
```json
{
  "condition_type": "support_level",
  "condition_params": {
    "support_price": 1.50,
    "tolerance": 0.01
  }
}
```

### Technical Analysis Strategy
```json
{
  "condition_type": "moving_average_cross",
  "condition_params": {
    "fast_ma": 10,
    "slow_ma": 30,
    "timeframe": "1h"
  }
}
```

## Testing

### Backend Testing
```bash
cd backend
python test_conditions.py
```

### Frontend Testing
The ConditionBuilder component includes built-in validation and type checking.

## Future Enhancements

### Planned Features
1. **Multiple Conditions per Coin**: Combine conditions with AND/OR logic
2. **Custom Indicators**: RSI, MACD, Bollinger Bands with real data
3. **Backtesting**: Historical performance analysis for strategies
4. **Strategy Templates**: Pre-configured condition sets
5. **Advanced Notifications**: Condition-specific alerts

### Technical Improvements
1. **Real Technical Indicators**: Integration with TradingView or similar APIs
2. **Machine Learning**: AI-powered condition optimization
3. **Risk Management**: Position sizing based on volatility
4. **Performance Analytics**: Strategy comparison and optimization

## Troubleshooting

### Common Issues

1. **Import Error for `get_current_price_gecko`**:
   - Ensure `dca.py` is in the correct path
   - Check Python path configuration

2. **TypeScript Errors in ConditionBuilder**:
   - Verify Mantine version compatibility
   - Check for proper type imports

3. **Database Migration Issues**:
   - Run migration script with proper database URL
   - Ensure database backup before migration

### Support
For issues and questions, refer to the main project documentation or create an issue in the repository. 