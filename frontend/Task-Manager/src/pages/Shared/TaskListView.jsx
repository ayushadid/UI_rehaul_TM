import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';
import toast from 'react-hot-toast';

// Components
import TaskStatusTab from '../../components/TaskStatusTab';
import AiCommandInterface from '../../components/AiCommandInterface.jsx';

// Icons
import { FaTimes } from 'react-icons/fa';
import { IoChevronDownCircleOutline, IoChevronUpCircleOutline } from "react-icons/io5";
import { GoDotFill } from "react-icons/go";
import { LuPlay, LuCircleStop,LuTimer   } from 'react-icons/lu'; // CORRECTED: LuPlayCircle changed to LuPlay


// =================================================================================
// Reusable UI Sub-Components
// =================================================================================

const AvatarStack = ({ users = [] }) => {
    // This component has no changes.
    if (!users || users.length === 0) {
        return <span className="text-slate-400 text-xs">N/A</span>;
    }
    return (
        <div className="flex items-center -space-x-2">
            {users.slice(0, 3).map(user => (
                <div key={user._id} className="relative group">
                    <img
                        className="w-7 h-7 rounded-full border-2 border-white object-cover"
                        src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.name?.replace(/\s/g, '+') || 'A'}`}
                        alt={user.name}
                    />
                    <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        {user.name}
                    </div>
                </div>
            ))}
            {users.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-semibold">
                    +{users.length - 3}
                </div>
            )}
        </div>
    );
};

const ChecklistSection = ({ task, onUpdate }) => {
    // This component has no changes.
    const [checklist, setChecklist] = useState(task.todoChecklist || []);
    const handleCheckChange = async (index) => {
        const newChecklist = [...checklist];
        newChecklist[index].completed = !newChecklist[index].completed;
        setChecklist(newChecklist);
        try {
            const response = await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK_CHECKLIST(task._id), { todoChecklist: newChecklist });
            toast.success("Checklist updated!");
            if (response.data?.task) {
                onUpdate(response.data.task);
            }
        } catch (error) {
            toast.error("Failed to update checklist.");
            setChecklist(task.todoChecklist);
        }
    };
    return (
        <div>
            <h4 className="text-sm font-semibold mb-2 text-slate-700">Checklist</h4>
            <div className="space-y-2">
                {checklist.map((item, index) => (
                    <div key={item._id || index} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100">
                        <input type="checkbox" checked={item.completed} onChange={() => handleCheckChange(index)} className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none cursor-pointer" />
                        <p className={`text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TaskStatusPill = ({ task }) => {
    // This component has no changes.
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
    const statuses = {
        Overdue: { text: 'Overdue', color: 'bg-red-100 text-red-700' },
        Pending: { text: 'Pending', color: 'bg-violet-100 text-violet-700' },
        'In Progress': { text: 'In Progress', color: 'bg-cyan-100 text-cyan-700' },
        Completed: { text: 'Completed', color: 'bg-lime-100 text-lime-700' },
    };
    const display = isOverdue ? statuses.Overdue : statuses[task.status] || statuses.Pending;
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5 ${display.color}`}><GoDotFill/> {display.text}</span>;
};

const ReviewStatusPill = ({ task }) => {
    // This component has no changes.
    if (!task.reviewers || task.reviewers.length === 0) {
        return <span className="text-slate-400 text-xs">N/A</span>;
    }
    const statuses = {
        NotSubmitted: { text: 'Not Submitted', color: 'bg-slate-100 text-slate-500' },
        PendingReview: { text: 'Pending Review', color: 'bg-orange-100 text-orange-700' },
        PendingFinalApproval: { text: 'Pending Approval', color: 'bg-orange-100 text-orange-700' },
        ChangesRequested: { text: 'Changes Requested', color: 'bg-amber-100 text-amber-700' },
        Approved: { text: 'Approved', color: 'bg-lime-100 text-lime-700' },
    };
    const display = statuses[task.reviewStatus] || statuses.NotSubmitted;
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5 ${display.color}`}><GoDotFill/> {display.text}</span>;
};

const TaskRow = ({ task, onRowClick, onTaskUpdate, currentUser }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTimerActive, setIsTimerActive] = useState(task.isTimerActiveForCurrentUser);
    const [activeLogId, setActiveLogId] = useState(task.activeTimeLogId);

    const handleToggleExpand = (e) => { e.stopPropagation(); setIsExpanded(!isExpanded); };

    const canToggleTimer = currentUser?.role === 'admin' || task.assignedTo.some(u => u._id === currentUser?._id);

    const handleStartTimer = async (e) => {
        e.stopPropagation();
        setIsTimerActive(true);
        try {
            const response = await axiosInstance.post(API_PATHS.TASKS.START_TIMER(task._id));
            setActiveLogId(response.data.timeLogId);
            toast.success(`Timer started for "${task.title}"`);
            onTaskUpdate();
        } catch (error) {
            toast.error("Failed to start timer.");
            setIsTimerActive(false);
        }
    };

    const handleStopTimer = async (e) => {
        e.stopPropagation();
        setIsTimerActive(false);
        try {
            await axiosInstance.put(API_PATHS.TASKS.STOP_TIMER(task._id, activeLogId));
            toast.success(`Timer stopped for "${task.title}"`);
            setActiveLogId(null);
            onTaskUpdate();
        } catch (error) {
            toast.error("Failed to stop timer.");
            setIsTimerActive(true);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <>
            <tr onClick={onRowClick} className="bg-white border-b border-slate-200 hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2 text-center">
                    {task.todoChecklist?.length > 0 && (
                        <button onClick={handleToggleExpand} className="text-slate-400 hover:text-slate-700">
                            {isExpanded ? <IoChevronUpCircleOutline size={20} /> : <IoChevronDownCircleOutline size={20} />}
                        </button>
                    )}
                </td>
                
                <td className="px-4 py-2 font-medium text-slate-800">
                    <div>{task.title}</div>
                    <div className="text-xs text-slate-500 font-normal">{task.project?.name}</div>
                </td>
                <td className="px-4 py-2 hidden lg:table-cell"><AvatarStack users={task.assignedTo} /></td>
                <td className="px-4 py-2 hidden lg:table-cell"><AvatarStack users={task.createdBy ? [task.createdBy] : []} /></td>
                <td className="px-4 py-2 hidden lg:table-cell"><AvatarStack users={task.reviewers} /></td>
                <td className="px-4 py-2 hidden md:table-cell">{formatDate(task.dueDate)}</td>
                <td className="px-4 py-2"><TaskStatusPill task={task} /></td>
                <td className="px-4 py-2 hidden lg:table-cell"><ReviewStatusPill task={task} /></td>
                <td className="px-4 py-2">
                    <button
                        disabled={!canToggleTimer}
                        onClick={isTimerActive ? handleStopTimer : handleStartTimer}
                        className={`flex items-center gap-1.5 text-xs font-semibold rounded-full px-2 py-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            isTimerActive 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                    >
                        {isTimerActive ? <LuCircleStop /> : <LuPlay />}
                        {isTimerActive ? 'Stop' : 'Start'}
                    </button>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-slate-50">
                    <td colSpan="9" className="p-4 border-b border-slate-200">
                        <div className="flex gap-6">
                            <div className="w-1/2">
                                <ChecklistSection task={task} onUpdate={onTaskUpdate} />
                            </div>
                            <div className="w-1/2 border-l border-slate-200 pl-6">
                                {/* Pass the currentUser down */}
                                <TaskTimeLogsDisplay taskId={task._id} currentUser={currentUser} />
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const TaskTable = ({ tasks, onTaskUpdate, currentUser  }) => {
    const navigate = useNavigate();
    const handleRowClick = (taskId) => {
        if (currentUser.role === 'admin') {
            navigate('/admin/create-task', { state: { taskId: taskId } });
        } else {
            navigate(`/user/task-details/${taskId}`);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th scope="col" className="px-4 py-3 w-10"></th>
                        <th scope="col" className="px-4 py-3">Task Name</th>
                        <th scope="col" className="px-4 py-3 hidden lg:table-cell">Assigned To</th>
                        <th scope="col" className="px-4 py-3 hidden lg:table-cell">Assigned By</th>
                        <th scope="col" className="px-4 py-3 hidden lg:table-cell">Reviewers</th>
                        <th scope="col" className="px-4 py-3 hidden md:table-cell">Due Date</th>
                        <th scope="col" className="px-4 py-3">Task Status</th>
                        <th scope="col" className="px-4 py-3 hidden lg:table-cell">Review Status</th>
                        <th scope="col" className="px-4 py-3">Timer</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <TaskRow
                            key={task._id}
                            task={task}
                            currentUser={currentUser}
                            onRowClick={() => handleRowClick(task._id)}
                            onTaskUpdate={onTaskUpdate}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// NEW: Sub-component to display time logs for a task
const TaskTimeLogsDisplay = ({ taskId, currentUser }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLogs = async () => {
            if (!taskId) return;
            setLoading(true);
            try {
                const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_TIMELOGS(taskId));
                // We fetch all, but will only display a few
                setLogs(response.data.timeLogs || []);
            } catch (error) {
                console.error("Failed to fetch time logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [taskId]);

    const formatDuration = (ms) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    const handleViewAll = () => {
        const path = currentUser.role === 'admin' 
            ? `/admin/tasks/${taskId}/timelogs` 
            : `/user/tasks/${taskId}/timelogs`;
        navigate(path);
    };

    return (
        <div>
            <h4 className="text-sm font-semibold mb-2 text-slate-700">Time Logs</h4>
            {loading ? (
                <p className="text-xs text-slate-400">Loading logs...</p>
            ) : logs.length > 0 ? (
                <>
                    <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        {/* Only show the first 4 logs */}
                        {logs.slice(0, 4).map(log => (
                            <li key={log._id} className="flex justify-between items-center text-sm p-2 bg-slate-100 rounded-md">
                                <div className="flex items-center gap-2">
                                    <img
                                        src={log.user.profileImageUrl || `https://ui-avatars.com/api/?name=${log.user.name.replace(/\s/g, '+')}`}
                                        alt={log.user.name}
                                        className="w-6 h-6 rounded-full"
                                    />
                                    <span className="font-medium text-slate-600">{log.user.name}</span>
                                </div>
                                <div className="text-xs text-slate-500 font-semibold">
                                    {formatDuration(log.duration)}
                                </div>
                            </li>
                        ))}
                    </ul>
                    {/* Show "View All" button if there are more than 4 logs */}
                    {logs.length > 4 && (
                        <button onClick={handleViewAll} className="text-xs text-primary font-semibold hover:underline mt-2">
                            View all {logs.length} logs...
                        </button>
                    )}
                </>
            ) : (
                <div className="text-center text-xs text-slate-400 py-4">
                    <LuTimer className="mx-auto mb-1 text-2xl"/>
                    No time logged for this task yet.
                </div>
            )}
        </div>
    );
};

