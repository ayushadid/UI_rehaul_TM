import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { LuX, LuPlus, LuTrash2, LuExternalLink,LuFolderKanban  } from 'react-icons/lu';
import { UserContext } from '../../context/userContext';

// =================================================================================
// == Main UserTasksDetails Component
// =================================================================================

const UserTasksDetails = () => {
    const { userId } = useParams();
    const [userTasks, setUserTasks] = useState([]);
    const [userProjects, setUserProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("Selected User");
    const [userAvatar, setUserAvatar] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [tasksRes, projectsRes] = await Promise.all([
                axiosInstance.get(API_PATHS.TASKS.GET_TASKS_FOR_USER(userId)),
                axiosInstance.get(API_PATHS.USERS.GET_USER_PROJECTS(userId))
            ]);

            const tasks = tasksRes.data?.tasks || [];
            setUserTasks(tasks);
            setUserProjects(projectsRes.data || []);

            if (tasks.length > 0) {
                const user = tasks[0].assignedTo.find(u => u._id === userId);
                if (user) {
                    setUserName(user.name);
                    setUserAvatar(user.profileImageUrl);
                }
            } else {
                // Future enhancement: Fetch user details separately if they have no tasks
            }
        } catch (err) {
            toast.error("Failed to load user details.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTaskUpdate = async () => {
        // After an update, re-fetch all data to ensure consistency
        await fetchData();
        if (selectedTask) {
            const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASKS_FOR_USER(userId));
            const freshTaskData = (response.data?.tasks || []).find(t => t._id === selectedTask._id);
            setSelectedTask(freshTaskData || null);
        }
    };
    
    return (
        <div className={`flex transition-all duration-300 ${selectedTask ? 'pr-[28rem]' : ''}`}>
            <div className="flex-1 min-w-0">
                <div className="p-6">
                    {/* User Info Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <img src={userAvatar || `https://ui-avatars.com/api/?name=${userName.replace(/\s/g, '+')}`} alt={userName} className="w-16 h-16 rounded-full object-cover"/>
                        <div>
                            <p className="text-xs text-slate-500">Details for</p>
                            <h2 className="text-2xl font-bold text-gray-800">{userName}</h2>
                        </div>
                    </div>
                    
                    {/* NEW: Project Info Card */}
                    {!loading && <ProjectsInfo projects={userProjects} />}

                    {loading ? (
                        <p className="text-center py-10 text-slate-500">Loading tasks...</p>
                    ) : userTasks.length > 0 ? (
                        <TaskTable tasks={userTasks} onTaskSelect={setSelectedTask} />
                    ) : (
                         <p className="text-center py-10 text-slate-500">No tasks found for this user.</p>
                    )}
                </div>
            </div>
            
            <TaskDetailsPanel 
                key={selectedTask?._id}
                task={selectedTask} 
                onClose={() => setSelectedTask(null)}
                onTaskUpdate={handleTaskUpdate}
            />
        </div>
    );
};

