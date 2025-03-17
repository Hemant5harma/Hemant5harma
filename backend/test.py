import pandas as pd
from bot_strategy.dca import DCABot


data = {
    'Date': pd.date_range(start='2025-03-11', periods=15, freq='D'),
    'Close': [100, 98, 95, 92, 90, 85, 80, 95, 100, 105, 110, 108, 106, 102, 98]  # Price drops included
}
df = pd.DataFrame(data)
df.set_index('Date', inplace=True)

bot = DCABot(df)


bot.debug()


buy_signals = bot.detect_buy_opportunity()
print("\n📌 Detected Buy Signals:", buy_signals)

#  Execute Trades
bot.execute_trades()