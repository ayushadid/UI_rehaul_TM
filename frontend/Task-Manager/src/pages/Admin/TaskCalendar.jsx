import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';
import { useNavigate } from 'react-router-dom';

// Setup the localizer by telling react-big-calendar to use moment.js
const localizer = momentLocalizer(moment);

const TaskCalendar = () => {
    const { user: currentUser } = useContext(UserContext);
    const navigate = useNavigate();
    
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('all');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Fetch the list of users for the admin filter dropdown
    useEffect(() => {
        if (currentUser?.role === 'admin') {
            const fetchUsers = async () => {
                try {
                    const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
                    setUsers(response.data.users || response.data || []);
                } catch (error) {
                    console.error("Error fetching users for filter", error);
                }
            };
            fetchUsers();
        }
    }, [currentUser]);

    // This function fetches the tasks for the calendar
    const fetchEvents = useCallback(async (date) => {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        const params = new URLSearchParams({ month, year });
        if (currentUser.role === 'admin' && selectedUserId !== 'all') {
            params.append('userId', selectedUserId);
        }

        try {
            const response = await axiosInstance.get(`${API_PATHS.TASKS.GET_TASKS_FOR_CALENDAR}?${params.toString()}`);
            // Format the data into the structure react-big-calendar expects
            const formattedEvents = response.data.map(task => ({
                id: task.id,
                title: task.text,
                start: new Date(task.start),
                end: new Date(task.end),
                resource: { status: task.backColor } // Store color info here
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error("Failed to load calendar events", error);
        }
    }, [currentUser, selectedUserId]);
    
    // This effect re-fetches events when the date or user filter changes
    useEffect(() => {
        fetchEvents(currentDate);
    }, [currentDate, fetchEvents]);

    // Custom styling for each event bubble
    const eventStyleGetter = (event) => {
        const backgroundColor = event.resource.status;
        const style = {
            backgroundColor: backgroundColor,
            borderRadius: '5px',
            opacity: 0.8,
            color: 'white',
            border: '0px',
            display: 'block'
        };
        return { style };
    };

    return (
        <>
            <div className="p-4 md:p-6 h-full flex flex-col">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Task Calendar</h2>
                    {currentUser?.role === 'admin' && (
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="form-input text-sm w-full md:w-64"
                        >
                            <option value="all">All Users</option>
                            {users.map(user => (
                                <option key={user._id} value={user._id}>{user.name}</option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex-grow card" style={{ height: 'calc(100vh - 150px)' }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={event => navigate(`/admin/create-task`, { state: { taskId: event.id } })}
                        onNavigate={date => setCurrentDate(date)}
                    />
                </div>
            </div>
        </>
    );
};

export default TaskCalendar;