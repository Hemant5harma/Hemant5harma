import React, { ReactNode, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../SideBar";

// Components
// import Header from './Header';
// import Footer from './Footer';

interface MainLayoutProps {
  children?: ReactNode; // Optional prop if you want to pass children directly
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  return (
    <div className='main-layout'>
      {/* Header Section */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <main className='content'>
        {children || <Outlet />}{" "}
        {/* Render children or the routed components */}
      </main>

      {/* Footer Section */}
      {/* <Footer /> */}
    </div>
  );
};

export default MainLayout;
