import React, { useContext } from 'react'; // 👈 1. Import useContext
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/userContext'; // 👈 2. Import UserContext

const BottomNavBar = ({ menuItems, activeMenu }) => {
    const navigate = useNavigate();
    // 3. Get notifications from the context
    const { notifications } = useContext(UserContext);

    // 4. Calculate the unread count
    const unreadCount = notifications.filter(n => !n.read).length;

    const navItems = menuItems.filter(item => item.path !== 'logout').slice(0, 4);

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40 md:hidden">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = activeMenu === item.label;
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`relative flex flex-col items-center justify-center w-full h-full text-xs transition-all duration-300 ease-in-out ${
                                isActive ? 'text-primary font-bold' : 'text-gray-500 hover:text-primary'
                            }`}
                        >
                            {/* 5. Wrap the icon in a relative container */}
                            <div className="relative">
                                <item.icon className={`text-2xl mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                                {/* Conditionally render the red dot */}
                                {item.label === 'Notifications' && unreadCount > 0 && (
                                    <span className="absolute -top-1 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </div>
                            <span>{item.label}</span>
                            {isActive && (
                                <div className="absolute bottom-1 w-6 h-1 bg-primary rounded-full transition-all duration-300" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavBar;