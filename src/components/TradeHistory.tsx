const TradeHistory = () => {
  return (
    <div className="rounded-lg bg-white px-5 pt-6 pb-2.5 shadow-default dark:bg-boxdark sm:px-7.5 xl:pb-2.5">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Trade History
      </h4>
      <div className="flex flex-col w-full overflow-auto">
        <div className="flex flex-row w-max rounded-sm bg-gray-2 dark:bg-meta-4">
          <div className="p-2 min-w-[120px]">
            <h5 className="text-sm font-medium xsm:text-sm">Bot</h5>
          </div>
          <div className="p-2 min-w-[160px]">
            <h5 className="text-sm font-medium xsm:text-sm">Pair</h5>
          </div>          
          <div className="p-2 min-w-[120px]">
            <h5 className="text-sm font-medium xsm:text-sm">Started</h5>
          </div>
          <div className="p-2 min-w-[120px]">
            <h5 className="text-sm font-medium xsm:text-sm">Completed</h5>
          </div>
          <div className="p-2 min-w-[140px]">
            <h5 className="text-sm font-medium xsm:text-sm">
            Amount
            </h5>
          </div>
          <div className="p-2 min-w-[140px]">
            <h5 className="text-sm font-medium xsm:text-sm">Total Executed
            </h5>
          </div>
          <div className="p-2 min-w-[120px]">
            <h5 className="text-sm font-medium xsm:text-sm">Total Gained
            </h5>
          </div>
          <div className="p-2 min-w-[120px]">
            <h5 className="text-sm font-medium xsm:text-sm">Profit %</h5>
          </div>
        </div>
        <div className="min-h-[200px] flex items-center justify-center">
          No data
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;
