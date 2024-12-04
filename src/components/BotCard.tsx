"use client"

import { motion } from "framer-motion"
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

interface BotCardProps {
    name: string
    icon: string
    type: string
    pairs: string[]
    apy: number
    threeMonthPerf: number
    sixMonthPerf: number
    fees: number
    chartData: { date: string; value: number }[]
    tradingTypes: string[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-boxdark p-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm text-xs">
                <p className="text-gray-600 dark:text-gray-400 mb-1">{new Date(label).toLocaleDateString()}</p>
                <p className="font-bold text-gray-800 dark:text-gray-200">${payload[0].value.toFixed(2)}</p>
            </div>
        )
    }
    return null
}

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
    tradingTypes
}: BotCardProps) {
    const isPositive = apy > 0
    const [botName, currency] = name.split(" - ")

    const chartColors = {
        "BTC": "#818cf8",
        "BNB": "#22d3ee",
        "ETH": "#6366f1"
    }[currency] || "#818cf8"

    return (
        <motion.div
            className="rounded-2xl bg-white dark:bg-boxdark p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <img
                        src={icon}
                        alt=""
                        className="h-12 w-12 rounded-full"
                    />
                    <div>
                        <h3 className="text-lg font-semibold text-black dark:text-white">{name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{type}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {tradingTypes.map((type) => (
                        <span
                            key={type}
                            className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                        >
                            {type}
                        </span>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-green-500">
                        +{apy.toFixed(2)}%
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">APY</span>
                </div>
            </div>

            <div className="h-[140px] mb-8">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                        {/* for grid system */}
                        {/* <CartesianGrid strokeDasharray="3 3" stroke="#B0B0B0" /> */}
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={['dataMin', 'dataMax']} />
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

            <div className="grid grid-cols-4 gap-4 mb-6">
                <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pair</div>
                    <div className="flex -space-x-1">
                        {pairs.map((pair) => (
                            <div
                                key={pair}
                                className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-black dark:text-white ring-2 ring-white dark:ring-boxdark"
                            >
                                {pair}
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">3M Perf</div>
                    <span className={`text-sm font-medium ${threeMonthPerf >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {threeMonthPerf >= 0 ? '+' : ''}{threeMonthPerf}%
                    </span>
                </div>
                <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">6M Perf</div>
                    <span className={`text-sm font-medium ${sixMonthPerf >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {sixMonthPerf >= 0 ? '+' : ''}{sixMonthPerf}%
                    </span>
                </div>
                {/* <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Fees</div>
                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                        From {fees}% fees
                    </span>
                </div> */}
            </div>

            <motion.button
                className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                See more
            </motion.button>
        </motion.div>
    )
}

