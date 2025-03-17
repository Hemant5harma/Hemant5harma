import pandas as pd

class DCABot:
    def __init__(self, historical_data, buy_thresholds=[5, 10, 15]):
        self.data = historical_data.copy()  # Ensure original data is not modified
        self.buy_thresholds = buy_thresholds
        self.calculate_indicators()

    def calculate_indicators(self):
        """Calculate SMA (7-day Simple Moving Average) and price drop percentage."""
        self.data['SMA'] = self.data['Close'].rolling(window=7, min_periods=1).mean()
        self.data['Price_Drop'] = self.data['Close'].pct_change() * 100

    def detect_buy_opportunity(self):
        """Detects buy opportunities based on price drop and SMA."""
        buy_signals = []
        for i in range(1, len(self.data)):
            drop = abs(self.data['Price_Drop'].iloc[i])
            close_price = self.data['Close'].iloc[i]
            sma_price = self.data['SMA'].iloc[i]

            if drop in self.buy_thresholds and close_price < sma_price:
                buy_signals.append((self.data.index[i], close_price, drop))

        return buy_signals

    def execute_trades(self):
        """Executes trades based on detected buy opportunities."""
        buy_opportunities = self.detect_buy_opportunity()
        if buy_opportunities:
            for date, price, drop in buy_opportunities:
                print(f"📢 Buying on {date.date()} at ${price:.2f}, price dropped {drop:.2f}%")
        else:
            print("🚫 No good buy opportunities found.")

    def debug(self):
        """Prints the DataFrame for debugging purposes."""
        print("\n📊 Data Overview:")
        print(self.data[['Close', 'SMA', 'Price_Drop']].round(2))