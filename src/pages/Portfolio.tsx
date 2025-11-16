import PortfolioChart from '../components/PortfolioChart';
import Breadcrumb from '../components/Breadcrumb';

const Portfolio = () => {
  return (
    <div className="w-full min-h-screen bg-background-light dark:bg-background-dark">
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
        <Breadcrumb pageName="Portfolio" />
        {/* Portfolio Evolution */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border border-border-light bg-card-light p-4 sm:p-5 lg:p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            Portfolio Evolution
          </h2>
          <div className="rounded-lg sm:rounded-xl border border-border-light bg-background-light p-2 sm:p-3 lg:p-4 dark:border-border-dark dark:bg-background-dark -mx-4 sm:-mx-5 lg:-mx-6 px-4 sm:px-5 lg:px-6">
            <PortfolioChart />
          </div>
        </div>
        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2">
          <div className="rounded-xl sm:rounded-2xl border border-border-light bg-card-light p-4 sm:p-5 lg:p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              Portfolio Distribution Table
            </h2>
            <div className="flex min-h-[250px] sm:min-h-[300px] items-center justify-center rounded-lg sm:rounded-xl border border-border-light bg-background-light text-sm sm:text-base text-text-light-secondary dark:border-border-dark dark:bg-background-dark dark:text-text-dark-secondary">
              No data available
            </div>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-border-light bg-card-light p-4 sm:p-5 lg:p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              Portfolio Distribution Chart
            </h2>
            <div className="flex min-h-[250px] sm:min-h-[300px] items-center justify-center rounded-lg sm:rounded-xl border border-border-light bg-background-light text-sm sm:text-base text-text-light-secondary dark:border-border-dark dark:bg-background-dark dark:text-text-dark-secondary">
              No data available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
