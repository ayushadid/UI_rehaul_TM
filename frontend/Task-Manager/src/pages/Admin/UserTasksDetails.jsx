import React, { useEffect, useState, useContext } from 'react'; // Import useContext
import { useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import toast from 'react-hot-toast';
import { MdCheckCircle, MdOutlineRadioButtonUnchecked } from 'react-icons/md';
import { UserContext } from '../../context/userContext'; // Import UserContext

const UserTasksDetails = () => {
    
    const { userId } = useParams();
    const { user } = useContext(UserContext); // Get user from context
    const isAdmin = user && user.role === "admin"; // Determine if logged-in user is admin

    const [userTasks, setUserTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userName, setUserName] = useState("Selected User");
    const [openTaskId, setOpenTaskId] = useState(null);
    const [newRemarkText, setNewRemarkText] = useState(""); // State for new remark text

    // Function to fetch tasks (centralized for re-use)
    const fetchUserTasks = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASKS_FOR_USER(userId));
            if (response.data && response.data.tasks) {
                setUserTasks(response.data.tasks);
                console.log("Fetched user tasks:", response.data.tasks);

                if (response.data.tasks.length > 0 && response.data.tasks[0].assignedTo) {
                    const assignedUser = response.data.tasks[0].assignedTo.find(
                        (u) => u._id === userId
                    );
                    if (assignedUser) {
                        setUserName(assignedUser.name);
                    } else {
                        setUserName(response.data.tasks[0].assignedTo[0]?.name || "Selected User");
                    }
                }
            } else {
                setUserTasks([]);
            }
        } catch (err) {
            console.error("Error fetching user tasks:", err);
            setError("Failed to load user tasks.");
            toast.error("Failed to load user tasks.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUserTasks();
        }
        return () => {};
    }, [userId]); // Depend on userId to refetch when it changes

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }; // Added hour/minute
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Helper to get status color classes
    const getStatusClass = (status) => {
        switch (status) {
            case "Pending": return "bg-yellow-100 text-yellow-800";
            case "In Progress": return "bg-blue-100 text-blue-800";
            case "Completed": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    // Helper to get priority color classes
    const getPriorityClass = (priority) => {
        switch (priority) {
            case "High": return "text-red-600 font-semibold";
            case "Medium": return "text-orange-600";
            case "Low": return "text-green-600";
            default: return "text-gray-600";
        }
    };

    // Toggle checklist/remarks visibility
    const toggleDetails = (taskId) => { // Renamed for broader use
        setOpenTaskId(openTaskId === taskId ? null : taskId);
    };

    // Handle adding a new remark
    const handleAddRemark = async (taskId) => {
        if (!newRemarkText.trim()) {
            toast.error("Remark cannot be empty.");
            return;
        }

        try {
            await axiosInstance.post(API_PATHS.TASKS.ADD_REMARK(taskId), {
                text: newRemarkText,
            });
            toast.success("Remark added successfully!");
            setNewRemarkText(""); // Clear the input field
            fetchUserTasks(); // Re-fetch tasks to get the updated remarks
        } catch (error) {
            console.error("Error adding remark:", error);
            toast.error("Failed to add remark. " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <DashboardLayout activeMenu="Team Members">
            <div className="mt-5 mb-10 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Tasks for {userName}</h2>

                {loading && <p className="text-center text-gray-600">Loading tasks...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}

                {!loading && !error && userTasks.length === 0 && (
                    <p className="text-center text-gray-600">No tasks found for this user.</p>
                )}

                {!loading && !error && userTasks.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 shadow-sm border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Priority
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Due Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assigned Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assigned To
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Checklist Progress
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Overall Progress
                                    </th>
                                    {isAdmin && ( // Show Remarks column only if admin
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Remarks
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {userTasks.map((task) => (
                                    <React.Fragment key={task._id}>
                                        <tr
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => toggleDetails(task._id)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {task.title}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {task.description || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={getPriorityClass(task.priority)}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(task.status)}`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(task.dueDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(task.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {task.assignedTo && task.assignedTo.length > 0 ?
                                                    task.assignedTo.map(assignedUser => assignedUser.name).join(', ')
                                                    : 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {task.todoChecklist.length > 0
                                                    ? `${task.completedTodoCount}/${task.todoChecklist.length} completed`
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-blue-600 h-2.5 rounded-full"
                                                        style={{ width: `${task.progress || 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className="ml-2">{task.progress || 0}%</span>
                                            </td>
                                            {isAdmin && ( // Display latest remark if admin and remarks exist
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-[150px] truncate">
                                                    {task.remarks && task.remarks.length > 0
                                                        ? task.remarks[task.remarks.length - 1].text
                                                        : 'N/A'}
                                                </td>
                                            )}
                                        </tr>

                                        {/* Pop-down row for checklist AND remarks */}
                                        {openTaskId === task._id && (
                                            <tr>
                                                {/* colSpan needs to be adjusted based on number of columns.
                                                    Currently 9 columns + 1 for remarks = 10 columns if admin.
                                                    If not admin, it's 9 columns. We need conditional colSpan. */}
                                                <td colSpan={isAdmin ? 10 : 9} className="px-6 py-4 bg-gray-50 text-sm text-gray-700 border-t border-gray-200">
                                                    <div className="flex flex-col md:flex-row gap-6">
                                                        {/* Checklist Section */}
                                                        <div className="flex-1 min-w-[300px]">
                                                            <h4 className="font-semibold mb-2 text-gray-800">Checklist:</h4>
                                                            {task.todoChecklist.length > 0 ? (
                                                                <ul className="space-y-2">
                                                                    {task.todoChecklist.map((item) => (
                                                                        <li key={item._id} className="flex items-center gap-2">
                                                                            {item.completed ? (
                                                                                <MdCheckCircle className="text-green-500 text-lg" />
                                                                            ) : (
                                                                                <MdOutlineRadioButtonUnchecked className="text-gray-400 text-lg" />
                                                                            )}
                                                                            <span className={item.completed ? "line-through text-gray-500" : ""}>
                                                                                {item.text}
                                                                            </span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-gray-500 italic">No checklist items for this task.</p>
                                                            )}
                                                        </div>

                                                        {/* Remarks Section (Admin Only) */}
                                                        {isAdmin && (
                                                            <div className="flex-1 min-w-[300px] md:border-l md:pl-6 md:border-gray-200">
                                                                <h4 className="font-semibold mb-2 text-gray-800">Remarks:</h4>
                                                                {/* Add new remark form */}
                                                                <div className="mb-4">
                                                                    <textarea
                                                                        value={newRemarkText}
                                                                        onChange={(e) => setNewRemarkText(e.target.value)}
                                                                        placeholder="Add a new remark..."
                                                                        rows="3"
                                                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    ></textarea>
                                                                    <button
                                                                        onClick={() => handleAddRemark(task._id)}
                                                                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    >
                                                                        Add Remark
                                                                    </button>
                                                                </div>

                                                                {/* Display existing remarks */}
                                                                {task.remarks && task.remarks.length > 0 ? (
                                                                    <ul className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar"> {/* Added custom-scrollbar for styling */}
                                                                        {/* Reverse the array to show latest remark first */}
                                                                        {[...task.remarks].reverse().map((remark) => (
                                                                            <li key={remark._id} className="p-3 bg-white rounded-md shadow-sm border border-gray-200">
                                                                                <p className="text-gray-800 text-sm mb-1">{remark.text}</p>
                                                                                <div className="flex items-center text-xs text-gray-500">
                                                                                    {remark.madeBy?.profileImageUrl && (
                                                                                        <img src={remark.madeBy.profileImageUrl} alt={remark.madeBy?.name || 'User'} className="w-5 h-5 rounded-full mr-2" />
                                                                                    )}
                                                                                    <span>{remark.madeBy?.name || 'Unknown'} on {formatDate(remark.createdAt)}</span>
                                                                                </div>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="text-gray-500 italic">No remarks added yet.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default UserTasksDetails;