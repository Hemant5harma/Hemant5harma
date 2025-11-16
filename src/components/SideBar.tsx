import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../assets/image/logo.svg';
import { removeAuthToken } from '../utils/auth';
import { showNotification } from '@mantine/notifications';

interface MenuItem {
  icon: string;
  label: string;
  href: string;
  subItems?: MenuItem[];
}

interface SidebarProps {
  menuItems: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ menuItems }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    // Load user info from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserInfo({ name: user.name || 'User', email: user.email || '' });
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    showNotification({
      title: 'Logged Out',
      message: 'You have been logged out successfully',
      color: 'blue',
    });
    navigate('/');
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.href);
    
    if (item.subItems) {
      const hasActiveSubItem = item.subItems.some(subItem => isActive(subItem.href));
      const isOpen = openDropdown === item.label || hasActiveSubItem;

      return (
        <div key={item.label}>
          <button
            onClick={() => toggleDropdown(item.label)}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active || isOpen
                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-background-light dark:hover:bg-background-dark'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            <p className="flex-1 text-left">{item.label}</p>
            <span className="material-symbols-outlined text-lg">
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-6 mt-1 overflow-hidden"
              >
                <div className="space-y-1 border-l border-border-light dark:border-border-dark pl-4">
                  {item.subItems.map((subItem) => {
                    const subActive = isActive(subItem.href);
                    return (
                      <Link
                      key={subItem.label}
                        to={subItem.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          subActive
                            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary font-semibold'
                            : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-background-light dark:hover:bg-background-dark'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">{subItem.icon}</span>
                        <p>{subItem.label}</p>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <div key={item.label}>
        <Link
          to={item.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            active
              ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-background-light dark:hover:bg-background-dark'
          }`}
        >
          <span className="material-symbols-outlined text-2xl">{item.icon}</span>
          <p>{item.label}</p>
        </Link>
      </div>
    );
  };

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-card-light dark:bg-card-dark border-r border-border-light dark:border-border-dark p-6">
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="mb-8 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={Logo} alt="TradePro" className="h-10 w-10" />
            <div className="flex flex-col">
              <h1 className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold leading-tight">
                TradePro
              </h1>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs font-normal leading-tight">
                Trading Dashboard
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Heading */}
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-light-secondary dark:text-text-dark-secondary">
            Navigation
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1">
          {menuItems.map(renderMenuItem)}
        </nav>
        </div>

        {/* Bottom Section */}
      <div className="flex flex-col gap-2 mt-auto">
        <Link
          to="/help"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-light-secondary transition-colors hover:bg-background-light dark:text-text-dark-secondary dark:hover:bg-background-dark"
        >
          <span className="material-symbols-outlined text-2xl">help</span>
          <p>Support</p>
        </Link>
        <div className="my-2 h-px w-full bg-border-light dark:bg-border-dark"></div>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-background-light dark:hover:bg-background-dark">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {userInfo?.name
              ? userInfo.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2)
              : 'U'}
          </div>
          <div className="flex flex-1 flex-col">
            <p className="text-sm font-semibold leading-normal text-text-light-primary dark:text-text-dark-primary">
              {userInfo?.name || 'User'}
            </p>
            <p className="text-xs font-normal leading-normal text-text-light-secondary dark:text-text-dark-secondary">
              {userInfo?.email || 'No email'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-text-light-secondary transition-colors hover:text-primary dark:text-text-dark-secondary dark:hover:text-primary"
            aria-label="Logout"
          >
            <span className="material-symbols-outlined text-xl">exit_to_app</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
