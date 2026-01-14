# Grid Trading Bot - Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GRID TRADING BOT SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: USER CONFIGURATION                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Bot Name: "My Grid Bot"                                                │
│  Network: Solana                                                         │
│  Trading Frequency: [24h] [Weekly] [Monthly] [Yearly]                  │
│  Trading Wallet: 0xabc...xyz (Balance: $50,000 USDT)                   │
│  Profit Wallet: 0xdef...789 (can be any address, no key needed)        │
│  Reinvest Rate: 50%                                                      │
│                                                                          │
│  [Next: Add Grid Pairs →]                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: GRID PAIR CONFIGURATION                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Preset: [[Neutral]] [Bull] [Bear]  (Neutral: 3 grids default)         │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ GRID 1: SOL/USDT                                  [Remove ×]    │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Trading Condition: [Price Drop %] [High Price Drop % (24h)]    │   │
│  │ Investment: $10,000                                             │   │
│  │   ├─ [25%] [50%] [75%] [100%]  or  Slider [═══●═════] 0-100%  │   │
│  │ Buy Threshold: -5%                                              │   │
│  │ ROI Target: +10% (profit after fees)                           │   │
│  │ Buy Fee: 0.1%  |  Sell Fee: 0.1%                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ GRID 2: SOL/USDT                                  [Remove ×]    │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Trading Condition: [Price Drop %] [High Price Drop % (24h)]    │   │
│  │ Investment: $10,000                                             │   │
│  │   ├─ [25%] [50%] [75%] [100%]  or  Slider [═══●═════] 0-100%  │   │
│  │ Buy Threshold: -10%                                             │   │
│  │ ROI Target: +15% (profit after fees)                           │   │
│  │ Buy Fee: 0.1%  |  Sell Fee: 0.1%                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ GRID 3: SOL/USDT                                  [Remove ×]    │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Trading Condition: [Price Drop %] [High Price Drop % (24h)]    │   │
│  │ Investment: $10,000                                             │   │
│  │   ├─ [25%] [50%] [75%] [100%]  or  Slider [═══●═════] 0-100%  │   │
│  │ Buy Threshold: -15%                                             │   │
│  │ ROI Target: +20% (profit after fees)                           │   │
│  │ Buy Fee: 0.1%  |  Sell Fee: 0.1%                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [+ Add Another Grid] (Max 10 grids)                                    │
│                                                                          │
│  Note: Grid bot typically uses same pair (e.g., SOL/USDT) with         │
│        increasing thresholds to catch all big movements up/down         │
│                                                                          │
│  [← Back]  [Create & Start Bot →]                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ BOT EXECUTION ENGINE (Backend)                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ MONITORING LOOP (Per Grid)                                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Loop Frequency: Check every 1 minute (10 sec between grids in batch)  │
│                                                                          │
│  1. Fetch Market Data                                                   │
│     ├─ Current Price: $136.00                                          │
│     ├─ Price Change % (based on Trading Frequency):                    │
│     │  ├─ 24h: -3.5%   (if Trading Frequency = 24h)                   │
│     │  ├─ Weekly: +5.2% (if Trading Frequency = Weekly)                │
│     │  ├─ Monthly: +12.8% (if Trading Frequency = Monthly)             │
│     │  └─ Yearly: +45.3% (if Trading Frequency = Yearly)               │
│     ├─ 24h High: $141.00 (only used if Condition = "High Drop % 24h") │
│     ├─ Last Updated: 2s ago ✓                                          │
│     └─ Volume: $500M                                                    │
│                                                                          │
│  2. Calculate Drop % (based on Trading Condition)                       │
│                                                                          │
│     IF Trading Condition = "Price Drop %":                              │
│        Use percentage from Trading Frequency period                     │
│        drop_pct = -3.5% (from 24h chart data)                          │
│                                                                          │
│     IF Trading Condition = "High Price Drop % (24h)":                  │
│        drop_pct = ((136 - 141) / 141) × 100 = -3.546%                 │
│                                                                          │
│  3. Check Buy Trigger                                                    │
│     -3.546% <= -5%? NO → Continue Monitoring                           │
│                                                                          │
│     [Wait 1 minute... price drops to $134]                             │
│                                                                          │
│     drop_pct = ((134 - 141) / 141) × 100 = -4.965%                    │
│     -4.965% <= -5%? NO → Continue Monitoring                           │
│                                                                          │
│     [Wait 1 minute... price drops to $133]                             │
│                                                                          │
│     drop_pct = ((133 - 141) / 141) × 100 = -5.674%                    │
│     -5.674% <= -5%? YES ✓ → TRIGGER BUY!                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ BUY EXECUTION                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Input:                                                                  │
│  ├─ Investment: $10,000                                                 │
│  ├─ Buy Price: $133.00                                                  │
│  └─ Buy Fee: 0.1%                                                       │
│                                                                          │
│  Calculations:                                                           │
│  ├─ Buy Fee: $10,000 × 0.001 = $10.00                                 │
│  ├─ Net Investment: $10,000 - $10 = $9,990                            │
│  └─ Quantity: $9,990 ÷ $133 = 75.1 SOL                                │
│                                                                          │
│  Order Placed:                                                           │
│  ✓ Buy 75.1 SOL at $133.00                                             │
│  ✓ Total Cost: $10,000 (including $10 fee)                            │
│  ✓ Average Price: $133.13 per SOL                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ CALCULATE SELL TARGET                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Formula: Ps = Pb × (1 + r) ÷ ((1 - fb) × (1 - fs))                   │
│                                                                          │
│  Where:                                                                  │
│  ├─ Pb (Buy Price) = $133.00                                           │
│  ├─ r (ROI Target) = 0.10 (10%)                                        │
│  ├─ fb (Buy Fee) = 0.001 (0.1%)                                        │
│  └─ fs (Sell Fee) = 0.001 (0.1%)                                       │
│                                                                          │
│  Calculation:                                                            │
│  Ps = 133 × 1.10 ÷ (0.999 × 0.999)                                    │
│  Ps = 146.30 ÷ 0.998001                                                │
│  Ps = $146.59                                                           │
│                                                                          │
│  ✓ Set Sell Target: $146.59                                            │
│  ✓ Monitor Price for Sell Trigger                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ SELL MONITORING                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Watching for: Current Price >= $146.59                                │
│                                                                          │
│  Time: 10:00 AM → Price: $136.50 → Wait...                            │
│  Time: 10:05 AM → Price: $141.20 → Wait...                            │
│  Time: 10:10 AM → Price: $145.95 → Wait...                            │
│  Time: 10:12 AM → Price: $146.80 → SELL! ✓                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ SELL EXECUTION                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Order:                                                                  │
│  ├─ Sell 75.1 SOL                                                       │
│  ├─ Price: $146.80                                                      │
│  └─ Sell Fee: 0.1%                                                      │
│                                                                          │
│  Calculations:                                                           │
│  ├─ Gross Proceeds: 75.1 × $146.80 = $11,024.68                       │
│  ├─ Sell Fee: $11,024.68 × 0.001 = $11.02                             │
│  ├─ Net Proceeds: $11,024.68 - $11.02 = $11,013.66                    │
│  └─ Net Profit: $11,013.66 - $10,000 = $1,013.66                      │
│                                                                          │
│  ROI:                                                                    │
│  └─ ($1,013.66 ÷ $10,000) × 100 = 10.14% ✓                            │
│                                                                          │
│  ✓ Target ROI: 10.00%                                                  │
│  ✓ Actual ROI: 10.14%                                                  │
│  ✓ SUCCESS!                                                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PROFIT DISTRIBUTION                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Net Profit: $1,013.66                                                  │
│  Reinvest Rate: 50%                                                      │
│                                                                          │
│  Distribution:                                                           │
│  ├─ Reinvest: $1,013.66 × 0.50 = $506.83                              │
│  └─ Profit Wallet: $1,013.66 - $506.83 = $506.83                      │
│                                                                          │
│  Actions:                                                                │
│  ✓ Add $506.83 to trading capital                                      │
│  ✓ Transfer $506.83 to profit wallet                                   │
│  ✓ New Trading Capital: $10,506.83                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ TRADE HISTORY UPDATE                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Record Trade:                                                           │
│  ├─ Pair: SOL/USDT (Grid 1)                                            │
│  ├─ Buy: 75.1 SOL @ $133.00                                            │
│  ├─ Sell: 75.1 SOL @ $146.80                                           │
│  ├─ Investment: $10,000                                                 │
│  ├─ Buy Fee: $10.00                                                     │
│  ├─ Sell Fee: $11.02                                                    │
│  ├─ Gross Profit: $1,034.68                                             │
│  ├─ Net Profit: $1,013.66                                               │
│  ├─ Net ROI: 10.14%                                                     │
│  ├─ Duration: 12 minutes                                                │
│  ├─ Reinvested: $506.83                                                 │
│  └─ To Profit Wallet: $506.83                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STATISTICS UPDATE                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐        │
│  │ Total Profit │   Avg ROI    │   Win Rate   │ Total Trades │        │
│  ├──────────────┼──────────────┼──────────────┼──────────────┤        │
│  │  $1,013.66   │   10.14%     │    100.0%    │      1       │        │
│  └──────────────┴──────────────┴──────────────┴──────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ CYCLE REPEATS                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  New Investment: $10,506.83 (original + reinvested)                    │
│  → Back to Monitoring Loop                                              │
│  → Looking for next buy opportunity                                     │
│  → Compound growth in action! 📈                                        │
│                                                                          │
└──────────────────────────────────────────────────────═══════════════════════════════════════════════════════════════════════════

This visual diagram shows the complete flow of the Grid Trading Bot from
configuration through execution, profit distribution, and error handling.

The bot continuously cycles through monitoring → buy → sell → profit → repeat,
with comprehensive error handling and state management at every step.

═══════════════════════════════════════════════════════════════════════════───────────────────┘


═══════════════════════════════════════════════════════════════════════════
                          MULTI-GRID EXAMPLE
═══════════════════════════════════════════════════════════════════════════

TYPICAL SCENARIO: Same Pair (SOL/USDT) with Multiple Grids
Purpose: Catch all big movements down (for buying) and up (for selling)

┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│   GRID 1     │   GRID 2     │   GRID 3     │   GRID 4     │   GRID 5     │
│  SOL/USDT    │  SOL/USDT    │  SOL/USDT    │  SOL/USDT    │  SOL/USDT    │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ $10,000      │ $10,000      │ $10,000      │ $10,000      │ $10,000      │
│ Buy: -5%     │ Buy: -10%    │ Buy: -15%    │ Buy: -20%    │ Buy: -25%    │
│ Sell: +10%   │ Sell: +15%   │ Sell: +20%   │ Sell: +25%   │ Sell: +30%   │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
       ↓              ↓              ↓              ↓              ↓
   WATCHING       WATCHING       WATCHING       WATCHING       WATCHING

Time: 10:00 AM (Price: $141)
├─ Grid 1: -0% ❌ │ Grid 2: -0% ❌ │ Grid 3: -0% ❌ │ Grid 4: -0% ❌ │ Grid 5: -0% ❌
└─ All grids watching...

Time: 10:15 AM (Price drops to $133)
├─ Grid 1: -5.7% ✓ │ Grid 2: -5.7% ❌ │ Grid 3: -5.7% ❌ │ Grid 4: -5.7% ❌ │ Grid 5: -5.7% ❌
└─ Action: Buy Grid 1 @ $133 ✓

Time: 10:30 AM (Price drops further to $125)
├─ Grid 1: Bought │ Grid 2: -11.3% ✓ │ Grid 3: -11.3% ❌ │ Grid 4: -11.3% ❌ │ Grid 5: -11.3% ❌
└─ Action: Buy Grid 2 @ $125 ✓

Time: 11:00 AM (Price recovers to $146)
├─ Grid 1: +9.8% → Sell @ $146.30 ✓ │ Grid 2: Monitoring... │ Others: Watching
└─ Action: Sell Grid 1 (+$1,000 profit), reset to watching

Time: 11:30 AM (Price continues up to $143)
├─ Grid 1: Watching │ Grid 2: +14.4% → Sell @ $143.75 ✓ │ Others: Watching
└─ Action: Sell Grid 2 (+$1,500 profit), reset to watching

... and so on ...

ALTERNATIVE: Multi-Token Scenario (Less Common)
Same network (Solana), different tokens, same grid bot:

