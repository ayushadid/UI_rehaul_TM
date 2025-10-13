import React, { useContext, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import toast from 'react-hot-toast';
import { FaBell } from 'react-icons/fa';
import { LuMegaphone, LuClipboardCheck } from 'react-icons/lu';
import { UserContext } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Modal from '../../components/Modal';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';

const NotificationsPage = () => {
    const { user, notifications, markAllAsRead, markOneAsRead } = useContext(UserContext);
    const navigate = useNavigate();
    const [viewingAnnouncement, setViewingAnnouncement] = useState(null);
    
    // State to manage the active filter tab
    const [activeFilter, setActiveFilter] = useState('All');

    // Filtering logic based on the active tab
    const filteredNotifications = useMemo(() => {
        if (activeFilter === 'Tasks') {
            return notifications.filter(n => n.link.includes('/task-details/'));
        }
        if (activeFilter === 'Announcements') {
            return notifications.filter(n => n.link.includes('/announcements/'));
        }
        return notifications; // Default is 'All'
    }, [notifications, activeFilter]);

    const fetchAndShowAnnouncement = async (announcementId) => {
        try {
            const response = await axiosInstance.get(API_PATHS.ANNOUNCEMENTS.GET_BY_ID(announcementId));
            setViewingAnnouncement(response.data);
        } catch (error) {
            toast.error("Could not load the announcement.");
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markOneAsRead(notification._id);
        }

        if (notification.link.startsWith('/announcements/')) {
            const announcementId = notification.link.split('/').pop();
            fetchAndShowAnnouncement(announcementId);
        } else if (notification.link.startsWith('/user/task-details/')) {
            const taskId = notification.link.split('/').pop();
            const path = user.role === 'admin' ? '/admin/create-task' : `/user/task-details/${taskId}`;
            navigate(path, { state: { taskId } });
        }
    };

    const unreadNotifications = filteredNotifications.filter(n => !n.read);
    const readNotifications = filteredNotifications.filter(n => n.read);

    // Sub-component for the filter buttons to keep the main return clean
    const FilterButton = ({ label, icon: Icon }) => {
        const isActive = activeFilter === label;
        return (
            <button
                onClick={() => setActiveFilter(label)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100'
                }`}
            >
                <Icon />
                {label}
            </button>
        );
    };

    return (
        <>
            <div className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Inbox</h2>
                    {unreadNotifications.length > 0 && (
                        <button onClick={markAllAsRead} className="text-sm text-primary font-semibold hover:underline">
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 mb-6 border-b pb-4">
                    <FilterButton label="All" icon={FaBell} />
                    <FilterButton label="Tasks" icon={LuClipboardCheck} />
                    <FilterButton label="Announcements" icon={LuMegaphone} />
                </div>

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

                <h3 className="text-lg font-semibold text-gray-500 mb-3 uppercase tracking-wider">Recent</h3>
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
                        <FaBell className="mx-auto text-4xl mb-2 text-gray-400" />
                        No notifications match this filter.
                    </div>
                ) : readNotifications.length > 0 ? (
                    <div className="space-y-3">
                        {readNotifications.slice(0, 20).map(n => (
                            <NotificationItem key={n._id} notification={n} onClick={handleNotificationClick} />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-10 text-gray-500">
                        No recent read notifications.
                    </div>
                )}
            </div>

            <Modal isOpen={!!viewingAnnouncement} onClose={() => setViewingAnnouncement(null)} title={viewingAnnouncement?.title}>
                <div className="prose max-w-none prose-slate">
                    <p className="whitespace-pre-wrap">{viewingAnnouncement?.content}</p>
                </div>
                <div className="mt-6 pt-4 border-t text-sm text-slate-500">
                    Sent by <strong>{viewingAnnouncement?.sender?.name}</strong> on {moment(viewingAnnouncement?.createdAt).format('MMMM Do, YYYY')}
                </div>
            </Modal>
        </>
    );
};

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