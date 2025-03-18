import pandas as pd

# for testing purposes

import requests

def get_token_data(symbol):
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "ids": symbol.lower(),
        "order": "market_cap_desc",
        "per_page": 1,
        "page": 1,
        "sparkline": False
    }

    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        data = response.json()
        if data:
            token = data[0]
            close_price = token.get("current_price", None)

            # Fetch historical data for SMA calculation
            history_url = f"https://api.coingecko.com/api/v3/coins/{symbol.lower()}/market_chart"
            history_params = {"vs_currency": "usd", "days": 7, "interval": "daily"}
            history_response = requests.get(history_url, params=history_params)

            if history_response.status_code == 200:
                history_data = history_response.json()
                prices = [entry[1] for entry in history_data.get("prices", [])]  # Extract Close Prices
                
                if len(prices) > 0:
                    sma = sum(prices) / len(prices)  # Use actual available data
                    price_drop = ((prices[-2] - close_price) / prices[-2]) * 100 if len(prices) > 1 else 0
                    
                    return {
                        "Symbol": token["symbol"].upper(),
                        "Name": token["name"],
                        "prices": prices,
                        "SMA (7-day)": round(sma, 2),
                        "Latest Close Price": close_price,
                        "Actual Price Drop (%)": round(price_drop, 2)
                    }
                else:
                    return {"Error": "Not enough historical data for SMA"}
            else:
                return {"Error": f"Failed to fetch historical data: {history_response.status_code}, {history_response.text}"}
        else:
            return {"Error": "Token not found"}
    else:
        return {"Error": f"API request failed: {response.status_code}, {response.text}"}

# Example: Fetch data for Bitcoin
token_symbol = input("Enter the token symbol: ")
token_data = get_token_data(token_symbol)

print(token_data["prices"])




class DCABot:
    def __init__(self, historical_data, buy_thresholds=[5, 10, 15]):
        self.data = historical_data.copy()  # Ensure original data is not modified
        self.buy_thresholds = buy_thresholds
        self.calculate_indicators()

    def calculate_indicators(self):
        """Calculate SMA (7-day Simple Moving Average) and price drop percentage."""
        self.data['SMA'] = self.data['Close'].rolling(window=7, min_periods=1).mean()
        self.data['Price_Drop'] = self.data['Close'].pct_change().fillna(0) * 100  # Fill NaN with 0

    def detect_buy_opportunity(self):
        """Detects buy opportunities based on price drop and SMA."""
        buy_signals = []
        for i in range(1, len(self.data)):
            drop = abs(self.data['Price_Drop'].iloc[i])
            close_price = self.data['Close'].iloc[i]
            sma_price = self.data['SMA'].iloc[i]

            # Check if drop exceeds any threshold instead of exact match
            if any(drop >= threshold for threshold in self.buy_thresholds) and close_price < sma_price:
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




test_data = {
    'Date': pd.date_range(start='2025-03-18', periods=7, freq='D'),
    'Close': token_data["prices"][:7]  # Sharp drop at end
}
df = pd.DataFrame(test_data)
df.set_index('Date', inplace=True)

# ✅ **Initialize and Test the Bot**
bot = DCABot(df)

# 🔹 Debug to check calculated SMA and price drops
bot.debug()

# 🔹 Test Buy Signal Detection
buy_signals = bot.detect_buy_opportunity()
print("\n📌 Detected Buy Signals:", buy_signals)

# 🔹 Execute Trades
bot.execute_trades()
