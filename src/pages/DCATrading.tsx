import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CryptoCard from '../components/CryptoCard';


interface DCAState {
    entryPrice: number;
    currentPrice: number;
    portfolioValue: number;
    dcaThresholds: number[];
    notifications: Notification[];
    dcaSettings: {
        asset: string;
        totalInvestment: number;
        frequency: string;
        duration: string;
        startTime: string;
        botName: string;
        thresholdValue: number;
    };
    availableBalance: number;
}

interface Notification {
    id: string;
    type: 'buy' | 'sell';
    message: string;
    timestamp: number;
}

const initialState: DCAState = {
    entryPrice: 50000,
    currentPrice: 48000,
    portfolioValue: 10000,
    dcaThresholds: [-10, -15, -20],
    notifications: [
        { id: '1', type: 'buy', message: 'Buy opportunity: Price dropped by 10%', timestamp: Date.now() - 86400000 },
        { id: '2', type: 'sell', message: 'Sell opportunity: 50% gain on portfolio', timestamp: Date.now() - 172800000 },
    ],
    dcaSettings: {
        asset: 'ETH',
        totalInvestment: 0,
        frequency: '1 Day',
        duration: '6 Months',
        startTime: 'Now',
        botName: 'DCA Bot 1',
        thresholdValue: -10
    },
    availableBalance: 990059.94
};

const cryptocurrencies = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'BNB', name: 'Binance Coin' },
    { symbol: 'ADA', name: 'Cardano' },
];

const generateChartDatafortrend = (
    count: number,
    initialPrice: number,
    trend: "up" | "down"
) => {
    return Array.from({ length: count }, (_, i) => ({
        date: new Date(Date.now() - (count - i) * 86400000)
            .toISOString()
            .split("T")[0],
        price:
            trend === "up"
                ? initialPrice * (1 + ((Math.random() * 0.1 + 0.01) * i) / count)
                : initialPrice * (1 - ((Math.random() * 0.1 + 0.01) * i) / count),
    }));
};