const ProjectsInfo = ({ projects }) => {
    if (!projects || projects.length === 0) {
        return null; // Don't render the card if the user has no projects
    }
    return (
        <div className="card mb-6">
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Associated Projects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {projects.map(project => (
                    <div key={project._id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2">
                            <LuFolderKanban className="text-primary"/>
                            <span className="font-semibold text-slate-800">{project.name}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'} assigned in this project
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
// =================================================================================
// == Sub-Component: TaskTable
// =================================================================================
const TaskTable = ({ tasks, onTaskSelect }) => {
    const getStatusClass = (status) => {
        switch (status) {
            case "Pending": return "bg-yellow-100 text-yellow-800";
            case "In Progress": return "bg-blue-100 text-blue-800";
            case "Completed": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Task Title</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Due Date</th>
                        <th scope="col" className="px-6 py-3">Progress</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {tasks.map((task) => (
                        <tr key={task._id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => onTaskSelect(task)}>
                            <td className="px-6 py-4">
                                <div className="font-medium text-slate-800">{task.title}</div>
                                <div className="text-xs text-slate-500">{task.project?.name}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(task.status)}`}>{task.status}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">{formatDate(task.dueDate)}</td>
                            <td className="px-6 py-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-primary h-2 rounded-full" style={{ width: `${task.progress || 0}%` }}></div>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// =================================================================================
// == Sub-Component: TaskDetailsPanel
// =================================================================================
const TaskDetailsPanel = ({ task, onClose, onTaskUpdate }) => {
    const { user: currentUser } = useContext(UserContext);
    const [description, setDescription] = useState('');
    const [checklist, setChecklist] = useState([]);
    const [newRemark, setNewRemark] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (task) {
            setDescription(task.description || '');
            setChecklist(JSON.parse(JSON.stringify(task.todoChecklist || [])));
        }
    }, [task]);

    if (!task) {
        return <div className="fixed top-0 right-0 w-[28rem] bg-white border-l h-screen transform translate-x-full transition-transform duration-300 ease-in-out"></div>;
    }

    const handleChecklistItemToggle = async (index) => {
        const newChecklist = [...checklist];
        newChecklist[index].completed = !newChecklist[index].completed;
        setChecklist(newChecklist);

        try {
            await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK_CHECKLIST(task._id), {
                todoChecklist: newChecklist.map(({_id, ...item}) => item)
            });
            onTaskUpdate();
        } catch (error) {
            toast.error(error.response?.data?.message || "Couldn't save progress.");
            setChecklist(JSON.parse(JSON.stringify(task.todoChecklist || [])));
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const payload = {
                description,
                todoChecklist: checklist.map(({_id, ...item}) => item)
            };
            await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(task._id), payload);
            toast.success("Task updated successfully!");
            onTaskUpdate();
        } catch (error) {
            toast.error("Failed to update task.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddRemark = async () => {
        if (!newRemark.trim()) return;
        try {
            await axiosInstance.post(API_PATHS.TASKS.ADD_REMARK(task._id), { text: newRemark });
            setNewRemark('');
            onTaskUpdate();
        } catch (error) {
            toast.error("Failed to add remark.");
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="fixed top-0 right-0 w-[28rem] bg-white border-l border-slate-200 h-screen flex flex-col transform translate-x-0 transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b">
                <Link to={`/admin/create-task`} state={{ taskId: task._id }} className="text-sm text-primary hover:underline flex items-center gap-1">
                    Go to Full Edit Page <LuExternalLink size={14}/>
                </Link>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><LuX/></button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-6 custom-scrollbar">
                <h3 className="font-semibold text-lg">{task.title}</h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoItem label="Priority" value={task.priority} />
                    <InfoItem label="Start Date" value={formatDate(task.startDate)} />
                    <InfoItem label="Created By" value={task.createdBy?.name} />
                    <InfoItem label="Created Date" value={formatDate(task.createdAt)} />
                </div>

                <EditableSection title="Description">
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="form-input mt-1" rows={5}/>
                </EditableSection>

                <EditableSection title="Checklist">
                    <div className="space-y-2 mt-2">
                        {checklist.map((item, index) => (
                            <div key={item._id || index} className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={item.completed} 
                                    onChange={() => handleChecklistItemToggle(index)}
                                    className="w-4 h-4 text-primary rounded" 
                                />
                                <input 
                                    type="text" 
                                    value={item.text} 
                                    onChange={(e) => {
                                        const newChecklist = [...checklist];
                                        newChecklist[index].text = e.target.value;
                                        setChecklist(newChecklist);
                                    }} 
                                    className="form-input flex-1 text-sm p-1" 
                                />
                                <button onClick={() => setChecklist(checklist.filter((_, i) => i !== index))} className="text-slate-400 hover:text-red-500"><LuTrash2 size={16}/></button>
                            </div>
                        ))}
                        <button onClick={() => setChecklist([...checklist, { text: '', completed: false, _id: `new_${Date.now()}` }])} className="text-sm text-primary flex items-center gap-1 hover:underline mt-2">
                            <LuPlus size={16}/> Add item
                        </button>
                    </div>
                </EditableSection>
                
                <EditableSection title="Remarks">
                    <div className="mt-4 flex items-start gap-2">
                        <img src={currentUser?.profileImageUrl || `https://ui-avatars.com/api/?name=${(currentUser?.name || 'A').replace(/\s/g, '+')}`} alt="you" className="w-8 h-8 rounded-full object-cover"/>
                        <div className="flex-1">
                            <textarea value={newRemark} onChange={(e) => setNewRemark(e.target.value)} placeholder="Add a remark..." rows={2} className="form-input text-sm"/>
                            <button onClick={handleAddRemark} className="add-btn text-xs px-3 py-1 mt-1">Add Remark</button>
                        </div>
                    </div>
                    <div className="mt-4 space-y-4">
                        {[...task.remarks].reverse().map(remark => <RemarkItem key={remark._id} remark={remark} />)}
                    </div>
                </EditableSection>
            </div>

            <div className="p-4 border-t bg-slate-50">
                <button onClick={handleSaveChanges} disabled={isSaving} className="add-btn w-full disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

// =================================================================================
// == Helper Sub-Components
// =================================================================================
const InfoItem = ({ label, value }) => (
    <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="font-semibold text-slate-800">{value || 'N/A'}</div>
    </div>
);

const EditableSection = ({ title, children }) => (
    <div className="border-t pt-4">
        <label className="text-sm font-medium text-slate-600">{title}</label>
        {children}
    </div>
);

const RemarkItem = ({ remark }) => (
    <div className="flex items-start gap-2">
        <img 
            src={remark.madeBy?.profileImageUrl || `https://ui-avatars.com/api/?name=${(remark.madeBy?.name || 'A').replace(/\s/g, '+')}`} 
            alt={remark.madeBy?.name || 'User'} 
            className="w-8 h-8 rounded-full object-cover"
        />
        <div>
            <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{remark.madeBy?.name || 'Unknown'}</span>
                <span className="text-xs text-slate-400">
                    {new Date(remark.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            <p className="text-sm bg-slate-100 p-2 rounded-lg mt-1 whitespace-pre-wrap">{remark.text}</p>
        </div>
    </div>
);

export default UserTasksDetails;