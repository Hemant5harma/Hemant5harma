# Advanced Trading Bot Platform

An intelligent DCA (Dollar-Cost Averaging) trading bot platform with multi-condition strategies and cross-chain support.

## 🚀 Features

### Multi-Condition Trading Strategies

- **Price Drop**: Buy when price drops by specified percentage
- **RSI Oversold**: Buy when RSI indicates oversold conditions
- **Volume Spike**: Buy when trading volume increases significantly
- **Support Level**: Buy when price approaches support levels
- **Moving Average Cross**: Buy on bullish MA crossover signals

### Cross-Chain Support

- Ethereum Mainnet
- Polygon
- Binance Smart Chain
- Monad Testnet
- Arbitrum, Optimism, Avalanche, and more

### Advanced Features

- Real-time price monitoring via GeckoTerminal API
- Flexible condition builder with intuitive UI
- Comprehensive trading history and analytics
- Multi-chain bot management
- Backward compatibility with existing bots

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## 🛠️ Setup

### Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run database migration (for new condition system)
python migrations/add_condition_fields.py

# Start the API server
uvicorn src.api.main:app --reload
```

### Frontend Setup

```bash
# Install Node.js dependencies
npm install

# Start the React development server
npm start
```

### Testing the Condition System

```bash
cd backend
python test_conditions.py
```

## 📚 Documentation

For detailed information about the new multi-condition system, see [CONDITION_SYSTEM.md](./CONDITION_SYSTEM.md).

## 🔧 API Endpoints

The backend API runs on `http://localhost:8000` with the following key endpoints:

- `POST /bots/create` - Create a new trading bot with conditions
- `GET /bots/get` - Get all user bots with performance data
- `GET /bots/{bot_id}` - Get specific bot details
- `PUT /bots/{bot_id}/start` - Start a bot
- `PUT /bots/{bot_id}/pause` - Pause a bot
- `DELETE /bots/{bot_id}` - Delete a bot
