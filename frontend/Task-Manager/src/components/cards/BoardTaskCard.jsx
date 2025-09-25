import React, { useState, useEffect } from 'react';
import { FaPlayCircle, FaPauseCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useNavigate } from 'react-router-dom';

const BoardTaskCard = ({ task }) => {
  const navigate = useNavigate();

  // --- Self-Contained Timer Logic ---
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [activeTimeLogId, setActiveTimeLogId] = useState(null);

  useEffect(() => {
    // When the card first loads, check if it has an active timer
    const checkActiveTimer = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.TASKS.GET_ACTIVE_TIMER(task._id));
        if (response.data.activeTimeLog) {
          setIsTimerActive(true);
          setActiveTimeLogId(response.data.activeTimeLog._id);
        } else {
          setIsTimerActive(false);
          setActiveTimeLogId(null);
        }
      } catch (error) {
        // Suppress errors, as this can fail benignly for new tasks
      }
    };
    checkActiveTimer();
  }, [task._id]);

  const handleStartTimer = async (e) => {
    e.stopPropagation();
    try {
      const response = await axiosInstance.post(API_PATHS.TASKS.START_TIMER(task._id));
      setIsTimerActive(true);
      setActiveTimeLogId(response.data.timeLog._id);
      toast.success("Timer started!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start timer.");
    }
  };

  const handleStopTimer = async (e) => {
    e.stopPropagation();
    if (!activeTimeLogId) return toast.error("Active timer not found.");
    try {
      await axiosInstance.put(API_PATHS.TASKS.STOP_TIMER(task._id, activeTimeLogId));
      setIsTimerActive(false);
      setActiveTimeLogId(null);
      toast.success("Timer stopped!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to stop timer.");
    }
  };

  const getStatusTagColor = () => {
    if (task.isOverdue) return 'bg-red-100 text-red-800';
    switch (task.status) {
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleCardClick = () => {
    // 👇 This is the corrected navigation line
    navigate(`/user/task-details/${task._id}`);
  };
  
  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-gray-200 hover:shadow-md cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-gray-800 pr-2">{task.title}</p>
        {task.status !== 'Completed' && (
            isTimerActive ? (
                <FaPauseCircle
                    className="text-red-500 text-2xl cursor-pointer flex-shrink-0"
                    onClick={handleStopTimer}
                />
            ) : (
                <FaPlayCircle
                    className="text-green-500 text-2xl cursor-pointer flex-shrink-0"
                    onClick={handleStartTimer}
                />
            )
        )}
      </div>
      <div className="mt-3">
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusTagColor()}`}>
          {task.isOverdue ? 'Overdue' : task.status}
        </span>
      </div>
    </div>
  );
};

export default BoardTaskCard;