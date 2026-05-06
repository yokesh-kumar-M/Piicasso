import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DesignAppShell from '../components/design/dashboard/DesignAppShell';

const getActiveKey = (pathname) => {
  if (pathname === '/user/history') return 'passwords';
  return 'overview';
};

const UserModeLayout = () => {
  const location = useLocation();
  return (
    <DesignAppShell activeKey={getActiveKey(location.pathname)}>
      <Outlet />
    </DesignAppShell>
  );
};

export default UserModeLayout;
