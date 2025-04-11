import { useState, useEffect } from "react"
import BotCard from "../components/BotCard"
import { fetchBots } from "../utils/apiClient"
import { Search } from "lucide-react"

export default function ManageBots() {
  const [searchTerm, setSearchTerm] = useState("")
  const [bots, setBots] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetchBots()
      .then((data) => {
        setBots(data)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error(error)
        setIsLoading(false)
      })
  }, [])

  const filteredBots = bots.filter(
    (bot) =>
      bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bot.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bot.coins.some((coin: any) => coin.token_address.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-2">Trading Bots</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and monitor your automated trading strategies</p>
      </div>

      {/* Search and Actions */}
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, status, or token address..."
            className="w-full p-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-boxdark text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bot Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-boxdark shadow-xl p-6 h-[420px] animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                ))}
              </div>
              <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6"></div>
              <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : filteredBots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Search className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No bots found</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            We couldn't find any trading bots matching your search criteria. Try adjusting your search terms.
          </p>
        </div>
      )}
    </div>
  )
}
