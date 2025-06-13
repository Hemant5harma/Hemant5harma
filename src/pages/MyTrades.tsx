import { useEffect, useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import OpenTrades from "../components/OpenTrades";
import TradeHistory from "../components/TradeHistory";
import { apiClient } from "../utils/apiClient";

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
      .get("/bots/stats/multichain")
      .then((response) => {
        setStats(response as MultiChainStats);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch bot stats", err);
        setIsLoading(false);
      });
  }, []);

  const formatNumber = (num: number | undefined, digits = 1) => {
    if (num === undefined) return "-";
    const formatter = Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: digits,
    });
    return formatter.format(num);
  };

  const totalVolume = stats?.total_volume ?? 0;
  const totalTrades = stats?.total_trades ?? 0;
  const activeBots = stats?.active_bots ?? 0;
  const totalBots = stats?.total_bots ?? 0;

  return (
    <div className="mx-auto">
      <Breadcrumb pageName="My Trades" />

      {/* Overview widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="flex xl:flex-col justify-center items-center relative">
          <h3 className="text-xl font-semibold text-black mb-4 dark:text-white">
            Total Volume
          </h3>
          <p className="text-primary text-title-md font-bold">
            {isLoading ? "--" : `${formatNumber(totalVolume, 2)} USD`}
          </p>
        </div>

        <div className="col-span-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Completed Trades */}
            <div className="rounded-xl border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white mb-2">
                  {isLoading ? "--" : formatNumber(totalTrades)}
                </h4>
                <span className="text-sm font-medium">Completed Trades</span>
              </div>
            </div>

            {/* Active Bots */}
            <div className="rounded-xl border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white mb-2">
                  {isLoading ? "--" : `${activeBots} `}
                  <span className="text-sm font-medium">/{totalBots}</span>
                </h4>
                <span className="text-sm font-medium">Active Bots</span>
              </div>
            </div>

            {/* Placeholder for Open Trades & 7-day profit (not provided by endpoint) */}
            <div className="rounded-xl border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white mb-2">--</h4>
                <span className="text-sm font-medium">Open Trades</span>
              </div>
            </div>
            <div className="rounded-xl border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white mb-2">--</h4>
                <span className="text-sm font-medium">7-day Profit ($)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Existing components */}
      <div className="mt-4 md:mt-6 2xl:mt-7.5">
        <OpenTrades />
      </div>
      <div className="mt-4 md:mt-6 2xl:mt-7.5">
        <TradeHistory />
      </div>
    </div>
  );
};

export default MyTrades;
