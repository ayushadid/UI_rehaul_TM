import React, { useContext } from 'react';
import { UserContext } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { FaBell } from 'react-icons/fa';

const NotificationsPage = () => {
    const { user, notifications, markAllAsRead, markOneAsRead } = useContext(UserContext);
    const navigate = useNavigate();

    const unreadNotifications = notifications.filter(n => !n.read);
    const readNotifications = notifications.filter(n => n.read);

 const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markOneAsRead(notification._id);
        }

        // 👇 2. Use the 'user' variable (not 'currentUser')
        if (user.role === 'admin') {
            // For admins, we extract the ID from the link and navigate to the edit page
            const taskId = notification.link.split('/').pop();
            navigate('/admin/create-task', { state: { taskId: taskId } });
        } else {
            // For regular users, we just navigate to the link as is
            navigate(notification.link);
        }
    };

    return (
        <DashboardLayout activeMenu="Notifications">
            <div className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
                    {unreadNotifications.length > 0 && (
                        <button onClick={markAllAsRead} className="text-sm text-primary font-semibold hover:underline">
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Unread Notifications Section */}
                {unreadNotifications.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-500 mb-3 uppercase tracking-wider">Unread</h3>
                        <div className="space-y-3">
                            {unreadNotifications.map(n => (
                                <NotificationItem key={n._id} notification={n} onClick={handleNotificationClick} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Read Notifications Section */}
                <h3 className="text-lg font-semibold text-gray-500 mb-3 uppercase tracking-wider">Recent</h3>
                {notifications.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
                        <FaBell className="mx-auto text-4xl mb-2 text-gray-400" />
                        You have no notifications yet.
                    </div>
                ) : readNotifications.length > 0 ? (
                    <div className="space-y-3">
                        {readNotifications.slice(0, 20).map(n => ( // Show last 20 read
                            <NotificationItem key={n._id} notification={n} onClick={handleNotificationClick} />
                        ))}
                    </div>
                ) : (
                    // This shows if all notifications are unread
                    <div className="text-center py-10 text-gray-500">
                        No recent read notifications.
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

// Sub-component for rendering a single notification item
const NotificationItem = ({ notification, onClick }) => (
    <div 
      onClick={() => onClick(notification)} 
      className={`bg-white p-4 rounded-lg shadow-sm border flex items-start gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors ${!notification.read ? 'border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
    >
        <img 
          src={notification.sender?.profileImageUrl || `https://ui-avatars.com/api/?name=${notification.sender?.name.replace(/\s/g, '+') || 'A'}&background=random`} 
          alt={notification.sender?.name || 'Sender'} 
          className="w-10 h-10 rounded-full object-cover" 
        />
        <div className="flex-1">
            <p className="text-sm text-gray-800">{notification.message}</p>
            <p className="text-xs text-gray-400 mt-1">{moment(notification.createdAt).fromNow()}</p>
        </div>
    </div>
);

export default NotificationsPage;