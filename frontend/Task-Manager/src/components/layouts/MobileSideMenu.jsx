import React from 'react';
import SideMenu from './SideMenu';

const MobileSideMenu = ({ isOpen, onClose, activeMenu, menuData }) => {
  // Don't render anything if the menu is closed
  if (!isOpen) {
    return null;
  }

  return (
    // This container is fixed to the screen and only visible on mobile (hidden on 'md' screens and up)
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Semi-transparent overlay that closes the menu when clicked */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* The actual menu content that slides in from the left */}
      <div 
        className="relative bg-white w-72 h-full shadow-xl transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <SideMenu activeMenu={activeMenu} menuData={menuData} />
      </div>
    </div>
  );
};

export default MobileSideMenu;