// =================================================================================
// Main TaskListView Component
// =================================================================================
const TaskListView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user: currentUser } = useContext(UserContext);
    const queryParams = new URLSearchParams(location.search);

    const [displayedTasks, setDisplayedTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [tabs, setTabs] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const [filterStatus, setFilterStatus] = useState(queryParams.get('status') || "All");
    const [selectedProject, setSelectedProject] = useState(queryParams.get('projectId') || 'all');
    const [sortBy, setSortBy] = useState(queryParams.get('sortBy') || 'createdAt');
    const [selectedUserId, setSelectedUserId] = useState(queryParams.get('assignedUserId') || 'all');
    const [dueDateFilter, setDueDateFilter] = useState(queryParams.get('dueDate') || '');
    const [createdDateFilter, setCreatedDateFilter] = useState(queryParams.get('createdDate') || '');

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    const updateURL = useCallback(() => {
        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
        if (filterStatus && filterStatus !== 'All') params.set('status', filterStatus);
        if (selectedProject && selectedProject !== 'all') params.set('projectId', selectedProject);
        if (dueDateFilter) params.set('dueDate', dueDateFilter);
        if (createdDateFilter) params.set('createdDate', createdDateFilter);
        if (currentUser?.role === 'admin') {
            if (sortBy && sortBy !== 'createdAt') params.set('sortBy', sortBy);
            if (selectedUserId && selectedUserId !== 'all') params.set('assignedUserId', selectedUserId);
        }
        navigate({ search: params.toString() }, { replace: true });
    }, [debouncedSearchTerm, filterStatus, selectedProject, sortBy, selectedUserId, dueDateFilter, createdDateFilter, navigate, currentUser?.role]);

    const fetchTasksAndCounts = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(`${API_PATHS.TASKS.GET_ALL_TASKS}${location.search}`);
            const cleanTasks = (response.data?.tasks || []).filter(task => task && task._id);
            setDisplayedTasks(cleanTasks);
            const statusSummary = response.data?.statusSummary || {};
            setTabs([
                { label: "All", count: statusSummary.all || 0 },
                { label: "Overdue", count: statusSummary.overdueTasks || 0 },
                { label: "Pending", count: statusSummary.pendingTasks || 0 },
                { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
                { label: "Completed", count: statusSummary.completedTasks || 0 },
            ]);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            toast.error("Could not load tasks.");
        } finally {
            setIsLoading(false);
        }
    }, [location.search]);
    
    useEffect(() => {
        updateURL();
    }, [updateURL]);

    useEffect(() => {
        // This effect re-fetches data whenever any filter changes.
        // It relies on the URL being the single source of truth.
        fetchTasksAndCounts();
    }, [location.search]); // Simplified dependency array to just location.search

    useEffect(() => {
        const projectEndpoint = currentUser?.role === 'admin' ? API_PATHS.PROJECTS.GET_ALL_PROJECTS : API_PATHS.PROJECTS.GET_MY_PROJECTS;
        axiosInstance.get(projectEndpoint).then(res => setProjects(res.data || []));
        if (currentUser?.role === 'admin') {
            axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS).then(res => setUsers(res.data?.users || res.data || []));
        }
    }, [currentUser]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedProject('all');
        setDueDateFilter('');
        setCreatedDateFilter('');
        setFilterStatus('All');
        setSortBy('createdAt');
        setSelectedUserId('all');
    };

    return (
        <>
            <fieldset disabled={isLoading} className={`my-5 p-4 bg-white rounded-lg shadow-sm disabled:opacity-50 transition`}>
                <div className="mb-4">
                     <input
                        type="text"
                        placeholder="Search by task title or description..."
                        className="form-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Project</label>
                        <select className="form-input text-sm w-full" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                            <option value="all">All Projects</option>
                            {projects.map((project) => (<option key={project._id} value={project._id}>{project.name}</option>))}
                        </select>
                    </div>
                    {currentUser?.role === 'admin' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Sort By</label>
                                <select className="form-input text-sm w-full" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="createdAt">Most Recent</option>
                                    <option value="hours">Most Hours Logged</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Assigned To</label>
                                <select className="form-input text-sm w-full" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                                    <option value="all">All Users</option>
                                    {users.map((user) => (<option key={user._id} value={user._id}>{user.name}</option>))}
                                </select>
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Due Date</label>
                        <div className="relative">
                            <input type="date" className="form-input text-sm w-full pr-10" value={dueDateFilter} onChange={(e) => setDueDateFilter(e.target.value)} />
                            {dueDateFilter && (<button onClick={() => setDueDateFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><FaTimes /></button>)}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Created Date</label>
                        <div className="relative">
                            <input type="date" className="form-input text-sm w-full pr-10" value={createdDateFilter} onChange={(e) => setCreatedDateFilter(e.target.value)} />
                            {createdDateFilter && (<button onClick={() => setCreatedDateFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><FaTimes /></button>)}
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-right">
                    <button onClick={handleClearFilters} className="text-sm text-blue-600 hover:underline font-medium">Clear All Filters</button>
                </div>
            </fieldset>

            <div className="flex items-center gap-3 mt-4">
                <TaskStatusTab tabs={tabs} activeTab={filterStatus} setActiveTab={setFilterStatus} />
            </div>

            <div className='mt-4'>
                {isLoading ? (
                    <div className="text-center py-20 text-gray-500">Loading tasks...</div>
                ) : displayedTasks.length > 0 ? (
                    // AFTER (The correct, fast version)
                    <TaskTable 
                        tasks={displayedTasks} 
                        currentUser={currentUser}
                        onTaskUpdate={(updatedTask) => {
                            setDisplayedTasks(prevTasks => 
                                prevTasks.map(task => 
                                    task._id === updatedTask._id ? updatedTask : task
                                )
                            );
                        }} 
                    />
                ) : (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-lg shadow-sm border border-slate-200">
                        No tasks match the current filters.
                    </div>
                )}
            </div>
        </>
    );
};

export default TaskListView;