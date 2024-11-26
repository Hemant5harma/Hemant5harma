import CryptoCard from "../components/CryptoCard";
import PortfolioChart from "../components/PortfolioChart";

// Mock data for crypto charts
const generateChartData = (
  count: number,
  initialPrice: number,
  trend: "up" | "down",
) => {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(Date.now() - (count - i) * 86400000)
      .toISOString()
      .split("T")[0],
    price:
      trend === "up"
        ? initialPrice * (1 + ((Math.random() * 0.1 + 0.01) * i) / count)
        : initialPrice * (1 - ((Math.random() * 0.1 + 0.01) * i) / count),
  }));
};

export default function Dashboard() {
  return (
    <div className='min-h-screen bg-gray-100 text-gray-800 relative '>
      <div className='absolute inset-0 z-0'>
        <div className='absolute inset-0 bg-white bg-opacity-90'></div>
      </div>

      {/* Main content */}
      <div className='relative z-10 transition-all duration-300 ease-in-out ml-64'>
        {/* Header */}
        <header className='bg-white shadow-sm'>
          <div className='flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8'>
            <h1 className='text-2xl font-semibold text-gray-800'>Dashboard</h1>
            <div className='flex items-center gap-4'>
              <button className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200'>
                Deposit MBXN
              </button>
              <span className='text-sm text-gray-600'>50 Bots Available</span>
            </div>
          </div>
        </header>

        {/* Dashboard content */}
        <main className='p-4 sm:p-6 lg:p-8'>
          {/* Crypto Cards */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8'>
            <CryptoCard
              symbol='BTC'
              price='$98,804.36'
              change='1.56'
              chartData={generateChartData(30, 98804.36, "up")}
            />
            <CryptoCard
              symbol='ETH'
              price='$3,416.88'
              change='2.05'
              chartData={generateChartData(30, 3416.88, "up")}
            />
            <CryptoCard
              symbol='BNB'
              price='$670.17'
              change='9.97'
              chartData={generateChartData(30, 670.17, "up")}
            />
          </div>

          {/* Overview Section */}
          <div className='mb-8'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>
              OVERVIEW
            </h2>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <div className='bg-white rounded-lg p-6 shadow-sm'>
                <p className='text-3xl font-bold text-gray-800'>$0</p>
                <p className='text-sm text-gray-600'>Total Balance</p>
              </div>
              <div className='bg-white rounded-lg p-6 shadow-sm'>
                <p className='text-3xl font-bold text-gray-800'>$0</p>
                <p className='text-sm text-gray-600'>Total DEX(s)</p>
              </div>
              <div className='bg-white rounded-lg p-6 shadow-sm'>
                <p className='text-3xl font-bold text-gray-800'>$0</p>
                <p className='text-sm text-gray-600'>Total CEX(s)</p>
              </div>
            </div>
          </div>

          {/* Portfolio Evolution */}
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>
              Portfolio Evolution
            </h2>
            <PortfolioChart />
          </div>
        </main>
      </div>
    </div>
  );
}
