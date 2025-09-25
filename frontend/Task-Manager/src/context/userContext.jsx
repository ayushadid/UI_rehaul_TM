import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosinstance";
import { API_PATHS, BASE_URL } from '../utils/apiPaths';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null); // This state holds the connection

  // This useEffect for fetching the initial user is correct and unchanged
  useEffect(() => {
    if (user) return;
    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
      setLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        setUser(response.data);
      } catch (error) {
        console.error("User not authenticated", error);
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [user]);

  // This is the single, correct useEffect for managing the WebSocket connection
  useEffect(() => {
    const fetchNotifications = async () => {
        try {
            const response = await axiosInstance.get(API_PATHS.NOTIFICATIONS.GET_ALL);
            setNotifications(response.data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    let newSocket;
    if (user) {
      fetchNotifications();

      newSocket = io(BASE_URL);
      newSocket.emit('setup', user._id);
      setSocket(newSocket); // Store the connection in state

      newSocket.on('notification', (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        toast.success(newNotification.message, { icon: '🔔' });
      });
    }
    
    // Cleanup function to disconnect socket when user logs out
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    if (notifications.every(n => n.read)) return;
    try {
      await axiosInstance.put(API_PATHS.NOTIFICATIONS.MARK_AS_READ);
      // Update local state instantly for a great UX
      setNotifications(current => current.map(n => ({ ...n, read: true })));
    } catch (error) {
      toast.error("Could not update notifications.");
    }
  };

  // Function to mark a single notification as read
  const markOneAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(API_PATHS.NOTIFICATIONS.MARK_ONE_AS_READ(notificationId));
      // Update local state instantly
      setNotifications(current => current.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      toast.error("Could not update notification.");
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }
    setLoading(false);
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        loading, 
        updateUser, 
        clearUser, 
        notifications, 
        markAllAsRead, 
        markOneAsRead,
        socket,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;