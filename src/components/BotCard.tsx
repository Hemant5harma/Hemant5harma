import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Link } from "react-router-dom";

interface Bot {
  id: number;
  user_id: number;
  name: string;
  frequency: string;
  status: string;
  next_execution_time: string | null;
  coins: {
    id: number;
    bot_id: number;
    token_address: string;
    amount: number;
    threshold: number;
  }[];
  performance: {
    total_trades: number;
    total_volume: number;
    apy: number;
    three_month_perf: number;
    six_month_perf: number;
    total_perf: number;
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-boxdark p-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm text-xs">
        <p className="text-gray-600 dark:text-gray-400 mb-1">{new Date(label).toLocaleDateString()}</p>
        <p className="font-bold text-gray-800 dark:text-gray-200">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function BotCard({ bot }: { bot: Bot }) {
  const chartColors = {
    BTC: "#818cf8",
    BNB: "#22d3ee",
    ETH: "#6366f1",
  }[bot.name.split(" - ")[1]] || "#818cf8";

  return (
    <Link to={`/bot-details/${bot.id}`} className="block">
      <motion.div
        className="rounded-2xl bg-white dark:bg-boxdark shadow-xl p-4 md:p-6 cursor-pointer"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-black dark:text-white">{bot.name}</h3>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {bot.status.toUpperCase()} · {bot.frequency}
            </p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {bot.next_execution_time ? 
                `Next: ${new Date(bot.next_execution_time).toLocaleTimeString()}` : 
                "Not scheduled"}
            </p>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="text-center bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">APY</p>
            <p className="font-bold text-green-600">{bot.performance.apy.toFixed(2)}%</p>
          </div>
          <div className="text-center bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Trades</p>
            <p className="font-bold text-gray-800 dark:text-gray-200">{bot.performance.total_trades}</p>
          </div>
          <div className="text-center bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">3M Perf</p>
            <p className={`font-bold ${bot.performance.three_month_perf >= 0 ? "text-green-600" : "text-red-600"}`}>
              {bot.performance.three_month_perf >= 0 ? "+" : ""}{bot.performance.three_month_perf.toFixed(2)}%
            </p>
          </div>
          <div className="text-center bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">6M Perf</p>
            <p className={`font-bold ${bot.performance.six_month_perf >= 0 ? "text-green-600" : "text-red-600"}`}>
              {bot.performance.six_month_perf >= 0 ? "+" : ""}{bot.performance.six_month_perf.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Volume and Total Performance */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="text-center bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Volume</p>
            <p className="font-bold text-gray-800 dark:text-gray-200">${bot.performance.total_volume.toFixed(2)}</p>
          </div>
          <div className="text-center bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Perf</p>
            <p className={`font-bold ${bot.performance.total_perf >= 0 ? "text-green-600" : "text-red-600"}`}>
              {bot.performance.total_perf >= 0 ? "+" : ""}{bot.performance.total_perf.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Coins Section */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Coin Allocations</h4>
          <div className="space-y-2">
            {bot.coins.map(coin => (
              <div key={coin.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs text-indigo-800 dark:text-indigo-200 mr-2">
                    {coin.token_address.substring(0, 3).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{coin.token_address.toUpperCase()}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${coin.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Threshold: {coin.threshold}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
      
      </motion.div>
    </Link>
  );
}
