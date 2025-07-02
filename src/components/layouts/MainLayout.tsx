import React, { ReactNode, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../SideBar';
import {
  FaChartLine,
  FaWallet,
  FaCog,
  FaQuestionCircle,
  FaRobot,
  FaChartBar,
  FaBalanceScale,
  FaExchangeAlt,
  FaBolt,
} from 'react-icons/fa';
import Header from '../Header';

const menuItems = [
  { icon: FaChartLine, label: 'Dashboard', href: '/' },
  {
    icon: FaWallet,
    label: 'My Portfolios',
    href: '#',
    subItems: [
      { icon: FaChartBar, label: 'Portfolio', href: '/portfolio' },
      { icon: FaChartBar, label: 'My Trades', href: '/my-trades' },
      { icon: FaChartBar, label: 'Manual Trade', href: '/manual-trade' },
    ],
  },
  {
    icon: FaRobot,
    label: 'Trading Bots',
    href: '#',
    subItems: [
      { icon: FaChartBar, label: 'Trend Trading', href: '/bots/trend' },
      { icon: FaBalanceScale, label: 'DCA Trading', href: '/bots/dca' },
      { icon: FaExchangeAlt, label: 'Arbitrage Trading', href: '/bots/arbitrage' },
      { icon: FaBolt, label: 'Frontrunner Trading', href: '/bots/frontrunner' },
      { icon: FaChartBar, label: 'Manage Bots', href: '/bots/manage' },
    ],
  },
  { icon: FaCog, label: 'Settings', href: '/settings' },
  { icon: FaQuestionCircle, label: 'Help', href: '/help' },
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
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-boxdark-2 dark:to-gray-800">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 h-[70px] border-b border-gray-200/50 bg-white/80 shadow-lg backdrop-blur-xl dark:border-strokedark dark:bg-boxdark">
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-[70px] z-40 w-[280px] border-r border-gray-200/50 bg-white/70 shadow-2xl backdrop-blur-xl transition-transform duration-300 dark:border-strokedark dark:bg-boxdark ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0`}
      >
        <Sidebar menuItems={menuItems} />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 sm:hidden" onClick={toggleSidebar} />}

      {/* Main Content */}
      <main className="min-h-screen pt-[70px] sm:ml-[280px]">
        <div className="p-6 md:p-8 2xl:p-10">
          <div className="mx-auto max-w-screen-2xl">
            <div className="min-h-[calc(100vh-140px)] rounded-2xl border border-gray-200/50 bg-white/60 p-4 shadow-xl backdrop-blur-sm dark:border-strokedark dark:bg-boxdark sm:p-6 md:p-8 2xl:p-10">
              {children || <Outlet />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
