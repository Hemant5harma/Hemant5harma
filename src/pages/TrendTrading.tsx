import React, { useState, useEffect } from 'react';
import { FaBitcoin, FaEthereum } from 'react-icons/fa';
import { SiSolana } from 'react-icons/si';
import { cryptoData, CryptoData } from '../data/trendmockdata';

export default function TrendTrading() {
    const [selectedCrypto, setSelectedCrypto] = useState<string>('');
    const [investment, setInvestment] = useState<string>('');
    const [alertsEnabled, setAlertsEnabled] = useState<boolean>(false);
    const [selectedCryptoData, setSelectedCryptoData] = useState<CryptoData | null>(null);

    useEffect(() => {
        const selected = cryptoData.find(crypto => crypto.value === selectedCrypto);
        setSelectedCryptoData(selected || null);
    }, [selectedCrypto]);

    const filteredCryptoData = cryptoData.filter(
        crypto => crypto.price > 10 && crypto.volume > 100000
    );

    // Mock data for demonstration
    const currentROI = 12.5;
    const tradeHistory = [
        { asset: 'BTC', buyPrice: 30000, sellPrice: 32000, profitPercentage: 6.67 },
        { asset: 'ETH', buyPrice: 2000, sellPrice: 2200, profitPercentage: 10 },
        { asset: 'SOL', buyPrice: 50, sellPrice: 55, profitPercentage: 10 },
    ];

    return (
        <div className="min-h-screen ">
            <div className="text-black dark:text-white sm:p-6 min-h-screen">
                <div className="max-w-4xl mx-auto space-y-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-8">Trend Trading Bot</h1>

                    {/* Trade Execution Panel */}
                    <div className="bg-white dark:bg-boxdark p-4 sm:p-6 rounded-lg shadow-md space-y-4">
                        <h2 className="text-lg sm:text-xl font-semibold mb-4">Bot Configuration</h2>

                        <div>
                            <label htmlFor="crypto-select" className="block mb-2 text-sm sm:text-base">Select Crypto</label>
                            <select
                                id="crypto-select"
                                value={selectedCrypto}
                                onChange={(e) => setSelectedCrypto(e.target.value)}
                                className="w-full p-2 text-sm sm:text-base border rounded dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="">Choose an asset</option>
                                {filteredCryptoData.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedCryptoData && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-md text-sm sm:text-base">
                                <p>Token Price: ${selectedCryptoData.price.toFixed(2)}</p>
                                <p>Market Volume: ${selectedCryptoData.volume.toLocaleString()}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="investment" className="block mb-2 text-sm sm:text-base">Investment (USDT)</label>
                            <input
                                id="investment"
                                type="number"
                                value={investment}
                                onChange={(e) => setInvestment(e.target.value)}
                                className="w-full p-2 text-sm sm:text-base border rounded dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Enter investment amount"
                            />
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2 text-sm sm:text-base">Grid Steps</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm sm:text-base">
                                <div>
                                    <h4 className="font-medium mb-1">Buy Thresholds</h4>
                                    <ul className="list-disc list-inside">
                                        <li>-10%</li>
                                        <li>-15%</li>
                                        <li>-20%</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">Sell Thresholds</h4>
                                    <ul className="list-disc list-inside">
                                        <li>+10%</li>
                                        <li>+15%</li>
                                        <li>+20%</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base">
                            Create Bot
                        </button>
                    </div>

                    {/* Performance Summary */}
                    <div className="bg-white dark:bg-boxdark p-4 sm:p-6 rounded-lg shadow-md space-y-4">
                        <h2 className="text-lg sm:text-xl font-semibold mb-4">Performance Summary</h2>

                        <div className="text-center">
                            <h3 className="text-base sm:text-lg font-medium">Current ROI</h3>
                            <p className={`text-2xl sm:text-3xl font-bold ${currentROI >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {currentROI >= 0 ? '+' : ''}{currentROI.toFixed(2)}%
                            </p>
                        </div>

                        <div>
                            <h3 className="text-base sm:text-lg font-medium mb-2">Trade History</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white dark:bg-gray-700 shadow-md rounded-lg overflow-hidden">
                                    <thead className="bg-gray-200 dark:bg-gray-600">
                                        <tr>
                                            <th className="py-2 px-3 sm:px-4 text-left text-xs sm:text-sm">Asset</th>
                                            <th className="py-2 px-3 sm:px-4 text-left text-xs sm:text-sm">Buy Price</th>
                                            <th className="py-2 px-3 sm:px-4 text-left text-xs sm:text-sm">Sell Price</th>
                                            <th className="py-2 px-3 sm:px-4 text-left text-xs sm:text-sm">Profit %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tradeHistory.map((trade, index) => (
                                            <tr key={index} className="border-b dark:border-gray-600">
                                                <td className="py-2 px-3 sm:px-4 text-xs sm:text-sm">{trade.asset}</td>
                                                <td className="py-2 px-3 sm:px-4 text-xs sm:text-sm">${trade.buyPrice.toFixed(2)}</td>
                                                <td className="py-2 px-3 sm:px-4 text-xs sm:text-sm">${trade.sellPrice.toFixed(2)}</td>
                                                <td className={`py-2 px-3 sm:px-4 text-xs sm:text-sm ${trade.profitPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {trade.profitPercentage >= 0 ? '+' : ''}{trade.profitPercentage.toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Alerts Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm sm:text-base">Enable Alerts</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={alertsEnabled}
                                    onChange={(e) => setAlertsEnabled(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

