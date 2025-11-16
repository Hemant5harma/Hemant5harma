import React, { useState } from 'react';
import SparklineChart from '../components/SparklineChart';
import PortfolioChart from '../components/PortfolioChart';

// Mock data for crypto prices
const cryptoData = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    pair: 'BTC/USD',
    price: 68123.45,
    change: 2.5,
    changeAmount: 1661.55,
    trend: 'up' as const,
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    chartData: [73, 73, 14, 14, 27.5, 27.5, 62.5, 62.5, 22.5, 22.5, 68, 68, 41, 41, 30.5, 30.5, 81.5, 81.5, 100, 100, 1, 1, 54.5, 54.5, 87, 87, 17],
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    pair: 'ETH/USD',
    price: 3567.89,
    change: -1.8,
    changeAmount: -65.51,
    trend: 'down' as const,
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    chartData: [17, 17, 87, 87, 72.5, 72.5, 37.5, 37.5, 77.5, 77.5, 32, 32, 59, 59, 69.5, 69.5, 18.5, 18.5, 1, 1, 100, 100, 45.5, 45.5, 13, 13, 83],
  },
  {
    name: 'Solana',
    symbol: 'SOL',
    pair: 'SOL/USD',
    price: 172.34,
    change: 5.1,
    changeAmount: 8.36,
    trend: 'up' as const,
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    chartData: [41, 41, 86, 86, 62.5, 62.5, 92.5, 92.5, 37.5, 37.5, 77, 77, 19, 19, 49.5, 49.5, 1, 1, 30, 30, 80, 80, 45.5, 45.5, 90, 90, 13],
  },
];

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('24H');

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-text-light-primary dark:text-text-dark-primary text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
          Dashboard
        </h1>
        <p className="mt-1.5 sm:mt-2 text-text-light-secondary dark:text-text-dark-secondary text-sm sm:text-base font-normal leading-normal">
          Welcome back, here is your portfolio overview.
        </p>
      </div>

        {/* Crypto Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
        {cryptoData.map((crypto) => (
          <div
            key={crypto.symbol}
            className="bg-card-light dark:bg-card-dark rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 flex flex-col shadow-sm border border-border-light dark:border-border-dark"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <img
                alt={`${crypto.name} logo`}
                className="size-7 sm:size-8 flex-shrink-0"
                src={crypto.logo}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32';
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-text-light-primary dark:text-text-dark-primary text-sm sm:text-base font-medium leading-normal truncate">
                  {crypto.name}
                </p>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs sm:text-sm truncate">
                  {crypto.pair}
                </p>
              </div>
            </div>
            <p className="text-text-light-primary dark:text-text-dark-primary tracking-light text-xl sm:text-2xl lg:text-3xl font-bold leading-tight break-words">
              ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex gap-1.5 sm:gap-2 items-center text-xs sm:text-sm font-medium mt-1 sm:mt-2">
              <span
                className={`material-symbols-outlined text-sm sm:text-base flex-shrink-0 ${
                  crypto.change >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {crypto.change >= 0 ? 'arrow_drop_up' : 'arrow_drop_down'}
              </span>
              <p className={`${crypto.change >= 0 ? 'text-success' : 'text-danger'} break-words`}>
                {crypto.change >= 0 ? '+' : ''}
                {crypto.change}% ({crypto.change >= 0 ? '+' : ''}${Math.abs(crypto.changeAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </p>
            </div>
            <div className="flex h-[80px] sm:h-[100px] flex-1 flex-col mt-3 sm:mt-4">
              <SparklineChart
                data={crypto.chartData}
                color={crypto.change >= 0 ? '#0bda65' : '#fa6538'}
                trend={crypto.trend}
                height={100}
          />
        </div>
          </div>
        ))}
      </section>

        {/* Overview Section */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-text-light-primary dark:text-text-dark-primary text-lg sm:text-xl lg:text-[22px] font-bold leading-tight tracking-[-0.015em] mb-3 sm:mb-4">
          Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          <div className="flex flex-col gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm">
            <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm sm:text-base font-medium leading-normal">
              Total Balance
            </p>
            <p className="text-text-light-primary dark:text-text-dark-primary tracking-light text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight break-words">
              $1,234,567.89
            </p>
            </div>
          <div className="flex flex-col gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm">
            <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm sm:text-base font-medium leading-normal">
              Connected DEXs
            </p>
            <p className="text-text-light-primary dark:text-text-dark-primary tracking-light text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              3
            </p>
            </div>
          <div className="flex flex-col gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm">
            <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm sm:text-base font-medium leading-normal">
              Connected CEXs
            </p>
            <p className="text-text-light-primary dark:text-text-dark-primary tracking-light text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              5
            </p>
            </div>
          </div>
      </section>

        {/* Portfolio Evolution */}
      <section>
        <div className="bg-card-light dark:bg-card-dark rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm border border-border-light dark:border-border-dark">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <h3 className="text-text-light-primary dark:text-text-dark-primary text-lg sm:text-xl font-bold">
            Portfolio Evolution
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg p-1 bg-gray-100 dark:bg-background-dark">
              {['24H', '7D', '1M', '1Y'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm font-medium rounded-md transition-colors min-h-[36px] sm:min-h-[32px] touch-manipulation ${
                    selectedPeriod === period
                      ? 'bg-white dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary shadow'
                      : 'text-text-light-secondary dark:text-text-dark-secondary'
                  }`}
                >
                  {period}
                </button>
              ))}
          </div>
        </div>
          <div className="h-64 sm:h-80 lg:h-96 -mx-4 sm:-mx-5 lg:-mx-6 px-4 sm:px-5 lg:px-6">
            <PortfolioChart period={selectedPeriod} />
      </div>
        </div>
      </section>
    </div>
  );
}
