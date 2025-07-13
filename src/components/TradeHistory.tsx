const TradeHistory = () => {
  return (
    <div className="rounded-lg bg-white px-5 pb-2.5 pt-6 shadow-lg dark:bg-gray-800 sm:px-7.5 xl:pb-2.5">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">Trade History</h4>
      <div className="flex w-full flex-col overflow-auto">
        <div className="flex w-max flex-row rounded-sm bg-gray-2 dark:bg-meta-4">
          <div className="min-w-[120px] p-2">
            <h5 className="text-sm font-medium text-black dark:text-white xsm:text-sm">Bot</h5>
          </div>
          <div className="min-w-[160px] p-2">
            <h5 className="text-sm font-medium text-black dark:text-white xsm:text-sm">Pair</h5>
          </div>
          <div className="min-w-[120px] p-2">
            <h5 className="text-sm font-medium text-black dark:text-white xsm:text-sm">Started</h5>
          </div>
          <div className="min-w-[120px] p-2">
            <h5 className="text-sm font-medium text-black dark:text-white xsm:text-sm">
              Completed
            </h5>
          </div>
          <div className="min-w-[140px] p-2">
            <h5 className="text-sm font-medium text-black dark:text-white xsm:text-sm">Amount</h5>
          </div>
          <div className="min-w-[140px] p-2">
            <h5 className="text-sm font-medium text-black dark:text-white xsm:text-sm">
              Total Executed
            </h5>
          </div>
          <div className="min-w-[120px] p-2">
            <h5 className="text-sm font-medium text-black dark:text-white xsm:text-sm">
              Total Gained
            </h5>
          </div>
          <div className="min-w-[120px] p-2">
            <h5 className="text-sm font-medium text-black dark:text-white xsm:text-sm">Profit %</h5>
          </div>
        </div>
        <div className="flex min-h-[200px] items-center justify-center text-black dark:text-white">
          No data
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;