┌──────────────┬──────────────┬──────────────┐
│   GRID 1     │   GRID 2     │   GRID 3     │
│  SOL/USDT    │  BONK/USDT   │   JUP/USDT   │
├──────────────┼──────────────┼──────────────┤
│ $15,000      │ $10,000      │ $5,000       │
│ Buy: -5%     │ Buy: -10%    │ Buy: -8%     │
│ Sell: +10%   │ Sell: +20%   │ Sell: +15%   │
└──────────────┴──────────────┴──────────────┘

═══════════════════════════════════════════════════════════════════════════


═══════════════════════════════════════════════════════════════════════════
                         ERROR HANDLING FLOWS
═══════════════════════════════════════════════════════════════════════════

ERROR 1: Stale Price Data
┌─────────────────────────────────────────────────────────────────────────┐
│ Fetch Price → Last Updated: 45 seconds ago                              │
│ Check Staleness: 45s > 30s threshold ❌                                 │
│ Action: Skip this cycle, log warning, retry in 10s                     │
│ Alert: "Price data stale, waiting for fresh data"                      │
└─────────────────────────────────────────────────────────────────────────┘

ERROR 2: Insufficient Balance
┌─────────────────────────────────────────────────────────────────────────┐
│ Buy Trigger: YES ✓                                                      │
│ Check Balance: Need $10,000, Have $5,000 ❌                            │
│ Action: Cancel buy, pause bot, send alert                              │
│ Alert: "Insufficient balance: Need $10,000, have $5,000"               │
└─────────────────────────────────────────────────────────────────────────┘

ERROR 3: Partial Fill
┌─────────────────────────────────────────────────────────────────────────┐
│ Order: Buy 100 SOL                                                       │
│ Filled: 60 SOL (60%)                                                     │
│ Action:                                                                  │
│  ├─ Record 60 SOL position                                              │
│  ├─ Refund unused capital ($4,000)                                      │
│  ├─ Calculate sell target for 60 SOL only                               │
│  └─ Continue monitoring                                                  │
│ ✓ Handled gracefully                                                    │
└─────────────────────────────────────────────────────────────────────────┘

ERROR 4: Order Failure
┌─────────────────────────────────────────────────────────────────────────┐
│ Order Placed → Exchange Error: "Rate limit exceeded"                   │
│ Action:                                                                  │
│  ├─ Wait 60 seconds                                                     │
│  ├─ Retry order (max 3 attempts)                                        │
│  └─ If all fail: log error, alert user, continue monitoring            │
│ Alert: "Order failed after 3 attempts, will retry on next trigger"     │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                            STATE DIAGRAM
═══════════════════════════════════════════════════════════════════════════

                         ┌──────────────┐
                         │     IDLE     │
                         │   (Stopped)  │
                         └──────┬───────┘
                                │ [User clicks Start]
                                ↓
                         ┌──────────────┐
                    ┌───→│   WATCHING   │←───┐
                    │    │ (Monitoring) │    │
                    │    └──────┬───────┘    │
                    │           │            │
                    │   [Price drop >= threshold]
                    │           ↓            │
                    │    ┌──────────────┐   │
                    │    │BUY_TRIGGERED │   │
                    │    │ (Placing buy)│   │
                    │    └──────┬───────┘   │
                    │           │            │
                    │   [Order filled]       │
                    │           ↓            │
                    │    ┌──────────────┐   │
                    │    │    BOUGHT    │   │
                    │    │  (Holding)   │   │
                    │    └──────┬───────┘   │
                    │           │            │
                    │   [Calculate sell target]
                    │           ↓            │
                    │    ┌──────────────┐   │
                    │    │SELL_MONITOR  │   │
                    │    │ (Watching)   │   │
                    │    └──────┬───────┘   │
                    │           │            │
                    │   [Price >= target]    │
                    │           ↓            │
                    │    ┌──────────────┐   │
                    │    │SELL_TRIGGERED│   │
                    │    │ (Placing)    │   │
                    │    └──────┬───────┘   │
                    │           │            │
                    │   [Order filled]       │
                    │           ↓            │
                    │    ┌──────────────┐   │
                    │    │     SOLD     │   │
                    │    │ (Completed)  │   │
                    │    └──────┬───────┘   │
                    │           │            │
                    │   [Record trade, distribute profit]
                    │           │            │
                    └───────────┴────────────┘
                           [Continue if bot running]


```
