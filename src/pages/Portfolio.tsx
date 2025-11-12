import PortfolioChart from '../components/PortfolioChart';
import Breadcrumb from '../components/Breadcrumb';

const Portfolio = () => {
  return (
    <div className="w-full min-h-screen bg-background-light dark:bg-background-dark">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb pageName="Portfolio" />
        {/* Portfolio Evolution */}
        <div className="mt-6 rounded-2xl border border-border-light bg-card-light p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
          <h2 className="mb-4 text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            Portfolio Evolution
          </h2>
          <div className="rounded-xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark">
            <PortfolioChart />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border-light bg-card-light p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <h2 className="mb-4 text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              Portfolio Distribution Table
            </h2>
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-border-light bg-background-light text-text-light-secondary dark:border-border-dark dark:bg-background-dark dark:text-text-dark-secondary">
              No data available
            </div>
          </div>
          <div className="rounded-2xl border border-border-light bg-card-light p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
            <h2 className="mb-4 text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              Portfolio Distribution Chart
            </h2>
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-border-light bg-background-light text-text-light-secondary dark:border-border-dark dark:bg-background-dark dark:text-text-dark-secondary">
              No data available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
