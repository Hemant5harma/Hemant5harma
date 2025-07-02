import React, { useState, useEffect } from 'react';
import { cryptoData, CryptoData } from '../data/trendmockdata';

export default function TrendTrading() {
  const [selectedCrypto, setSelectedCrypto] = useState<string>('');
  const [investment, setInvestment] = useState<string>('');
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(false);
  const [selectedCryptoData, setSelectedCryptoData] = useState<CryptoData | null>(null);

  useEffect(() => {
    const selected = cryptoData.find((crypto) => crypto.value === selectedCrypto);
    setSelectedCryptoData(selected || null);
  }, [selectedCrypto]);

  const filteredCryptoData = cryptoData.filter(
    (crypto) => crypto.price > 10 && crypto.volume > 100000,
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
      <div className="min-h-screen text-black dark:text-white sm:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="mb-4 text-center text-2xl font-bold sm:mb-8 sm:text-3xl">
            Trend Trading Bot
          </h1>

          {/* Trade Execution Panel */}
          <div className="space-y-4 rounded-lg bg-white p-4 shadow-md dark:bg-boxdark sm:p-6">
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">Bot Configuration</h2>

            <div>
              <label htmlFor="crypto-select" className="mb-2 block text-sm sm:text-base">
                Select Crypto
              </label>
              <select
                id="crypto-select"
                value={selectedCrypto}
                onChange={(e) => setSelectedCrypto(e.target.value)}
                className="w-full rounded border p-2 text-sm dark:border-gray-600 dark:bg-gray-700 sm:text-base"
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
              <div className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800 sm:p-4 sm:text-base">
                <p>Token Price: ${selectedCryptoData.price.toFixed(2)}</p>
                <p>Market Volume: ${selectedCryptoData.volume.toLocaleString()}</p>
              </div>
            )}

            <div>
              <label htmlFor="investment" className="mb-2 block text-sm sm:text-base">
                Investment (USDT)
              </label>
              <input
                id="investment"
                type="number"
                value={investment}
                onChange={(e) => setInvestment(e.target.value)}
                className="w-full rounded border p-2 text-sm dark:border-gray-600 dark:bg-gray-700 sm:text-base"
                placeholder="Enter investment amount"
              />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold sm:text-base">Grid Steps</h3>
              <div className="grid grid-cols-2 gap-4 text-sm sm:text-base">
                <div>
                  <h4 className="mb-1 font-medium">Buy Thresholds</h4>
                  <ul className="list-inside list-disc">
                    <li>-10%</li>
                    <li>-15%</li>
                    <li>-20%</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-1 font-medium">Sell Thresholds</h4>
                  <ul className="list-inside list-disc">
                    <li>+10%</li>
                    <li>+15%</li>
                    <li>+20%</li>
                  </ul>
                </div>
              </div>
            </div>

            <button className="w-full rounded bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 sm:text-base">
              Create Bot
            </button>
          </div>

          {/* Performance Summary */}
          <div className="space-y-4 rounded-lg bg-white p-4 shadow-md dark:bg-boxdark sm:p-6">
            <h2 className="mb-4 text-lg font-semibold sm:text-xl">Performance Summary</h2>

            <div className="text-center">
              <h3 className="text-base font-medium sm:text-lg">Current ROI</h3>
              <p
                className={`text-2xl font-bold sm:text-3xl ${currentROI >= 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                {currentROI >= 0 ? '+' : ''}
                {currentROI.toFixed(2)}%
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-base font-medium sm:text-lg">Trade History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-700">
                  <thead className="bg-gray-200 dark:bg-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs sm:px-4 sm:text-sm">Asset</th>
                      <th className="px-3 py-2 text-left text-xs sm:px-4 sm:text-sm">Buy Price</th>
                      <th className="px-3 py-2 text-left text-xs sm:px-4 sm:text-sm">Sell Price</th>
                      <th className="px-3 py-2 text-left text-xs sm:px-4 sm:text-sm">Profit %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeHistory.map((trade, index) => (
                      <tr key={index} className="border-b dark:border-gray-600">
                        <td className="px-3 py-2 text-xs sm:px-4 sm:text-sm">{trade.asset}</td>
                        <td className="px-3 py-2 text-xs sm:px-4 sm:text-sm">
                          ${trade.buyPrice.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-xs sm:px-4 sm:text-sm">
                          ${trade.sellPrice.toFixed(2)}
                        </td>
                        <td
                          className={`px-3 py-2 text-xs sm:px-4 sm:text-sm ${trade.profitPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}
                        >
                          {trade.profitPercentage >= 0 ? '+' : ''}
                          {trade.profitPercentage.toFixed(2)}%
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
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={alertsEnabled}
                  onChange={(e) => setAlertsEnabled(e.target.checked)}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
