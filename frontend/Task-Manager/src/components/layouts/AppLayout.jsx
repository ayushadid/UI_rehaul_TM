import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar'; // We will create this next
import Header from './Header';   // We will create this next
import { SIDE_MENU_DATA, SIDE_MENU_USER_DATA } from '../../utils/data';
import { useContext } from 'react';
import { UserContext } from '../../context/userContext';

// Helper function to find the active menu label from the path
const getActiveMenu = (menuData, pathname) => {
  const activeItem = menuData.find(item => item.path === pathname);
  return activeItem ? activeItem.label : 'Dashboard'; // Default to Dashboard
};

const AppLayout = () => {
  const { user } = useContext(UserContext);
  const location = useLocation();
  
  const menuData = user?.role === 'admin' ? SIDE_MENU_DATA : SIDE_MENU_USER_DATA;
  const activeMenu = getActiveMenu(menuData, location.pathname);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      {/* Persistent Left Sidebar */}
      <Sidebar menuData={menuData} activeMenu={activeMenu} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Contextual Top Header */}
        <Header activeMenu={activeMenu} />
        
        {/* Page Content - Renders the active route */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;