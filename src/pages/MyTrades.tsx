import { useEffect, useState } from 'react';
import Breadcrumb from '../components/Breadcrumb';
import OpenTrades from '../components/OpenTrades';
import TradeHistory from '../components/TradeHistory';
import { apiClient } from '../utils/apiClient';

interface MultiChainStats {
  total_bots: number;
  active_bots: number;
  bots_by_chain: Record<string, number>;
  total_volume: number; // USD volume traded across all bots (backend returns float)
  total_trades: number; // Completed trades count
}

const MyTrades = () => {
  const [stats, setStats] = useState<MultiChainStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get('/bots/stats/multichain')
      .then((response) => {
        setStats(response as MultiChainStats);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch bot stats', err);
        setIsLoading(false);
      });
  }, []);

  const formatNumber = (num: number | undefined, digits = 1) => {
    if (num === undefined) return '-';
    const formatter = Intl.NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: digits,
    });
    return formatter.format(num);
  };

  const totalVolume = stats?.total_volume ?? 0;
  const totalTrades = stats?.total_trades ?? 0;
  const activeBots = stats?.active_bots ?? 0;
  const totalBots = stats?.total_bots ?? 0;

  return (
    <div className="mx-auto min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-secondary/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className=" bg-[#FFFFFF] dark:bg-boxdark">
        <Breadcrumb pageName="My Trades" />

      {/* Overview widgets */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {/* Total Volume */}
        <div className="relative flex items-center justify-center xl:flex-col">
          <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">Total Volume</h3>
          <p className="text-title-md font-bold text-primary">
            {isLoading ? '--' : `${formatNumber(totalVolume, 2)} USD`}
          </p>
        </div>

        <div className="col-span-3">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Completed Trades */}
            <div className="rounded-2xl border border-gray-200 bg-[#FFFFFF] px-7.5 py-6 shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">
              <div>
                <h4 className="mb-2 text-title-md font-bold text-black dark:text-white">
                  {isLoading ? '--' : formatNumber(totalTrades)}
                </h4>
                <span className="text-sm font-medium text-black dark:text-white">Completed Trades</span>
              </div>
            </div>

            {/* Active Bots */}
            <div className="rounded-2xl border border-gray-200 bg-[#FFFFFF] px-7.5 py-6 shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">
              <div>
                <h4 className="mb-2 text-title-md font-bold text-black dark:text-white">
                  {isLoading ? '--' : `${activeBots} `}
                  <span className="text-sm font-medium text-black dark:text-white">/{totalBots}</span>
                </h4>
                <span className="text-sm font-medium text-black dark:text-white">Active Bots</span>
              </div>
            </div>

            {/* Placeholder for Open Trades & 7-day profit (not provided by endpoint) */}
            <div className="rounded-2xl border border-gray-200 bg-[#FFFFFF] px-7.5 py-6 shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">
              <div>
                <h4 className="mb-2 text-title-md font-bold text-black dark:text-white">--</h4>
                <span className="text-sm font-medium text-black dark:text-white">Open Trades</span>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-[#FFFFFF] px-7.5 py-6 shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">
              <div>
                <h4 className="mb-2 text-title-md font-bold text-black dark:text-white">--</h4>
                <span className="text-sm font-medium text-black dark:text-white">7-day Profit ($)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Existing components */}
        <div className="mt-4 md:mt-6 2xl:mt-7.5 bg">
          <OpenTrades />
        </div>
        <div className="mt-4 md:mt-6 2xl:mt-7.5">
          <TradeHistory />
        </div>
      </div>
    </div>
  );
};

export default MyTrades;
