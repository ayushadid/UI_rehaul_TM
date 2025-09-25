import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';
import moment from 'moment';
import toast from 'react-hot-toast';

// Components
import DashboardLayout from '../../components/layouts/DashboardLayout';
import TaskStatusTab from '../../components/TaskStatusTab';
import AiCommandInterface from '../../components/AiCommandInterface.jsx';

// Icons
import { LuRadioTower } from 'react-icons/lu';
import { FaTimes, FaUsers } from 'react-icons/fa';
import { IoChevronDownCircleOutline, IoChevronUpCircleOutline } from "react-icons/io5";
import { GoDotFill } from "react-icons/go";


// =================================================================================
// Reusable UI Sub-Components
// =================================================================================

const AvatarStack = ({ users = [] }) => {
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
                        <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleCheckChange(index)}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none cursor-pointer"
                        />
                        <p className={`text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- 1. NEW: A DEDICATED PILL FOR TASK STATUS ---
const TaskStatusPill = ({ task }) => {
    const statuses = {
        Overdue: { text: 'Overdue', color: 'bg-red-100 text-red-700' },
        Pending: { text: 'Pending', color: 'bg-violet-100 text-violet-700' },
        'In Progress': { text: 'In Progress', color: 'bg-cyan-100 text-cyan-700' },
        Completed: { text: 'Completed', color: 'bg-lime-100 text-lime-700' },
    };

    const display = task.isOverdue ? statuses.Overdue : statuses[task.status] || statuses.Pending;

    return <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5 ${display.color}`}><GoDotFill/> {display.text}</span>;
};

