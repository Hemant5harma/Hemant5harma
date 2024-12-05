import BotCard from "../components/BotCard"

function generateChartData(days: number, trend: "up" | "down" | "volatile") {
  const data = []
  let value = 1000
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i))
    
    if (trend === "up") {
      value *= 1 + (Math.random() * 0.02)
    } else if (trend === "down") {
      value *= 1 - (Math.random() * 0.02)
    } else {
      value *= 1 + (Math.random() * 0.04 - 0.02)
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      value
    })
  }
  
  return data
}

const bots = [
  {
    name: "Swing Sniper - BTC",
    icon: "/placeholder.svg?height=48&width=48",
    type: "Spot",
    pairs: ["BTC", "USDT"],
    apy: 88.61,
    threeMonthPerf: 4.97,
    sixMonthPerf: 37.3,
    fees: 7.0,
    chartData: generateChartData(30, "up"),
    tradingTypes: ["Spot"]
  },
  {
    name: "SuperTrader - BNB",
    icon: "/placeholder.svg?height=48&width=48",
    type: "Futures",
    pairs: ["BNB", "USDT"],
    apy: 77.79,
    threeMonthPerf: 15.59,
    sixMonthPerf: 39.7,
    fees: 8.8,
    chartData: generateChartData(30, "up"),
    tradingTypes: ["Spot", "Perps"]
  },
  {
    name: "Sonny - ETH",
    icon: "/placeholder.svg?height=48&width=48",
    type: "Spot",
    pairs: ["ETH", "USDT"],
    apy: 72.88,
    threeMonthPerf: -21.57,
    sixMonthPerf: 26.92,
    fees: 8.8,
    chartData: generateChartData(30, "volatile"),
    tradingTypes: ["Spot"]
  },
  {
    name: "Spooner - BTC",
    icon: "/placeholder.svg?height=48&width=48",
    type: "Spot",
    pairs: ["BTC", "USDT"],
    apy: 70.36,
    threeMonthPerf: -3.25,
    sixMonthPerf: 22.18,
    fees: 8.8,
    chartData: generateChartData(30, "up"),
    tradingTypes: ["Spot"]
  },
  {
    name: "SuperTrader - BNB",
    icon: "/placeholder.svg?height=48&width=48",
    type: "Futures",
    pairs: ["BNB", "USDT"],
    apy: 57.89,
    threeMonthPerf: 15.59,
    sixMonthPerf: 29.7,
    fees: 8.8,
    chartData: generateChartData(30, "down"),
    tradingTypes: ["Spot", "Perps"]
  },
]

export default function ManageBots() {
  return (
    <div className="min-h-screen dark:bg-boxdark-2 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white">Trading Bots</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and monitor your trading bots</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bots.map((bot) => (
          <BotCard key={bot.name} {...bot} />
        ))}
      </div>
    </div>
  )
}

