import { useState, useCallback } from "react"
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

interface EnhancedCryptoCardProps {
  symbol: string
  name: string
  price: string
  change: string
  chartData: { date: string; price: number }[]
  high24h: string
  low24h: string
  volume24h: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded-md shadow-sm text-xs">
        <p className="text-gray-600 mb-1">{new Date(label).toLocaleDateString()}</p>
        <p className="font-bold text-gray-800">${payload[0].value.toFixed(2)}</p>
      </div>
    )
  }
  return null
}

export function generateChartDataForTrend(days: number, currentPrice: number, trend: "up" | "down"): { date: string; price: number }[] {
  const data = []
  const volatility = 0.02 // 2% daily volatility
  let price = currentPrice

  for (let i = days; i > 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    const change = (Math.random() - 0.5) * 2 * volatility

    if (trend === "up") {
      price *= (1 + Math.abs(change))
    } else {
      price *= (1 - Math.abs(change))
    }

    data.push({
      date: date.toISOString().split('T')[0],
      price: Number(price.toFixed(2))
    })
  }

  return data
}

export default function CryptoCard({
  symbol,
  name,
  price,
  change,
  chartData,
  high24h,
  low24h,
  volume24h,
}: EnhancedCryptoCardProps) {
  const [activePoint, setActivePoint] = useState<{
    x: number
    y: number
    value: number
  } | null>(null)
  const isPositive = !change.startsWith("-")
  const changeValue = parseFloat(change)

  const handleMouseMove = useCallback((e: any) => {
    if (e.activePayload) {
      const { chartX, chartY } = e
      setActivePoint({
        x: chartX,
        y: chartY,
        value: e.activePayload[0].value,
      })
    } else {
      setActivePoint(null)
    }
  }, [])

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg shadow-md p-4 w-full max-w-md mx-auto font-sans">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-xl font-bold mb-1">{symbol}</h2>
          <p className="text-sm text-gray-600">{name}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold mb-1">{price}</p>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold 
            ${isPositive
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-600'
            }`}>
            {isPositive ? '▲' : '▼'} {change}%
          </span>
        </div>
      </div>
      <div className="h-[120px] relative mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setActivePoint(null)}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#B0B0B0" />
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "#34a853" : "#ea4335"}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-xs text-gray-600 mb-2">
        <span className="text-black dark:text-white">24h High: <span className="text-green-600 font-bold">{high24h}</span></span>
        <span className="text-black dark:text-white">24h Low: <span className="text-red-600 font-bold">{low24h}</span></span>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-600">
        <span className="text-black dark:text-white">
          24h Change:
          <span className={`font-bold ml-1 
            ${isPositive ? 'text-green-600' : 'text-red-600'}
          `}>
            {changeValue > 0 ? '+' : ''}{changeValue.toFixed(2)}%
          </span>
        </span>
        <span className="text-black dark:text-white">Volume: {volume24h}</span>
      </div>
    </div>
  )
}