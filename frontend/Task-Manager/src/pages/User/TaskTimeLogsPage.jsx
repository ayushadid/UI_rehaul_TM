// src/pages/User/TaskTimeLogsPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import moment from 'moment'; // For date formatting
import { UserContext } from '../../context/userContext'; // To check user role if needed

const TaskTimeLogsPage = () => {
    const { taskId } = useParams(); // Get taskId from URL
    const { user } = useContext(UserContext); // Current logged-in user
    const [timeLogs, setTimeLogs] = useState([]);
    const [totalDurationMs, setTotalDurationMs] = useState(0);
    const [taskTitle, setTaskTitle] = useState("Loading Task..."); // To display the task title
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper to format duration (HH:MM:SS)
    const formatDuration = (ms) => {
        if (ms === 0) return "00:00:00";
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)));
        const pad = (num) => num.toString().padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    // Helper to format date and time for individual logs
    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        return moment(dateString).format('Do MMM YYYY, HH:mm:ss');
    };

    useEffect(() => {
        const fetchTimeLogs = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch task details (just the title)
                const taskResponse = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(taskId));
                if (taskResponse.data?.title) {
                    setTaskTitle(taskResponse.data.title);
                }

                // Fetch time logs for this task
                const logsResponse = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_TIMELOGS(taskId));
                if (logsResponse.data) {
                    setTimeLogs(logsResponse.data.timeLogs || []);
                    setTotalDurationMs(logsResponse.data.totalDurationMs || 0);
                }

            } catch (err) {
                console.error("Error fetching time logs:", err);
                setError("Failed to load time logs. " + (err.response?.data?.message || err.message));
                toast.error("Failed to load time logs.");
            } finally {
                setLoading(false);
            }
        };

        if (taskId) {
            fetchTimeLogs();
        }
    }, [taskId]);

    return (
        <> {/* Or "Manage Tasks" if admin also navigates here */}
            <div className="mt-5 mb-10 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                    Time Logs for: <span className="text-blue-700">{taskTitle}</span>
                </h2>

                {loading && <p className="text-center text-gray-600">Loading time logs...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}

                {!loading && !error && (
                    <>
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-bold text-blue-800 mb-2">Total Time Logged:</h3>
                            <p className="text-3xl font-extrabold text-blue-900">
                                {formatDuration(totalDurationMs)}
                            </p>
                        </div>

                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Session History:</h3>
                        {timeLogs.length === 0 ? (
                            <p className="text-center text-gray-600">No time log sessions found for this task.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 shadow-sm border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Start Time
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                End Time
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Duration
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {timeLogs.map((log) => (
                                            <tr key={log._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        {log.user?.profileImageUrl && (
                                                            <img src={log.user.profileImageUrl} alt={log.user.name} className="w-6 h-6 rounded-full" />
                                                        )}
                                                        <span>{log.user?.name || 'Unknown User'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDateTime(log.startTime)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {log.endTime ? formatDateTime(log.endTime) : <span className="text-yellow-600 font-semibold">Active...</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDuration(log.duration)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default TaskTimeLogsPage;