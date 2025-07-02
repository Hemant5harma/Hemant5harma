import PortfolioChart from '../components/PortfolioChart';
import Breadcrumb from '../components/Breadcrumb';

const Portfolio = () => {
  return (
    <div className="mx-auto">
      <Breadcrumb pageName="Portfolio" />
      {/* Portfolio Evolution */}
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-boxdark">
        <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Portfolio Evolution
        </h2>
        <PortfolioChart />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-boxdark">
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
            Portfolio Distribution Table
          </h2>
          <div className="flex min-h-[300px] items-center justify-center text-black dark:text-white">No data available</div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-boxdark">
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
            Portfolio Distribution Chart
          </h2>
          <div className="flex min-h-[300px] items-center justify-center text-black dark:text-white">No data available</div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
