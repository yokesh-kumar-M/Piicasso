// src/components/Layout.js
import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const { isAuthenticated, logout } = useContext(AuthContext);

  return (
    <div className="flex-1 flex flex-col bg-dark-bg text-white font-mono w-full relative">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto pt-24 px-6 pb-12 flex flex-col">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;