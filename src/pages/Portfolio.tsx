import PortfolioChart from "../components/PortfolioChart";
import Breadcrumb from "../components/Breadcrumb";

const Portfolio = () => {
  return (
    <div className="mx-auto">
      <Breadcrumb pageName="Portfolio" />
      {/* Portfolio Evolution */}
      <div className="bg-white rounded-lg shadow-sm p-6 dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
          Portfolio Evolution
        </h2>
        <PortfolioChart />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-8">
        <div className="bg-white rounded-lg shadow-sm p-6 dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Portfolio Distribution Table
          </h2>
          <div className="min-h-[300px] flex items-center justify-center">
            No data available
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Portfolio Distribution Chart
          </h2>
          <div className="min-h-[300px] flex items-center justify-center">
            No data available
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
