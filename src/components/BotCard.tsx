import { motion } from "framer-motion"
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Link } from "react-router-dom"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface Bot {
  id: number
  user_id: number
  name: string
  frequency: string
  status: string
  next_execution_time: string | null
  coins: {
    id: number
    bot_id: number
    token_address: string
    amount: number
    threshold: number
  }[]
  performance: {
    total_trades: number
    total_volume: number
    apy: number
    three_month_perf: number
    six_month_perf: number
    total_perf: number
  }
}

// Sample data for the chart
const generateChartData = (perf: number) => {
  const data = []
  const now = new Date()
  const direction = perf >= 0 ? 1 : -1
  const volatility = Math.abs(perf) / 10

  let value = 100
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Create a somewhat realistic price movement based on performance
    const change = Math.random() * volatility * direction + (direction * volatility) / 2
    value = value + change

    data.push({
      date: date.toISOString(),
      value: value,
    })
  }

  return data
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-boxdark p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md text-xs">
        <p className="text-gray-600 dark:text-gray-400 mb-1">{new Date(label).toLocaleDateString()}</p>
        <p className="font-bold text-gray-800 dark:text-gray-200">${payload[0].value.toFixed(2)}</p>
      </div>
    )
  }
  return null
}

export default function BotCard({ bot }: { bot: Bot }) {
  const chartData = generateChartData(bot.performance.total_perf)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "paused":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
      case "stopped":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
  }

  const getPerformanceIcon = (value: number) => {
    return value >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />
  }

  // Get a color for the chart based on performance
  const chartColor = bot.performance.total_perf >= 0 ? "#10b981" : "#ef4444"

  return (
    <Link to={`/bot-details/${bot.id}`} className="block">
      <motion.div
        className="rounded-xl bg-white dark:bg-boxdark shadow-lg hover:shadow-xl p-5 cursor-pointer h-full flex flex-col"
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Header with Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-black dark:text-white truncate pr-2">{bot.name}</h3>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(bot.status)}`}>
            {bot.status.toUpperCase()}
          </span>
        </div>

        {/* Frequency */}
        <div className="mb-4">
          <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
            {bot.frequency}
          </span>
        </div>

        {/* Chart Section */}
        <div className="h-28 mb-5 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" hide={true} />
              <YAxis hide={true} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="font-bold text-green-600 dark:text-green-400 text-lg">{bot.performance.apy.toFixed(1)}%</p>
            <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">APY</div>
          </div>

          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div
              className={`flex items-center font-bold ${getPerformanceColor(bot.performance.three_month_perf)} text-lg`}
            >
              {getPerformanceIcon(bot.performance.three_month_perf)}
              <span>{Math.abs(bot.performance.three_month_perf).toFixed(1)}%</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">3M</div>
          </div>

          <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div
              className={`flex items-center font-bold ${getPerformanceColor(bot.performance.six_month_perf)} text-lg`}
            >
              {getPerformanceIcon(bot.performance.six_month_perf)}
              <span>{Math.abs(bot.performance.six_month_perf).toFixed(1)}%</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">6M</div>
          </div>
        </div>

        {/* Coins Section */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Allocations</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">{bot.coins.length} coins</span>
          </div>

          <div className="space-y-2.5">
            {bot.coins.map((coin) => (
              <div
                key={coin.id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-600 dark:to-purple-700 flex items-center justify-center text-xs font-medium text-white shadow-sm">
                    {coin.token_address.substring(0, 3).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {coin.token_address.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Threshold: {coin.threshold}%</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  ${coin.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
