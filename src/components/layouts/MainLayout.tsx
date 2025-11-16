import React, { ReactNode, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../SideBar';
import Header from '../Header';

const menuItems = [
  { icon: 'dashboard', label: 'Dashboard', href: '/' },
  {
    icon: 'account_balance_wallet',
    label: 'My Portfolios',
    href: '#',
    subItems: [
      { icon: 'pie_chart', label: 'Portfolio Overview', href: '/portfolio' },
    ],
  },
  {
    icon: 'smart_toy',
    label: 'Trading Bots',
    href: '#',
    subItems: [
      { icon: 'trending_up', label: 'Trend Trading', href: '/bots/trend' },
      { icon: 'account_balance', label: 'DCA Trading', href: '/bots/dca' },
      { icon: 'swap_horiz', label: 'Arbitrage Trading', href: '/bots/arbitrage' },
      { icon: 'bolt', label: 'Frontrunner Trading', href: '/bots/frontrunner' },
      { icon: 'settings', label: 'Manage Bots', href: '/bots/manage' },
    ],
  },
  { icon: 'swap_horiz', label: 'Exchanges', href: '/manual-trade' },
  { icon: 'history', label: 'My Trades', href: '/my-trades' },
  { icon: 'settings', label: 'Settings', href: '/settings' },
];

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-display">
      {/* Sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-40 w-64 border-r border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0`}
      >
        <Sidebar menuItems={menuItems} />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col sm:ml-64">
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

      {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-3 sm:p-4 lg:p-6 xl:p-8">
              {children || <Outlet />}
          </div>
        </main>
        </div>
    </div>
  );
};

export default MainLayout;
