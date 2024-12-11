import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface BotCardProps {
  name: string;
  icon: string;
  type: string;
  pairs: string[];
  apy: number;
  threeMonthPerf: number;
  sixMonthPerf: number;
  fees: number;
  chartData: { date: string; value: number }[];
  tradingTypes: string[];
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

export default function BotCard({
  name,
  icon,
  type,
  pairs,
  apy,
  threeMonthPerf,
  sixMonthPerf,
  fees,
  chartData,
  tradingTypes,
}: BotCardProps) {
  const chartColors = {
    BTC: "#818cf8",
    BNB: "#22d3ee",
    ETH: "#6366f1",
  }[name.split(" - ")[1]] || "#818cf8";

  return (
    <motion.div
      className="rounded-2xl bg-white dark:bg-boxdark shadow-xl p-4 md:p-6"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <img src={icon} alt="" className="h-10 w-10 md:h-12 md:w-12 rounded-full" />
          <div>
            <h3 className="text-base md:text-lg font-semibold text-black dark:text-white">{name}</h3>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{type}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tradingTypes.map((type) => (
            <span
              key={type}
              className="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* APY Section */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl md:text-4xl font-bold text-green-500">+{apy.toFixed(2)}%</span>
          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">APY</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-[25vh] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColors}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Info Grid Section */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
        <div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2">Pair</div>
          <div className="flex -space-x-1">
            {pairs.map((pair) => (
              <div
                key={pair}
                className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-black dark:text-white ring-2 ring-white dark:ring-boxdark"
              >
                {pair}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2">3M Perf</div>
          <span className={`text-xs md:text-sm font-medium ${threeMonthPerf >= 0 ? "text-green-500" : "text-red-500"}`}>
            {threeMonthPerf >= 0 ? "+" : ""}
            {threeMonthPerf}%
          </span>
        </div>
        <div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2">6M Perf</div>
          <span className={`text-xs md:text-sm font-medium ${sixMonthPerf >= 0 ? "text-green-500" : "text-red-500"}`}>
            {sixMonthPerf >= 0 ? "+" : ""}
            {sixMonthPerf}%
          </span>
        </div>
      </div>

      {/* Action Button */}
      <motion.button
        className="w-full px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white bg-indigo-400 hover:bg-indigo-600 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        See more
      </motion.button>
    </motion.div>
  );
}