const DCATrading: React.FC = () => {
    const [dca, setDca] = useState<DCAState>(initialState);
    const [newThreshold, setNewThreshold] = useState('');
    const [showDCAModal, setShowDCAModal] = useState(false);
    const [selectedCrypto, setSelectedCrypto] = useState(cryptocurrencies[1]);

    const handleAddThreshold = () => {
        const threshold = parseFloat(newThreshold);
        if (!isNaN(threshold)) {
            setDca(prevState => ({
                ...prevState,
                dcaThresholds: [...prevState.dcaThresholds, threshold].sort((a, b) => a - b)
            }));
            setNewThreshold('');
        }
    };

    const handleCreateDCA = () => {
        setShowDCAModal(true);
    };

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
            message: `New DCA created for ${selectedCrypto.symbol}: ${dca.dcaSettings.totalInvestment} USDT`,
            timestamp: Date.now()
        };

        setDca(prevState => ({
            ...prevState,
            notifications: [newNotification, ...prevState.notifications],
            portfolioValue: prevState.portfolioValue + dca.dcaSettings.totalInvestment,
            dcaSettings: {
                ...prevState.dcaSettings,
                asset: selectedCrypto.symbol
            }
        }));

        setShowDCAModal(false);
    };

    const handleChangeCrypto = (crypto: { symbol: string; name: string }) => {
        setSelectedCrypto(crypto);
        setDca(prevState => ({
            ...prevState,
            currentPrice: Math.random() * 10000,
            dcaSettings: {
                ...prevState.dcaSettings,
                asset: crypto.symbol
            }
        }));
    };

    const handleRemoveThreshold = (thresholdToRemove: number) => {
        setDca(prevState => ({
            ...prevState,
            dcaThresholds: prevState.dcaThresholds.filter(t => t !== thresholdToRemove)
        }));
    };

    const thresholdOptions = [-5, -10, -15, -20, -25, -30];

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-black dark:text-white mb-4 md:mb-0">DCA Trading Bot</h1>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <select
                                value={selectedCrypto.symbol}
                                onChange={(e) => handleChangeCrypto(cryptocurrencies.find(c => c.symbol === e.target.value)!)}
                                className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                            >
                                {cryptocurrencies.map((crypto) => (
                                    <option key={crypto.symbol} value={crypto.symbol}>
                                        {crypto.name} ({crypto.symbol})
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>
                        <button
                            onClick={handleCreateDCA}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
                        >
                            Create DCA
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Portfolio Overview</h2>
                        <p className="mb-2 text-black dark:text-gray-300">Entry Price: ${dca.entryPrice.toFixed(2)}</p>
                        <p className="mb-2 text-black dark:text-gray-300">Current Price: ${dca.currentPrice.toFixed(2)}</p>
                        <p className="mb-2 text-black dark:text-gray-300">Portfolio Value: ${dca.portfolioValue.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Performance: {((dca.currentPrice / dca.entryPrice - 1) * 100).toFixed(2)}%
                        </p>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">DCA Thresholds</h2>
                        <div className="mb-4">
                            <p className="mb-2 text-black dark:text-gray-300">Current Thresholds:</p>
                            <ul className="space-y-2">
                                {dca.dcaThresholds.map((threshold, index) => (
                                    <li key={index} className="flex items-center justify-between bg-white dark:bg-gray-600 p-2 rounded">
                                        <span className="text-black dark:text-gray-300">{threshold}%</span>
                                        <button
                                            onClick={() => handleRemoveThreshold(threshold)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex">
                            <input
                                type="number"
                                value={newThreshold}
                                onChange={(e) => setNewThreshold(e.target.value)}
                                className="flex-grow mr-2 p-2 border rounded dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                placeholder="New threshold (%)"
                            />
                            <button
                                onClick={handleAddThreshold}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showDCAModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: "spring", damping: 15, stiffness: 300 }}
                                className="relative w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
                            >
                                <button
                                    onClick={() => setShowDCAModal(false)}
                                    className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">
                                    Create a DCA for {selectedCrypto.name}
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Buy {selectedCrypto.symbol}
                                            </label>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Current Price: {dca.currentPrice.toFixed(2)} USDT
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Total Investment (USDT)
                                            </label>
                                            <input
                                                type="number"
                                                value={dca.dcaSettings.totalInvestment}
                                                onChange={(e) => handleUpdateDCASettings('totalInvestment', parseFloat(e.target.value))}
                                                className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                            />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Available Balance: {dca.availableBalance.toFixed(2)} USDT
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Threshold Value
                                            </label>
                                            <select
                                                value={dca.dcaSettings.thresholdValue}
                                                onChange={(e) => handleUpdateDCASettings('thresholdValue', parseFloat(e.target.value))}
                                                className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                            >
                                                {thresholdOptions.map((threshold) => (
                                                    <option key={threshold} value={threshold}>
                                                        {threshold}%
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
                                            <select
                                                value={dca.dcaSettings.frequency}
                                                onChange={(e) => handleUpdateDCASettings('frequency', e.target.value)}
                                                className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                            >
                                                <option>1 Day</option>
                                                <option>1 Week</option>
                                                <option>2 Weeks</option>
                                                <option>1 Month</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
                                            <select
                                                value={dca.dcaSettings.duration}
                                                onChange={(e) => handleUpdateDCASettings('duration', e.target.value)}
                                                className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                            >
                                                <option>1 Month</option>
                                                <option>3 Months</option>
                                                <option>6 Months</option>
                                                <option>1 Year</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bot Name</label>
                                            <input
                                                type="text"
                                                value={dca.dcaSettings.botName}
                                                onChange={(e) => handleUpdateDCASettings('botName', e.target.value)}
                                                className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-2 mt-6">
                                    <button
                                        onClick={() => setShowDCAModal(false)}
                                        className="px-4 py-2 border rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitDCA}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Create DCA
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Recent Notifications</h2>
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg max-h-60 overflow-y-auto">
                            {dca.notifications.map((notification) => (
                                <div key={notification.id} className="mb-2 p-2 bg-white dark:bg-gray-600 rounded shadow">
                                    <p className={`text-sm ${notification.type === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-300">
                                        {new Date(notification.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Price Trend</h2>
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg ">
                            <CryptoCard
                                symbol="BTC"
                                price="$98,804.36"
                                change="1.56"
                                chartData={generateChartDatafortrend(30, 98804.36, "up")}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DCATrading;

