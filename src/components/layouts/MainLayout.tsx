import React, { ReactNode, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../SideBar";
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
} from "react-icons/fa";
import Header from "../Header";

const menuItems = [
  { icon: FaChartLine, label: "Dashboard", href: "/" },
  { icon: FaChartLine, label: "Analytics", href: "/analytics" },
  { icon: FaWallet, label: "Wallet", href: "/wallet" },
  {
    icon: FaRobot,
    label: "Trading Bots",
    href: "#",
    subItems: [
      { icon: FaChartBar, label: "Trend Trading", href: "/bots/trend" },
      { icon: FaBalanceScale, label: "DCA Trading", href: "/bots/dca" },
      {
        icon: FaExchangeAlt,
        label: "Arbitrage Trading",
        href: "/bots/arbitrage",
      },
      { icon: FaBolt, label: "Frontrunner Trading", href: "/bots/frontrunner" },
    ],
  },
  { icon: FaCog, label: "Settings", href: "/settings" },
  { icon: FaQuestionCircle, label: "Help", href: "/help" },
];

interface MainLayoutProps {
  children?: ReactNode; // Optional prop if you want to pass children directly
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex h-screen overflow-hidden">
        {/* <!-- ===== Sidebar Start ===== --> */}
        <Sidebar menuItems={menuItems} />
        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* <!-- ===== Header Start ===== --> */}
          <Header />
          {/* <!-- ===== Header End ===== --> */}

          {/* <!-- ===== Main Content Start ===== --> */}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children || <Outlet />}
            </div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
        </div>
        {/* <!-- ===== Content Area End ===== --> */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </div>
  );
};

export default MainLayout;
