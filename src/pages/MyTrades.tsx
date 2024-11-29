import Breadcrumb from "../components/Breadcrumb";
import OpenTrades from "../components/OpenTrades";
import TradeHistory from "../components/TradeHistory";

const MyTrades = () => {
  return (
    <div className="mx-auto">
      <Breadcrumb pageName="My Trades" />
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="flex xl:flex-col justify-center items-center relative">
          <h3 className="text-xl font-semibold text-black mb-4 dark:text-white">
            Total Profit
          </h3>
          <p className="text-primary text-title-md font-bold text-black">
            3.333K USD
          </p>
        </div>
        <div className="col-span-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white mb-2">
                  45,2K
                </h4>
                <span className="text-sm font-medium">7 days profit ($)</span>
              </div>
            </div>
            <div className="rounded-xl border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white mb-2">
                  5
                </h4>
                <span className="text-sm font-medium">Open Trades</span>
              </div>
            </div>
            <div className="rounded-xl border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white mb-2">
                  10 <span className="text-sm font-medium">/50</span>
                </h4>
                <span className="text-sm font-medium">Active Bots</span>
              </div>
            </div>
            <div className="rounded-xl border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white mb-2">
                  10K
                </h4>
                <span className="text-sm font-medium">Completed trades</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 md:mt-6 2xl:mt-7.5">
        <OpenTrades />
      </div>
      <div className="mt-4 md:mt-6 2xl:mt-7.5">
        <TradeHistory />
      </div>
    </div>
  );
};

export default MyTrades;
