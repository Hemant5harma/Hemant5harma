import CryptoCard from '../components/CryptoCard';
import PortfolioChart from '../components/PortfolioChart';

// Mock data for crypto charts
const generateChartData = (count: number, initialPrice: number, trend: 'up' | 'down') => {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(Date.now() - (count - i) * 86400000).toISOString().split('T')[0],
    price:
      trend === 'up'
        ? initialPrice * (1 + ((Math.random() * 0.1 + 0.01) * i) / count)
        : initialPrice * (1 - ((Math.random() * 0.1 + 0.01) * i) / count),
  }));
};

export default function Dashboard() {
  return (
    <div>
      {/* Crypto Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CryptoCard
          symbol="BTC"
          name="Bitcoin"
          price="$98,804.36"
          change="1.56"
          chartData={generateChartData(30, 98804.36, 'up')}
          high24h="$99,500.00"
          low24h="$97,800.00"
          volume24h="1200 BTC"
        />
        <CryptoCard
          symbol="ETH"
          name="Ethereum"
          price="$3,416.88"
          change="2.05"
          chartData={generateChartData(30, 3416.88, 'up')}
          high24h="$3,500.00"
          low24h="$3,300.00"
          volume24h="5000 ETH"
        />
        <CryptoCard
          symbol="BNB"
          name="BNB"
          price="$670.17"
          change="9.97"
          chartData={generateChartData(30, 670.17, 'down')}
          high24h="$700.00"
          low24h="$650.00"
          volume24h="10000 BNB"
        />
      </div>

      {/* Overview Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">OVERVIEW</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-boxdark">
            <p className="text-3xl font-bold text-black dark:text-white">$0</p>
            <p className="text-sm text-gray-600 dark:text-white">Total Balance</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-boxdark">
            <p className="text-3xl font-bold text-black dark:text-white">$0</p>
            <p className="text-sm text-gray-600 dark:text-white">Total DEX(s)</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-boxdark">
            <p className="text-3xl font-bold text-black dark:text-white">$0</p>
            <p className="text-sm text-gray-600 dark:text-white">Total CEX(s)</p>
          </div>
        </div>
      </div>

      {/* Portfolio Evolution */}
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-boxdark">
        <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Portfolio Evolution
        </h2>
        <PortfolioChart />
      </div>
    </div>
  );
}
