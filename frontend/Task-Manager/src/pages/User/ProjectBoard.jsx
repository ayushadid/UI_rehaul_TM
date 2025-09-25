import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import BoardTaskCard from '../../components/cards/BoardTaskCard';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll'; // 👈 Import the hook

const ProjectBoard = () => {
  const [boardData, setBoardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useHorizontalScroll(); // 👈 Initialize the hook

  useEffect(() => {
    const fetchBoardData = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(API_PATHS.TASKS.GET_USER_BOARD);
        setBoardData(response.data);
      } catch (error) {
        console.error("Error fetching board data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoardData();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout activeMenu="Board">
        <div className="p-4 text-center text-gray-500">Loading your board...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Board">
      {/* 👇 This container now fills the available height */}
      <div className="p-4 md:p-6 h-full flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex-shrink-0">My Task Board</h2>
        
        {/* 👇 This is now the scroll container */}
        <div 
          ref={scrollRef} // 👈 Attach the ref from our hook here
          className="flex-grow flex gap-4 overflow-x-auto pb-4 cursor-grab active-scroll:cursor-grabbing"
        >
          {boardData.map(project => (
            <div key={project._id} className="bg-gray-100/70 rounded-lg w-80 flex-shrink-0 border flex flex-col">
              <h3 className="font-semibold p-3 border-b border-gray-200 text-gray-700 flex-shrink-0">{project.name}</h3>
              <div className="p-3 overflow-y-auto flex-grow">
                {project.tasks.length > 0 ? (
                  project.tasks.map((task) => (
                    <BoardTaskCard key={task._id} task={task} />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">
                    No tasks in this project.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectBoard;