import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

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
            className={`group flex items-center justify-between w-full py-3.5 px-4 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gradient-to-r hover:from-primary/8 hover:to-secondary/8 dark:hover:from-primary/15 dark:hover:to-secondary/15 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10 hover:scale-[1.01] border border-transparent hover:border-primary/15 dark:hover:border-primary/25 ${
              openDropdown === item.label 
                ? 'bg-gradient-to-r from-primary/12 to-secondary/12 dark:from-primary/20 dark:to-secondary/20 shadow-xl shadow-primary/10 dark:shadow-primary/15 border-primary/20 dark:border-primary/30 scale-[1.01]' 
                : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/40'
            }`}
          >
            <div className='flex items-center'>
              <div className={`p-2.5 rounded-xl mr-4 transition-all duration-300 ${
                openDropdown === item.label 
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-300 group-hover:from-primary group-hover:to-secondary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25'
              }`}>
                <item.icon className='h-4 w-4' />
              </div>
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </div>
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              openDropdown === item.label 
                ? 'bg-white/15 text-primary dark:text-secondary shadow-sm' 
                : 'group-hover:bg-white/10 dark:group-hover:bg-gray-700/50'
            }`}>
              {openDropdown === item.label ? (
                <FaChevronUp className='h-3 w-3' />
              ) : (
                <FaChevronDown className='h-3 w-3' />
              )}
            </div>
          </button>
          <AnimatePresence>
            {openDropdown === item.label && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -15 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className='ml-6 mt-3 overflow-hidden bg-gradient-to-r from-white/60 to-blue-50/60 dark:from-gray-800/60 dark:to-gray-700/60 rounded-2xl border border-gray-200/60 dark:border-gray-600/40 backdrop-blur-md shadow-lg'
              >
                <div className="p-3 space-y-2">
                  {item.subItems.map((subItem) => (
                    <a
                      key={subItem.label}
                      href={subItem.href}
                      className={`group flex items-center py-3 px-4 text-gray-700 dark:text-gray-300 font-medium hover:bg-gradient-to-r hover:from-primary/8 hover:to-secondary/8 dark:hover:from-primary/12 dark:hover:to-secondary/12 rounded-xl transition-all duration-300 hover:text-primary dark:hover:text-secondary hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] border border-transparent hover:border-primary/15 dark:hover:border-primary/20`}
                    >
                      <div className="p-2 rounded-lg mr-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 text-gray-600 dark:text-gray-300 group-hover:from-primary group-hover:to-secondary group-hover:text-white transition-all duration-300 group-hover:shadow-md">
                        <subItem.icon className='h-3 w-3' />
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
          className={`group flex items-center py-3.5 px-4 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gradient-to-r hover:from-primary/8 hover:to-secondary/8 dark:hover:from-primary/15 dark:hover:to-secondary/15 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10 hover:scale-[1.01] border border-transparent hover:border-primary/15 dark:hover:border-primary/25 hover:bg-gray-50/80 dark:hover:bg-gray-800/40`}
        >
          <div className="p-2.5 rounded-xl mr-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-300 group-hover:from-primary group-hover:to-secondary group-hover:text-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/25">
            <item.icon className='h-4 w-4' />
          </div>
          <span className="font-bold text-sm tracking-wide">{item.label}</span>
        </a>
      </div>
    );
  };

  return (
    <aside className={`h-full flex flex-col bg-transparent`}>
      {/* Navigation Section */}
      <nav className='px-5 py-8 flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent'>
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-4 mb-6 opacity-75">
            Navigation
          </h3>
          {menuItems.map(renderMenuItem)}
        </div>
        
        {/* Bottom Section */}
        <div className="mt-auto pt-6 border-t border-gray-200/60 dark:border-gray-600/40">
          <div className="px-4 py-4 bg-gradient-to-r from-primary/8 to-secondary/8 dark:from-primary/15 dark:to-secondary/15 rounded-2xl border border-primary/15 dark:border-primary/25 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                TP
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800 dark:text-gray-200">Pro Plan</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Premium Features</div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

