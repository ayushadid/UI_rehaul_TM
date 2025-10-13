import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../context/userContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { LuPlus, LuChevronDown, LuLogOut, LuSettings } from 'react-icons/lu';


const Sidebar = ({ menuData, activeMenu }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const { projectId: activeProjectId } = useParams();

  const [projects, setProjects] = useState([]);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Role-aware logic: Admins get all projects, members get only their own.
        const endpoint = user.role === 'admin' 
            ? API_PATHS.PROJECTS.GET_ALL_PROJECTS 
            : API_PATHS.PROJECTS.GET_MY_PROJECTS;

        const response = await axiosInstance.get(endpoint);
        setProjects(response.data || []);
      } catch (error) {
        console.error("Failed to fetch projects for sidebar", error);
      }
    };
    
    // Only fetch projects if a user is logged in.
    if (user) {
        fetchProjects();
    }
  }, [user]); // This effect now correctly depends on the user object.

  const handleCreateProject = async () => {
    const newProjectName = window.prompt("Enter the new project name:");
    if (!newProjectName || !newProjectName.trim()) return;

    try {
      const response = await axiosInstance.post(API_PATHS.PROJECTS.CREATE_PROJECT, { name: newProjectName.trim() });
      toast.success(`Project "${response.data.name}" created!`);
      setProjects(prevProjects => [...prevProjects, response.data]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create project.");
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };
  
  const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate('/login');
  };

  // In Sidebar.jsx

  const handleProjectClick = (projectId) => {
    // ALWAYS navigate to the project dashboard, regardless of role.
    navigate(`/projects/${projectId}/dashboard`);
  };
  
  const mainMenuItems = menuData.filter(item => item.path !== 'logout');

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-primary">Task Manager</h2>
      </div>

      <div className="p-4">
        <Link to="/profile" className="block p-2 rounded-lg hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-3">
          <img src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.name || 'A'}`} alt="profile" className="w-10 h-10 rounded-full object-cover"/>
          <div>
            <h5 className="font-semibold text-sm">{user?.name}</h5>
            <p className="text-xs text-slate-500">{user?.role === 'admin' ? 'Administrator' : 'Member'}</p>
          </div>
        </div>
    </Link>
          
        {user?.role === 'admin' && (
          <button onClick={() => navigate('/admin/create-task')} className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors mb-4">
            <LuPlus /> Create Task
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar">
        {mainMenuItems.map((item) => (
          <button key={item.id} onClick={() => handleNavigate(item.path)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeMenu === item.label ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'}`}>
            <item.icon className="text-lg" />
            <span>{item.label}</span>
          </button>
        ))}

        <div className="mt-4">
            <button onClick={() => setIsProjectsExpanded(!isProjectsExpanded)} className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-md">
                <span>Projects</span>
                <div className="flex items-center gap-2">
                    {user?.role === 'admin' && <LuPlus onClick={(e) => { e.stopPropagation(); handleCreateProject(); }} className="hover:text-primary"/>}
                    <LuChevronDown className={`transition-transform ${isProjectsExpanded ? 'rotate-180' : ''}`}/>
                </div>
            </button>
            {isProjectsExpanded && (
                <div className="mt-2 pl-4 border-l-2 border-slate-200">
                    {projects.map(project => {
                        const isProjectActive = project._id === activeProjectId;
                        return (
                            <div key={project._id} className={`flex items-center group rounded-md ${isProjectActive ? 'bg-slate-100' : ''}`}>
                                <button onClick={() => handleProjectClick(project._id)} className={`flex-1 text-left px-3 py-1.5 text-sm  hover:text-primary rounded-md ${isProjectActive ? 'font-semibold text-primary' : 'text-slate-600'}`}>
                                    {project.name}
                                </button>
                                {user?.role === 'admin' && 
                                    <button onClick={() => navigate(`/projects/${project._id}/details`)} className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary">
                                        <LuSettings size={14} />
                                    </button>
                                }
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100">
          <LuLogOut className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;