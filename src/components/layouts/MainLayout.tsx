import React, { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { AppShell, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
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
  {
    icon: FaWallet,
    label: "My Portfolios",
    href: "#",
    subItems: [
      { icon: FaChartBar, label: "Portfolio", href: "/portfolio" },
      { icon: FaChartBar, label: "My Trades", href: "/my-trades" },
      { icon: FaChartBar, label: "Manual Trade", href: "/manual-trade" },
    ]
  },
  {
    icon: FaRobot,
    label: "Trading Bots",
    href: "#",
    subItems: [
      { icon: FaChartBar, label: "Trend Trading", href: "/bots/trend" },
      { icon: FaBalanceScale, label: "DCA Trading", href: "/bots/dca" },
      { icon: FaExchangeAlt, label: "Arbitrage Trading", href: "/bots/arbitrage" },
      { icon: FaBolt, label: "Frontrunner Trading", href: "/bots/frontrunner" },
      { icon: FaChartBar, label: "Manage Bots", href: "/bots/manage" },
    ],
  },
  { icon: FaCog, label: "Settings", href: "/settings" },
  { icon: FaQuestionCircle, label: "Help", href: "/help" },
];

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      className="dark:bg-boxdark-2 dark:text-bodydark "
    >
      <AppShell.Header>
        <div className="flex items-center justify-between w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
            className="mr-25 text-dark dark:text-white" // Set light and dark colors
          />
          <Header />
        </div>
      </AppShell.Header>


      <AppShell.Navbar>
        <div className="dark:bg-boxdark-2 ">
          <Sidebar menuItems={menuItems} />
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
          {children || <Outlet />}
        </div>
      </AppShell.Main>
    </AppShell>
  );
};

export default MainLayout;
