import React from 'react';
import DarkModeSwitcher from './DarkModeSwitcher';
import DropdownNotification from './DropdownNotification';
import DropdownUser from './DropdownUser';
import Logo from '../assets/image/logo.svg';
import { FaBars, FaTimes } from 'react-icons/fa';

interface HeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen = false, onToggleSidebar }) => {
  // const handleSearch = (query: string) => {
  //   console.log("Searching for:", query);
  //   // Implement search logic here
  //   // Could dispatch to Redux store or call API
  // };

  return (
    <header className="flex-1">
      <div className="flex flex-grow items-center justify-between px-4 py-4 md:px-6 2xl:px-8">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <a href="/" className="group flex items-center gap-3">
            <div className="relative">
              <img
                src={Logo}
                alt="TradePro Logo"
                className="h-10 w-10 drop-shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-xl"
              />
              <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-20 dark:group-hover:opacity-30"></div>
            </div>
            <div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-bold text-transparent transition-all duration-300 group-hover:from-secondary group-hover:to-primary">
                TradePro
              </span>
            </div>
          </a>
        </div>

        {/* Search Section */}
        {/* <SearchBar 
          placeholder="Search crypto, portfolios, bots..."
          onSearch={handleSearch}
        /> */}

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          <ul className="flex items-center gap-2 sm:gap-3">
            {/* Dark Mode Toggler */}
            <li>
              <DarkModeSwitcher />
            </li>
            {/* Notification Menu Area */}
            <li className="hidden sm:block">
              <DropdownNotification />
            </li>
          </ul>

          {/* User Area */}
          <DropdownUser />

          {/* Mobile Burger Menu */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="ml-2 rounded-lg p-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 sm:hidden"
            >
              {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
