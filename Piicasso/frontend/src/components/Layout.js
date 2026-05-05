// src/components/Layout.js
import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from './Navbar';
import useResponsive from '../hooks/useResponsive';

const Layout = ({ children }) => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const { isMobile, isTablet, isMobileOrTablet } = useResponsive();

  // Dynamically adjust padding and max-width based on device
  const getMainClass = () => {
    if (isMobile) {
      return "flex-1 w-full px-4 pt-20 pb-8 flex flex-col";
    } else if (isTablet) {
      return "flex-1 w-full max-w-5xl mx-auto pt-24 px-6 pb-10 flex flex-col";
    } else {
      return "flex-1 w-full max-w-7xl mx-auto pt-24 px-6 pb-12 flex flex-col";
    }
  };

  return (
    <div className={`flex-1 flex flex-col bg-dark-bg text-white font-mono w-full relative ${isMobileOrTablet ? 'overflow-x-hidden' : ''}`}>
      <Navbar />
      
      <main className={getMainClass()}>
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;