// --- 2. NEW: A DEDICATED PILL FOR REVIEW STATUS ---
const ReviewStatusPill = ({ task }) => {
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

const TaskRow = ({ task, onRowClick, onTaskUpdate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const handleToggleExpand = (e) => { e.stopPropagation(); setIsExpanded(!isExpanded); };

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
                
                {/* --- ADD THIS CELL TO SHOW REVIEWERS --- */}
                <td className="px-4 py-2 hidden lg:table-cell"><AvatarStack users={task.reviewers} /></td>

                <td className="px-4 py-2 hidden md:table-cell">{task.dueDate ? moment(task.dueDate).format('MMM DD') : 'N/A'}</td>
                <td className="px-4 py-2"><TaskStatusPill task={task} /></td>
                <td className="px-4 py-2 hidden lg:table-cell"><ReviewStatusPill task={task} /></td>
            </tr>
            {isExpanded && (
                <tr className="bg-slate-50">
                    <td colSpan="8" className="p-4 border-b border-slate-200">
                        <ChecklistSection task={task} onUpdate={onTaskUpdate} />
                    </td>
                </tr>
            )}
        </>
    );
};

const TaskTable = ({ tasks, onTaskUpdate }) => {
    const navigate = useNavigate();
    const handleRowClick = (taskId) => {
        navigate('/admin/create-task', { state: { taskId: taskId } });
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
                        {/* --- ADD THIS HEADER --- */}
                        <th scope="col" className="px-4 py-3 hidden lg:table-cell">Reviewers</th>
                        <th scope="col" className="px-4 py-3 hidden md:table-cell">Due Date</th>
                        <th scope="col" className="px-4 py-3">Task Status</th>
                        <th scope="col" className="px-4 py-3 hidden lg:table-cell">Review Status</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <TaskRow
                            key={task._id}
                            task={task}
                            onRowClick={() => handleRowClick(task._id)}
                            onTaskUpdate={onTaskUpdate}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// =================================================================================
// Main ManageTasks Component
// =================================================================================

const ManageTasks = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const navigate = useNavigate();

    const [displayedTasks, setDisplayedTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [tabs, setTabs] = useState([]);
    const [users, setUsers] = useState([]);
    const [filterStatus, setFilterStatus] = useState(queryParams.get('status') || "All");
    const [selectedProject, setSelectedProject] = useState(queryParams.get('projectId') || 'all');
    const [selectedUserId, setSelectedUserId] = useState(queryParams.get('assignedUserId') || 'all');
    const [sortBy, setSortBy] = useState(queryParams.get('sortBy') || 'createdAt');
    const [dueDateFilter, setDueDateFilter] = useState(queryParams.get('dueDate') || '');
    const [createdDateFilter, setCreatedDateFilter] = useState(queryParams.get('createdDate') || '');
    const [showLiveOnly, setShowLiveOnly] = useState(false);
    const [liveTasks, setLiveTasks] = useState([]);
    const { user: currentUser } = useContext(UserContext);

    const updateStatusCounts = useCallback(async () => {
        try {
            const response = await axiosInstance.get(`${API_PATHS.TASKS.GET_ALL_TASKS}${location.search}`);
            const statusSummary = response.data?.statusSummary || {};
            const statusArray = [
                { label: "All", count: statusSummary.all || 0 },
                { label: "Overdue", count: statusSummary.overdueTasks || 0 },
                { label: "Pending", count: statusSummary.pendingTasks || 0 },
                { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
                { label: "Pending Review", count: statusSummary.pendingReviewTasks || 0 },
                { label: "Pending Final Approval", count: statusSummary.pendingFinalApprovalTasks || 0 },
                { label: "Completed", count: statusSummary.completedTasks || 0 },
            ];
            setTabs(statusArray);
        } catch (error) {
            console.error("Error silently updating counts:", error);
        }
    }, [location.search]);

    const handleTaskUpdate = (updatedTask) => {
        setDisplayedTasks(prevTasks =>
            prevTasks.map(task =>
                task._id === updatedTask._id ? updatedTask : task
            )
        );
        updateStatusCounts();
    };
    
    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(`${API_PATHS.TASKS.GET_ALL_TASKS}${location.search}`);
            // In the fetchTasks function
// In the fetchTasks function
const cleanTasks = (response.data?.tasks || []).filter(task => 
    task && task._id && task.createdBy && task.status
);
setDisplayedTasks(cleanTasks);            updateStatusCounts(); // Use this to keep counts in sync
        } catch (error) {
            console.error("Error fetching tasks:", error);
            setDisplayedTasks([]);
        } finally {
            setIsLoading(false);
        }
    }, [location.search, updateStatusCounts]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (filterStatus && filterStatus !== 'All') params.set('status', filterStatus);
        if (selectedProject && selectedProject !== 'all') params.set('projectId', selectedProject);
        if (selectedUserId && selectedUserId !== 'all') params.set('assignedUserId', selectedUserId);
        if (sortBy && sortBy !== 'createdAt') params.set('sortBy', sortBy);
        if (dueDateFilter) params.set('dueDate', dueDateFilter);
        if (createdDateFilter) params.set('createdDate', createdDateFilter);
        navigate({ search: params.toString() }, { replace: true });
    }, [filterStatus, selectedProject, selectedUserId, sortBy, dueDateFilter, createdDateFilter, navigate]);

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            const getUsers = async () => {
                try {
                    const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
                    setUsers(response.data?.users || response.data || []);
                } catch (error) { console.error("Error fetching users:", error); }
            };
            getUsers();
        }
    }, [currentUser?.role]);

    useEffect(() => {
        const getProjects = async () => {
            try {
                const projectResponse = await axiosInstance.get(API_PATHS.PROJECTS.GET_ALL_PROJECTS);
                setProjects(Array.isArray(projectResponse.data) ? projectResponse.data : []);
            } catch (error) { console.error("Error fetching projects:", error); }
        };
        getProjects();
    }, []);

    useEffect(() => {
        if (!showLiveOnly) {
            fetchTasks();
        }
    }, [fetchTasks, showLiveOnly]);

    useEffect(() => {
        if (showLiveOnly) {
            const fetchLiveTasks = async () => {
                setIsLoading(true);
                try {
                    const response = await axiosInstance.get(API_PATHS.TIMELOGS.GET_ACTIVE_TIMELOGS);
                    const activeTasks = response.data.map(log => log.task).filter(Boolean);
                    setLiveTasks(activeTasks);
                } catch (error) { console.error("Error fetching live tasks:", error); }
                finally { setIsLoading(false); }
            };
            fetchLiveTasks();
        }
    }, [showLiveOnly]);

    const handleClearFilters = () => {
        setSelectedProject('all');
        setDueDateFilter('');
        setCreatedDateFilter('');
        setFilterStatus('All');
        setSelectedUserId('all');
    };

    const tasksToRender = showLiveOnly ? liveTasks : displayedTasks;

    return (
        <DashboardLayout activeMenu="Manage Tasks">
            <div className='my-5'>
                <div className='flex flex-col md:flex-row md:items-center justify-between'>
                    <h2 className='text-xl md:text-xl font-medium'>Manage Tasks</h2>
                    <div className="flex items-center gap-4">
                         <label htmlFor="live-toggle" className="flex items-center cursor-pointer">
                             <LuRadioTower className={`mr-2 ${showLiveOnly ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                             <span className={`text-sm font-medium ${showLiveOnly ? 'text-red-500' : 'text-slate-600'}`}>Live Tasks</span>
                             <div className="relative ml-3">
                                 <input type="checkbox" id="live-toggle" className="sr-only" checked={showLiveOnly} onChange={() => setShowLiveOnly(!showLiveOnly)} />
                                 <div className={`block ${showLiveOnly ? 'bg-red-500' : 'bg-gray-200'} w-12 h-6 rounded-full transition`}></div>
                                 <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showLiveOnly ? 'transform translate-x-6' : ''}`}></div>
                             </div>
                         </label>
                    </div>
                </div>

                <fieldset disabled={showLiveOnly || isLoading} className={`my-4 p-4 bg-white rounded-lg shadow-sm disabled:opacity-40 transition`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Project</label>
                            <select className="form-input text-sm w-full" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                                <option value="all">All Projects</option>
                                {projects.map((project) => (<option key={project._id} value={project._id}>{project.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Sort By</label>
                            <select className="form-input text-sm w-full" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="createdAt">Most Recent</option>
                                <option value="hours">Most Hours Logged</option>
                            </select>
                        </div>
                        {currentUser?.role === 'admin' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Assigned To</label>
                                <div className="relative">
                                    <select className="form-input text-sm w-full pl-9" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                                        <option value="all">All Users</option>
                                        {users.map((user) => (<option key={user._id} value={user._id}>{user.name}</option>))}
                                    </select>
                                </div>
                            </div>
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

                {!showLiveOnly && (
                   <div className="flex items-center gap-3 mt-4 md:mt-0">
                     <TaskStatusTab tabs={tabs} activeTab={filterStatus} setActiveTab={setFilterStatus} />
                   </div>
                )}

                <div className='mt-4'>
                    {isLoading ? (
                        <div className="text-center py-20 text-gray-500">Loading tasks...</div>
                    ) : tasksToRender.length > 0 ? (
                        <TaskTable tasks={tasksToRender} onTaskUpdate={handleTaskUpdate} />
                    ) : (
                        <div className="text-center py-20 text-gray-500 bg-white rounded-lg shadow-sm border border-slate-200">
                            {showLiveOnly ? "No tasks are currently active." : "No tasks match the current filters."}
                        </div>
                    )}
                </div>
            </div>

            {currentUser?.role === 'admin' && (
                <AiCommandInterface onTaskCreated={fetchTasks} />
            )}
        </DashboardLayout>
    );
};

export default ManageTasks;