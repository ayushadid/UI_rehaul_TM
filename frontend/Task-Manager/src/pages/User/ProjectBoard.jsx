import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import BoardTaskCard from '../../components/cards/BoardTaskCard';
import { UserContext } from '../../context/userContext';
import { LuPlus, LuClipboardList, LuChevronDown } from 'react-icons/lu'; // UPDATED: Added Chevron icon

const ProjectBoard = () => {
  const [boardData, setBoardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // NEW: State to manage which projects are expanded
  const [expandedProjects, setExpandedProjects] = useState({});

  useEffect(() => {
    const fetchBoardData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const endpoint = user.role === 'admin' 
          ? API_PATHS.TASKS.GET_ADMIN_BOARD 
          : API_PATHS.TASKS.GET_USER_BOARD;
        
        const response = await axiosInstance.get(endpoint);
        setBoardData(response.data);

        // NEW: Initialize all projects to be expanded by default
        const initialExpansionState = {};
        response.data.forEach(project => {
            initialExpansionState[project._id] = true;
        });
        setExpandedProjects(initialExpansionState);

      } catch (error) {
        console.error("Error fetching board data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoardData();
  }, [user]);

  const handleAddTask = (e, projectId) => {
    e.stopPropagation();
    navigate('/admin/create-task', { state: { projectId: projectId } });
  };

  // NEW: Function to toggle the expanded/collapsed state of a single project
  const toggleProjectExpansion = (projectId) => {
    setExpandedProjects(prev => ({
        ...prev,
        [projectId]: !prev[projectId]
    }));
  };

  if (isLoading) {
    return (
      <>
        <div className="p-4 text-center text-gray-500">Loading your board...</div>
      </>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 h-full flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex-shrink-0">
          {user?.role === 'admin' ? 'All Projects Board' : 'My Task Board'}
        </h2>
        
        {/* UPDATED: Changed from flex to a responsive grid to eliminate horizontal scrolling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {boardData.map(project => (
            <div key={project._id} className="bg-slate-100 rounded-xl flex flex-col border border-slate-200/80">
              {/* UPDATED: Header is now clickable to collapse/expand */}
              <div 
                className="flex justify-between items-center p-3 text-slate-700 flex-shrink-0 cursor-pointer"
                onClick={() => toggleProjectExpansion(project._id)}
              >
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{project.name}</h3>
                    <span className="text-sm font-medium text-slate-400">{project.tasks.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    {user?.role === 'admin' && (
                        <button onClick={(e) => handleAddTask(e, project._id)} className="text-slate-400 hover:text-primary transition-colors" title="Add a task to this project">
                            <LuPlus size={20} />
                        </button>
                    )}
                    <LuChevronDown className={`transition-transform duration-300 ${expandedProjects[project._id] ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              {/* UPDATED: Task list is now conditionally rendered based on expanded state */}
              {expandedProjects[project._id] && (
                <div className="px-2 pb-2 overflow-y-auto flex-grow custom-scrollbar">
                    <div className="p-1 min-h-[50px]">
                        {project.tasks.length > 0 ? (
                        project.tasks.map((task) => (
                            <BoardTaskCard key={task._id} task={task} />
                        ))
                        ) : (
                        <div className="flex flex-col items-center justify-center h-full text-sm text-slate-400 p-4">
                            <LuClipboardList className="text-4xl mb-2" />
                            <span>No tasks yet</span>
                        </div>
                        )}
                    </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProjectBoard;