import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  subItems?: MenuItem[];
}

interface SidebarProps {
  menuItems: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ menuItems }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const renderMenuItem = (item: MenuItem) => {
    if (item.subItems) {
      return (
        <div key={item.label} className="mb-3">
          <button
            onClick={() => toggleDropdown(item.label)}
            className={`hover:from-primary/8 hover:to-secondary/8 group flex w-full items-center justify-between rounded-2xl border border-transparent px-4 py-3.5 font-semibold text-gray-800 transition-all duration-300 hover:scale-[1.01] hover:border-primary/15 hover:bg-gradient-to-r hover:shadow-xl hover:shadow-primary/5 dark:text-gray-200 dark:hover:border-primary/25 dark:hover:from-primary/15 dark:hover:to-secondary/15 dark:hover:shadow-primary/10 ${
              openDropdown === item.label
                ? 'from-primary/12 to-secondary/12 scale-[1.01] border-primary/20 bg-gradient-to-r shadow-xl shadow-primary/10 dark:border-primary/30 dark:from-primary/20 dark:to-secondary/20 dark:shadow-primary/15'
                : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/40'
            }`}
          >
            <div className="flex items-center">
              <div
                className={`mr-4 rounded-xl p-2.5 transition-all duration-300 ${
                  openDropdown === item.label
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 group-hover:from-primary group-hover:to-secondary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300'
                }`}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold tracking-wide">{item.label}</span>
            </div>
            <div
              className={`rounded-xl p-2 transition-all duration-300 ${
                openDropdown === item.label
                  ? 'bg-white/15 text-primary shadow-sm dark:text-secondary'
                  : 'group-hover:bg-white/10 dark:group-hover:bg-gray-700/50'
              }`}
            >
              {openDropdown === item.label ? (
                <FaChevronUp className="h-3 w-3" />
              ) : (
                <FaChevronDown className="h-3 w-3" />
              )}
            </div>
          </button>
          <AnimatePresence>
            {openDropdown === item.label && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -15 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -15 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="ml-6 mt-3 overflow-hidden rounded-2xl border border-gray-200/60 bg-gradient-to-r from-white/60 to-blue-50/60 shadow-lg backdrop-blur-md dark:border-gray-600/40 dark:from-gray-800/60 dark:to-gray-700/60"
              >
                <div className="space-y-2 p-3">
                  {item.subItems.map((subItem) => (
                    <a
                      key={subItem.label}
                      href={subItem.href}
                      className={`hover:from-primary/8 hover:to-secondary/8 dark:hover:from-primary/12 dark:hover:to-secondary/12 group flex items-center rounded-xl border border-transparent px-4 py-3 font-medium text-gray-700 transition-all duration-300 hover:scale-[1.02] hover:border-primary/15 hover:bg-gradient-to-r hover:text-primary hover:shadow-lg hover:shadow-primary/5 dark:text-gray-300 dark:hover:border-primary/20 dark:hover:text-secondary`}
                    >
                      <div className="mr-3 rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 p-2 text-gray-600 transition-all duration-300 group-hover:from-primary group-hover:to-secondary group-hover:text-white group-hover:shadow-md dark:from-gray-600 dark:to-gray-500 dark:text-gray-300">
                        <subItem.icon className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-semibold tracking-wide">{subItem.label}</span>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <div key={item.label} className="mb-3">
        <a
          href={item.href}
          className={`hover:from-primary/8 hover:to-secondary/8 group flex items-center rounded-2xl border border-transparent px-4 py-3.5 font-semibold text-gray-800 transition-all duration-300 hover:scale-[1.01] hover:border-primary/15 hover:bg-gray-50/80 hover:bg-gradient-to-r hover:shadow-xl hover:shadow-primary/5 dark:text-gray-200 dark:hover:border-primary/25 dark:hover:bg-gray-800/40 dark:hover:from-primary/15 dark:hover:to-secondary/15 dark:hover:shadow-primary/10`}
        >
          <div className="mr-4 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 p-2.5 text-gray-600 transition-all duration-300 group-hover:from-primary group-hover:to-secondary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300">
            <item.icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-wide">{item.label}</span>
        </a>
      </div>
    );
  };

  return (
    <aside className={`flex h-full flex-col bg-transparent`}>
      {/* Navigation Section */}
      <nav className="custom-scroll flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-8">
        <div className="mb-6">
          <h3 className="mb-6 px-4 text-xs font-bold uppercase tracking-widest text-gray-500 opacity-75 dark:text-gray-400">
            Navigation
          </h3>
          {menuItems.map(renderMenuItem)}
        </div>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-gray-200/60 pt-6 dark:border-gray-600/40">
          <div className="from-primary/8 to-secondary/8 rounded-2xl border border-primary/15 bg-gradient-to-r px-4 py-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:border-primary/25 dark:from-primary/15 dark:to-secondary/15">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-sm font-bold text-white shadow-lg">
                TP
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800 dark:text-gray-200">Pro Plan</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Premium Features
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
