export interface Bot {
    id: string;
    name: string;
    icon: string;
    description: string;
    type: string;
    pairs: string[];
    apy: number;
    threeMonthPerf: number;
    sixMonthPerf: number;
    totalPerf: number;
    tradesPerMonth: number;
    mdd: number;
    fees: number;
    myFees: number;
    coins: string[];
    chartData: { date: string; value: number }[];
    tradingTypes: string[];
  }
  
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
  
  export const bots: Bot[] = [
    {
      id: "1",
      name: "Swing Sniper - BTC",
      icon: "/placeholder.svg?height=48&width=48",
      description: "A trend-based algorithm trading BTC with uncapped upside and managed downside risk.",
      type: "Spot",
      pairs: ["BTC", "USDT"],
      apy: 88.61,
      threeMonthPerf: 4.97,
      sixMonthPerf: 37.3,
      totalPerf: 95.96,
      tradesPerMonth: 29,
      mdd: -41.11,
      fees: 7.0,
      myFees: 20,
      coins: ["BTC", "USDT"],
      chartData: generateChartData(30, "up"),
      tradingTypes: ["Spot"]
    },
    {
      id: "2",
      name: "SuperTrader - BNB",
      icon: "/placeholder.svg?height=48&width=48",
      description: "Advanced trading bot specializing in BNB futures and spot markets.",
      type: "Futures",
      pairs: ["BNB", "USDT"],
      apy: 77.79,
      threeMonthPerf: 15.59,
      sixMonthPerf: 39.7,
      totalPerf: 140.09,
      tradesPerMonth: 35,
      mdd: -38.5,
      fees: 8.8,
      myFees: 22,
      coins: ["BNB", "USDT"],
      chartData: generateChartData(30, "up"),
      tradingTypes: ["Spot", "Perps"]
    },
    {
      id: "3",
      name: "Sonny - ETH",
      icon: "/placeholder.svg?height=48&width=48",
      description: "Ethereum-focused bot with a balanced approach to spot trading.",
      type: "Spot",
      pairs: ["ETH", "USDT"],
      apy: 72.88,
      threeMonthPerf: -21.57,
      sixMonthPerf: 26.92,
      totalPerf: 85.33,
      tradesPerMonth: 25,
      mdd: -45.2,
      fees: 8.8,
      myFees: 18,
      coins: ["ETH", "USDT"],
      chartData: generateChartData(30, "volatile"),
      tradingTypes: ["Spot"]
    },
    {
      id: "4",
      name: "Spooner - BTC",
      icon: "/placeholder.svg?height=48&width=48",
      description: "Bitcoin-focused bot with a conservative approach to spot trading.",
      type: "Spot",
      pairs: ["BTC", "USDT"],
      apy: 70.36,
      threeMonthPerf: -3.25,
      sixMonthPerf: 22.18,
      totalPerf: 78.45,
      tradesPerMonth: 20,
      mdd: -35.8,
      fees: 8.8,
      myFees: 19,
      coins: ["BTC", "USDT"],
      chartData: generateChartData(30, "up"),
      tradingTypes: ["Spot"]
    },
    {
      id: "5",
      name: "SuperTrader - BNB",
      icon: "/placeholder.svg?height=48&width=48",
      description: "BNB-focused bot with a balanced approach to futures and spot trading.",
      type: "Futures",
      pairs: ["BNB", "USDT"],
      apy: 57.89,
      threeMonthPerf: 15.59,
      sixMonthPerf: 29.7,
      totalPerf: 110.5,
      tradesPerMonth: 40,
      mdd: -42.3,
      fees: 8.8,
      myFees: 21,
      coins: ["BNB", "USDT"],
      chartData: generateChartData(30, "down"),
      tradingTypes: ["Spot", "Perps"]
    },
  ]
  
  