import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useNavigate,useLocation } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import TaskStatusTab from '../../components/TaskStatusTab';
import TaskCard from '../../components/cards/TaskCard';

const MyTasks = () => {
  const location = useLocation(); // 👈 Add this line
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState(location.state?.statusFilter || "All");
  
  
  // 1. Add new state for projects and the selected project filter
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("all");

  const navigate = useNavigate();

  // 2. Update getAllTasks to send filters to the API
  const getAllTasks = async () => {
    try {
      const params = {
        status: filterStatus === "All" ? "" : filterStatus,
        projectId: selectedProject === "all" ? "" : selectedProject,
      };

      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, { params });
      
      setAllTasks(response.data?.tasks || []);

      const statusSummary = response.data?.statusSummary || {};
      const statusArray = [
        { label: "All", count: statusSummary.all || 0 },
        { label: "Pending", count: statusSummary.pendingTasks || 0 },
        { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
        { label: "Completed", count: statusSummary.completedTasks || 0 },
      ];
      setTabs(statusArray);
    } catch (error) {
      console.error("Error fetching tasks", error);
    }
  };

  // 3. Fetch the user's projects once when the component mounts
  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        // This endpoint gets only the projects the logged-in user is a member of
        const response = await axiosInstance.get(API_PATHS.PROJECTS.GET_MY_PROJECTS);
        setProjects(response.data || []);
      } catch (error) {
        console.error("Error fetching projects", error);
      }
    };
    fetchMyProjects();
  }, []);

  // 4. Update the useEffect to refetch tasks whenever a filter changes
  useEffect(() => {
    getAllTasks();
  }, [filterStatus, selectedProject]);

  const handleClick = (taskId) => {
    navigate(`/user/task-details/${taskId}`);
  };

  return (
    <DashboardLayout activeMenu="My Tasks">
      <div className='my-5'>
        <div className='flex flex-col md:flex-row md:items-center justify-between'>
          <div className="flex items-center gap-4">
            <h2 className='text-xl md:text-xl font-medium'>My Tasks</h2>
            
            {/* 5. Add the project filter dropdown to the UI */}
            <select
              className="bg-white border border-slate-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200 px-3 py-1"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          {tabs?.[0]?.count > 0 && (
            <div className="mt-4 md:mt-0">
              <TaskStatusTab 
                tabs={tabs}
                activeTab={filterStatus}
                setActiveTab={setFilterStatus}
              />
            </div>
          )}
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
          {allTasks?.map((item) => (
            <TaskCard
              key={item._id}
              task={item}
              onClick={() => {
                handleClick(item._id);
              }}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyTasks;