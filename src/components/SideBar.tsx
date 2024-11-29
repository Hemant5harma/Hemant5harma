import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaChevronUp, FaSun, FaMoon } from "react-icons/fa";

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
        <div key={item.label}>
          <button
            onClick={() => toggleDropdown(item.label)}
            className={`flex items-center justify-between w-full py-2 px-4 text-bodydark1 font-medium hover:bg-graydark rounded transition-colors duration-200`}>
            <div className='flex items-center'>
              <item.icon className='h-5 w-5 mr-3' />
              {item.label}
            </div>
            {openDropdown === item.label ? (
              <FaChevronUp className='h-4 w-4' />
            ) : (
              <FaChevronDown className='h-4 w-4' />
            )}
          </button>
          <AnimatePresence>
            {openDropdown === item.label && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className='ml-6 mt-2 overflow-hidden'>
                {item.subItems.map((subItem) => (
                  <a
                    key={subItem.label}
                    href={subItem.href}
                    className={`flex items-center py-2 px-4 text-bodydark1 font-medium  hover:bg-graydark  rounded transition-colors duration-200`}>
                    <subItem.icon className='h-4 w-4 mr-3' />
                    {subItem.label}
                  </a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <a
        key={item.label}
        href={item.href}
        className={`flex items-center py-2 px-4 text-bodydark1 font-medium  hover:bg-graydark rounded transition-colors duration-200`}>
        <item.icon className='h-5 w-5 mr-3' />
        {item.label}
      </a>
    );
  };

  return (
    <aside
      className={`bg-black dark:bg-boxdark w-64 h-screen overflow-y-auto flex flex-col`}>
      <div
        className={`sticky top-0 bg-black dark:bg-boxdark z-10 pb-4`}>
        <a href="/" className='flex items-center justify-center gap-2 px-6 py-5.5 lg:py-6.5'>
          <svg
            className='h-8 w-8 fill-current text-white-300'
            viewBox='0 0 24 24'>
            <path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'></path>
          </svg>
          <span
            className={`text-2xl font-bold ml-2 text-white`}>
            SiteName
          </span>
        </a>
      </div>
      <nav className='px-4 pb-4 flex flex-col gap-1.5'>{menuItems.map(renderMenuItem)}</nav>
    </aside>
  );
};

export default Sidebar;
