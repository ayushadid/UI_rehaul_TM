import React, { useContext } from 'react';
import { UserContext } from '../../context/userContext';
import { useNavigate } from 'react-router-dom';

const SideMenu = ({ activeMenu, menuData = [], unreadCount }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleClick = (route) => {
    if (route === 'logout') {
      handleLogout();
      return;
    }
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate('/login');
  };

  return (
    <div className='p-4'>
      <div className='mb-6'>
        {user?.profileImageUrl && (
          <img
            src={user.profileImageUrl}
            alt='Profile'
            className='w-16 h-16 rounded-full object-cover mb-2'
          />
        )}
        <h5 className='text-md font-semibold'>{user?.name || ''}</h5>
        <p className='text-sm text-gray-500'>{user?.email || ''}</p>
         {user?.role === 'admin' && (
            <div className='text-xs text-white bg-primary inline-block px-2 py-0.5 rounded-md mt-1'>Admin</div>
        )}
      </div>

      <div>
        {menuData.map((item, index) => (
          <button
            key={`menu_${index}`}
            className={`w-full flex items-center gap-4 text-[15px] font-medium transition-colors duration-200 ${
              activeMenu === item.label
                ? 'text-primary bg-primary-light border-r-4 border-primary'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            } py-3 px-6 mb-2 rounded-lg cursor-pointer text-left`}
            onClick={() => handleClick(item.path)}
          >
            <div className="relative">
              <item.icon className="text-xl" />
              {/* This logic now uses the 'unreadCount' prop from the parent */}
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SideMenu;