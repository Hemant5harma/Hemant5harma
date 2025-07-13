import PortfolioChart from '../components/PortfolioChart';
import Breadcrumb from '../components/Breadcrumb';

const Portfolio = () => {
  return (
    <div className="mx-auto min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-secondary/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="bg-[#FFFFFF] px-4 py-6 dark:bg-boxdark">
        <Breadcrumb pageName="Portfolio" />
        {/* Portfolio Evolution */}
        <div className="rounded-2xl bg-[#FFFFFF] p-6 shadow-xl dark:bg-gray-800 dark:shadow-none">
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
            Portfolio Evolution
          </h2>
          <div className="rounded-xl bg-[#FAFBFC] p-4 shadow-inner dark:bg-gray-700 dark:shadow-none">
            <PortfolioChart />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#FFFFFF] p-6 shadow-xl dark:bg-gray-800 dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
              Portfolio Distribution Table
            </h2>
            <div className="flex min-h-[300px] items-center justify-center rounded-xl bg-[#FAFBFC] text-black shadow-inner dark:bg-gray-700 dark:text-white dark:shadow-none">
              No data available
            </div>
          </div>
          <div className="rounded-2xl bg-[#FFFFFF] p-6 shadow-xl dark:bg-gray-800 dark:shadow-none">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
              Portfolio Distribution Chart
            </h2>
            <div className="flex min-h-[300px] items-center justify-center rounded-xl bg-[#FAFBFC] text-black shadow-inner dark:bg-gray-700 dark:text-white dark:shadow-none">
              No data available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
