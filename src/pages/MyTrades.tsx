import { useEffect, useState, useMemo } from 'react';

interface Trade {
  id: string;
  pair: string;
  type: 'Buy' | 'Sell';
  amount: string;
  open_price: string;
  pl_percent: number;
  date_opened: string;
  fee?: string;
  fee_amount?: number;
}

const MyTrades = () => {
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [trades, setTrades] = useState<Trade[]>([]);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockTrades: Trade[] = [
        {
          id: '1',
          pair: 'BTC/USDT',
          type: 'Buy',
          amount: '0.5 BTC',
          open_price: '$68,123.45',
          pl_percent: 2.1,
          date_opened: '2024-05-21 10:30',
          fee: '$12.50',
          fee_amount: 12.50,
        },
        {
          id: '2',
          pair: 'ETH/USDT',
          type: 'Sell',
          amount: '10.0 ETH',
          open_price: '$3,780.10',
          pl_percent: 1.5,
          date_opened: '2024-05-21 09:15',
          fee: '$8.25',
          fee_amount: 8.25,
        },
        {
          id: '3',
          pair: 'SOL/USDT',
          type: 'Buy',
          amount: '100 SOL',
          open_price: '$175.50',
          pl_percent: -0.75,
          date_opened: '2024-05-20 18:00',
          fee: '$5.10',
          fee_amount: 5.10,
        },
      ];
      setTrades(mockTrades);
    } catch (error) {
      console.error('Failed to fetch trades', error);
    }
  };

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) =>
      trade.pair.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [trades, searchTerm]);

  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTrades.slice(start, end);
  }, [filteredTrades, currentPage]);

  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting trade history...');
  };

  const openTradesCount = 23; // This should come from API

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">
          My Trades
        </h1>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 min-w-[84px] cursor-pointer rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-base">download</span>
          <span className="truncate">Export History</span>
        </button>
          </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('open')}
            className={`flex items-center justify-center gap-2 border-b-2 pb-3 transition-colors ${
              activeTab === 'open'
                ? 'border-b-primary text-primary dark:text-blue-300'
                : 'border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <p className="text-sm font-bold">Open Trades</p>
            {activeTab === 'open' && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-primary/10 dark:bg-primary/20 rounded-full">
                {openTradesCount}
                  </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-2 border-b-2 pb-3 transition-colors ${
              activeTab === 'history'
                ? 'border-b-primary text-primary dark:text-blue-300'
                : 'border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <p className="text-sm font-bold">Trade History</p>
          </button>
                </div>
              </div>

      {/* Search and Filters */}
      <div className="mt-6 bg-content-light dark:bg-content-dark border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative w-full md:w-auto md:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              search
                    </span>
            <input
              type="text"
              placeholder="Search pair..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 h-10 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/40 hover:bg-slate-200 dark:hover:bg-slate-700/60 rounded-lg text-sm font-medium">
              <span className="material-symbols-outlined text-xl">calendar_today</span>
              <span>Date</span>
            </button>
            <button className="flex items-center gap-2 px-3 h-10 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/40 hover:bg-slate-200 dark:hover:bg-slate-700/60 rounded-lg text-sm font-medium">
              <span className="material-symbols-outlined text-xl">toll</span>
              <span>Pair</span>
            </button>
            <button className="flex items-center gap-2 px-3 h-10 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/40 hover:bg-slate-200 dark:hover:bg-slate-700/60 rounded-lg text-sm font-medium">
              <span className="material-symbols-outlined text-xl">swap_horiz</span>
              <span>Side</span>
            </button>
                </div>
              </div>

        {/* Table */}
        <div className="@container">
          <div className="overflow-x-auto">
            <div className="w-full">
              {/* Desktop Header */}
              <div className="hidden @[640px]:grid grid-cols-12 gap-x-4 px-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                <div className="col-span-2 py-3 text-left text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Pair
                </div>
                <div className="col-span-1 py-3 text-left text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Type
                </div>
                <div className="col-span-2 py-3 text-left text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Amount
                </div>
                <div className="col-span-1 py-3 text-left text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Open Price
                </div>
                <div className="col-span-1 py-3 text-left text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Fee
                </div>
                <div className="col-span-2 py-3 text-left text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  P/L (%)
                </div>
                <div className="col-span-2 py-3 text-left text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Date Opened
                </div>
                <div className="col-span-1 py-3 text-right text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Action
                </div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedTrades.length > 0 ? (
                  paginatedTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="grid grid-cols-2 @[640px]:grid-cols-12 gap-x-4 gap-y-2 px-4 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <div className="@[640px]:col-span-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {trade.pair}
                        </p>
                      </div>
                      <div className="text-right @[640px]:text-left @[640px]:col-span-1">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-md ${
                            trade.type === 'Buy'
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {trade.type}
                  </span>
                </div>
                      <div className="text-slate-500 dark:text-slate-400 text-sm @[640px]:hidden">
                        Amount
                      </div>
                      <div className="text-right text-sm text-slate-700 dark:text-slate-300 @[640px]:text-left @[640px]:col-span-2">
                        {trade.amount}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-sm @[640px]:hidden">
                        Open Price
                      </div>
                      <div className="text-right text-sm text-slate-700 dark:text-slate-300 @[640px]:text-left @[640px]:col-span-1">
                        {trade.open_price}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-sm @[640px]:hidden">
                        Fee
                      </div>
                      <div className="text-right text-sm text-slate-700 dark:text-slate-300 @[640px]:text-left @[640px]:col-span-1">
                        {trade.fee || '$0.00'}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-sm @[640px]:hidden">
                        P/L (%)
                      </div>
                      <div
                        className={`text-right text-sm font-medium @[640px]:text-left @[640px]:col-span-2 ${
                          trade.pl_percent >= 0 ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {trade.pl_percent >= 0 ? '+' : ''}
                        {trade.pl_percent.toFixed(2)}%
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-sm @[640px]:hidden">
                        Date Opened
                      </div>
                      <div className="text-right text-sm text-slate-500 dark:text-slate-400 @[640px]:text-left @[640px]:col-span-2">
                        {trade.date_opened}
                      </div>
                      <div className="col-span-2 @[640px]:col-span-1 text-right">
                        <button className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex min-h-[200px] items-center justify-center text-slate-500 dark:text-slate-400">
                    No trades found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {filteredTrades.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {Math.min(currentPage * itemsPerPage, filteredTrades.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {filteredTrades.length}
                </span>{' '}
                results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center h-8 w-8 rounded-md bg-slate-100 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  const page = currentPage <= 2 ? i + 1 : currentPage - 1 + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex items-center justify-center h-8 w-8 rounded-md text-sm font-semibold transition-colors ${
                        currentPage === page
                          ? 'bg-primary text-white hover:bg-primary/90'
                          : 'bg-slate-100 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center h-8 w-8 rounded-md bg-slate-100 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
        </div>
        </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTrades;
