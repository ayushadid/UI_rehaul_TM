import React, { useContext } from 'react';
import { UserContext } from '../../context/userContext';
import { LuMenu } from 'react-icons/lu'; // A clean menu icon

// The Navbar now receives an onMenuClick function as a prop
const Navbar = ({ activeMenu, onMenuClick }) => {
    const { user } = useContext(UserContext);

    // This component no longer needs its own state to manage the side menu
    
    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center h-16 flex-shrink-0 z-30">
            <div className="flex items-center gap-4">
                {/* Hamburger Icon - Mobile Only */}
                {/* It calls the onMenuClick function passed down from the layout */}
                <button 
                    onClick={onMenuClick} 
                    className="md:hidden text-2xl text-gray-600"
                >
                    <LuMenu />
                </button>

                {/* Page Title - Desktop Only */}
                <h2 className="font-bold text-lg text-primary hidden md:block">{activeMenu}</h2>
            </div>
            
            {/* User Info on the right side */}
            <div className="flex items-center gap-3">
                <span className="font-semibold text-sm hidden sm:block">{user?.name}</span>
                <img 
                    src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.name || 'A'}`} 
                    alt="profile" 
                    className="w-9 h-9 rounded-full object-cover"
                />
            </div>
        </header>
    );
};

export default Navbar;