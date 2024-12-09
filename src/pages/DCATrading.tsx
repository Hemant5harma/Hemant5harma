import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ManageBots from './ManageBots';

interface DCAState {
    notifications: Notification[];
    dcaSettings: {
        asset: string;
        totalInvestment: number;
        frequency: string;
        duration: string;
        botName: string;
        thresholdValue: number;
    };
    availableBalance: number;
    tradingType: 'spot' | 'futures';
    futuresStrategy: 'long' | 'short';
}

interface Notification {
    id: string;
    type: 'buy' | 'sell';
    message: string;
    timestamp: number;
}

const initialState: DCAState = {
    notifications: [
        { id: '1', type: 'buy', message: 'Buy opportunity: Price dropped by 10%', timestamp: Date.now() - 86400000 },
        { id: '2', type: 'sell', message: 'Sell opportunity: 50% gain on portfolio', timestamp: Date.now() - 172800000 },
    ],
    dcaSettings: {
        asset: 'ETH',
        totalInvestment: 0,
        frequency: '1 Day',
        duration: '6 Months',
        botName: 'DCA Bot 1',
        thresholdValue: 10
    },
    availableBalance: 990059.94,
    tradingType: 'spot',
    futuresStrategy: 'long'
};

const cryptocurrencies = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'BNB', name: 'Binance Coin' },
    { symbol: 'ADA', name: 'Cardano' },
];

const DCATrading: React.FC = () => {
    const [dca, setDca] = useState<DCAState>(initialState);
    const [selectedCrypto, setSelectedCrypto] = useState(cryptocurrencies[1]);

    const handleUpdateDCASettings = (field: keyof DCAState['dcaSettings'], value: string | number) => {
        setDca(prevState => ({
            ...prevState,
            dcaSettings: {
                ...prevState.dcaSettings,
                [field]: value
            }
        }));
    };

    const handleSubmitDCA = () => {
        if (dca.dcaSettings.totalInvestment <= 0 || dca.dcaSettings.totalInvestment > dca.availableBalance) {
            alert('Invalid investment amount');
            return;
        }

        const newNotification = {
            id: Date.now().toString(),
            type: 'buy' as const,
            message: `New DCA created for ${selectedCrypto.symbol}: ${dca.dcaSettings.totalInvestment} USDT (${dca.tradingType} ${dca.tradingType === 'futures' ? `- ${dca.futuresStrategy}` : ''})`,
            timestamp: Date.now()
        };

        setDca(prevState => ({
            ...prevState,
            notifications: [newNotification, ...prevState.notifications],
            dcaSettings: {
                ...prevState.dcaSettings,
                asset: selectedCrypto.symbol
            }
        }));
    };

    const handleChangeCrypto = (crypto: { symbol: string; name: string }) => {
        setSelectedCrypto(crypto);
        setDca(prevState => ({
            ...prevState,
            dcaSettings: {
                ...prevState.dcaSettings,
                asset: crypto.symbol
            }
        }));
    };

    const handleTradingTypeChange = (type: 'spot' | 'futures') => {
        setDca(prevState => ({
            ...prevState,
            tradingType: type,
        }));
    };

    const handleFuturesStrategyChange = (strategy: 'long' | 'short') => {
        setDca(prevState => ({
            ...prevState,
            futuresStrategy: strategy,
        }));
    };

    return (
        <div className="min-h-screen p-1 text-black dark:text-white">
            <div className="max-w-7xl mx-auto bg-white dark:bg-boxdark rounded-xl shadow-md p-4">
                <h1 className="text-3xl font-bold mb-6 text-center">DCA Trading Bot Creator</h1>

                <div className="lg:flex lg:space-x-6">
                    <div className="lg:w-2/3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <label className="block text-sm font-medium mb-2">
                                    Select Cryptocurrency
                                </label>
                                <select
                                    value={selectedCrypto.symbol}
                                    onChange={(e) => handleChangeCrypto(cryptocurrencies.find(c => c.symbol === e.target.value)!)}
                                    className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {cryptocurrencies.map((crypto) => (
                                        <option key={crypto.symbol} value={crypto.symbol}>
                                            {crypto.name} ({crypto.symbol})
                                        </option>
                                    ))}
                                </select>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <label className="block text-sm font-medium mb-2">
                                    Trading Type
                                </label>
                                <select
                                    value={dca.tradingType}
                                    onChange={(e) => handleTradingTypeChange(e.target.value as 'spot' | 'futures')}
                                    className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="spot">Spot</option>
                                    <option value="futures">Futures</option>
                                </select>
                            </motion.div>

                            {dca.tradingType === 'futures' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    <label className="block text-sm font-medium mb-2">
                                        Futures Strategy
                                    </label>
                                    <select
                                        value={dca.futuresStrategy}
                                        onChange={(e) => handleFuturesStrategyChange(e.target.value as 'long' | 'short')}
                                        className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="long">Long</option>
                                        <option value="short">Short</option>
                                    </select>
                                </motion.div>
                            )}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <label className="block text-sm font-medium mb-2">
                                    Total Investment (USDT)
                                </label>
                                <input
                                    type="number"
                                    value={dca.dcaSettings.totalInvestment}
                                    onChange={(e) => handleUpdateDCASettings('totalInvestment', parseFloat(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Available Balance: {dca.availableBalance.toFixed(2)} USDT
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <label className="block text-sm font-medium mb-2">
                                    Threshold Value
                                </label>
                                <input
                                    type="number"
                                    value={dca.dcaSettings.thresholdValue}
                                    onChange={(e) => handleUpdateDCASettings('thresholdValue', parseInt(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <label className="block text-sm font-medium mb-2">
                                    Frequency
                                </label>
                                <select
                                    value={dca.dcaSettings.frequency}
                                    onChange={(e) => handleUpdateDCASettings('frequency', e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option>1 Day</option>
                                    <option>1 Week</option>
                                    <option>2 Weeks</option>
                                    <option>1 Month</option>
                                </select>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.6 }}
                            >
                                <label className="block text-sm font-medium mb-2">
                                    Duration
                                </label>
                                <select
                                    value={dca.dcaSettings.duration}
                                    onChange={(e) => handleUpdateDCASettings('duration', e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option>1 Month</option>
                                    <option>3 Months</option>
                                    <option>6 Months</option>
                                    <option>1 Year</option>
                                </select>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.7 }}
                            >
                                <label className="block text-sm font-medium mb-2">
                                    Bot Name
                                </label>
                                <input
                                    type="text"
                                    value={dca.dcaSettings.botName}
                                    onChange={(e) => handleUpdateDCASettings('botName', e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                        >
                            <button
                                onClick={handleSubmitDCA}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Create DCA Bot
                            </button>
                        </motion.div>
                    </div>

                    <motion.div
                        className="lg:w-1/3 mt-6 lg:mt-0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.9 }}
                    >
                        <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
                        <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                            {dca.notifications.map((notification) => (
                                <div key={notification.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-md">
                                    <p className={`text-sm ${notification.type === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-green-600 dark:text-red-400'}`}>
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {new Date(notification.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto mt-4 rounded-xl shadow-md p-4">
                <ManageBots />
            </div>
        </div>
    );
};

export default DCATrading;

