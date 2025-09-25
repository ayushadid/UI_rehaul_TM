import React, { useState, useEffect, useRef, useContext } from 'react';
import Progress from '../Progress';
import { LuPaperclip, LuFolderKanban } from 'react-icons/lu';
import moment from 'moment';
import { FaPlayCircle, FaPauseCircle, FaRegClock } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/userContext';
import { useNavigate } from 'react-router-dom';

const TaskCard = ({
  task,
  onClick,
}) => {
  if (!task) {
    console.error("TaskCard received an undefined 'task' prop.");
    return null;
  }

  // 👇 1. De-structure the new 'isOverdue' property from the task object
  const {
    _id: taskId,
    title,
    description,
    priority,
    status,
    progress,
    createdAt,
    dueDate,
    assignedTo,
    attachments,
    completedTodoCount,
    project,
    todoChecklist,
    isOverdue, // Added this property
  } = task;

  const { user: currentUser } = useContext(UserContext);

  const [isTimerActive, setIsTimerActive] = useState(false);
  const [activeTimeLogId, setActiveTimeLogId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerIntervalRef = useRef(null);

  const formatDuration = (ms) => {
    if (ms === 0) return "00:00:00";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const startTimerInterval = (initialStartTime) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const startTimeMs = new Date(initialStartTime).getTime();
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeMs);
    }, 1000);
  };

  const stopTimerInterval = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setElapsedTime(0);
  };

  const handleStartTimer = async (e) => {
    e.stopPropagation();
    try {
      const response = await axiosInstance.post(API_PATHS.TASKS.START_TIMER(taskId));
      const newTimeLog = response.data.timeLog;
      setIsTimerActive(true);
      setActiveTimeLogId(newTimeLog._id);
      startTimerInterval(newTimeLog.startTime);
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error starting timer:", error);
      toast.error(error.response?.data?.message || "Failed to start timer.");
    }
  };

  const handleStopTimer = async (e) => {
    e.stopPropagation();
    if (!activeTimeLogId) return;
    try {
      const response = await axiosInstance.put(API_PATHS.TASKS.STOP_TIMER(taskId, activeTimeLogId));
      setIsTimerActive(false);
      setActiveTimeLogId(null);
      stopTimerInterval();
      toast.success(response.data.message);
    } catch (error) {
      console.error("Error stopping timer:", error);
      toast.error(error.response?.data?.message || "Failed to stop timer.");
    }
  };

  useEffect(() => {
    const checkActiveTimer = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.TASKS.GET_ACTIVE_TIMER(taskId));
        if (response.data.activeTimeLog) {
          const activeLog = response.data.activeTimeLog;
          setIsTimerActive(true);
          setActiveTimeLogId(activeLog._id);
          startTimerInterval(activeLog.startTime);
        } else {
          setIsTimerActive(false);
          setActiveTimeLogId(null);
          stopTimerInterval();
        }
      } catch (error) {
        console.error("Error checking active timer:", error.response?.data?.message || error.message);
        setIsTimerActive(false);
        setActiveTimeLogId(null);
        stopTimerInterval();
      }
    };
    if (taskId) {
      checkActiveTimer();
    }
    return () => stopTimerInterval();
  }, [taskId, currentUser?._id]);

  const getStatusTagColor = () => {
    switch (status) {
      case 'In Progress':
        return 'text-cyan-500 bg-cyan-50 border border-cyan-500/10';
      case 'Completed':
        return 'text-lime-500 bg-lime-50 border border-lime-500/20';
      default:
        return 'text-violet-500 bg-violet-50 border border-violet-500/10';
    }
  };

  const getPriorityTagColor = () => {
    switch (priority) {
      case 'Low':
        return 'text-emerald-500 bg-emerald-50 border border-emerald-500/10';
      case 'Medium':
        return 'text-amber-500 bg-amber-50 border border-amber-500/10';
      default:
        return 'text-rose-500 bg-rose-50 border border-rose-500/10';
    }
  };

  const isCurrentUserAssigned = assignedTo?.some(userObj => userObj._id === currentUser?._id);
  const canOperateTimer = isCurrentUserAssigned || currentUser?.role === "admin";
  const navigate = useNavigate();
  const attachmentCount = attachments ? attachments.length : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
      <div className="cursor-pointer" onClick={onClick}>
        {/* Status, Priority, and Overdue Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* 👇 2. Conditionally render the "Overdue" tag */}
          {isOverdue && (
            <div className="text-[11px] font-medium text-rose-500 bg-rose-50 border border-rose-500/10 px-3 py-0.5 rounded">
                OVERDUE
            </div>
          )}
          <div className={`text-[11px] font-medium ${getStatusTagColor()} px-3 py-0.5 rounded`}>
            {status}
          </div>
          <div className={`text-[11px] font-medium ${getPriorityTagColor()} px-3 py-0.5 rounded`}>
            {priority} Priority
          </div>
          {project?.name && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200/80 px-3 py-0.5 rounded">
              <LuFolderKanban />
              {project.name}
            </div>
          )}
        </div>

        {/* Task Info */}
        <div
          className={`px-4 py-2 border-l-[3px] mb-4 ${
            status === 'In Progress'
              ? 'border-cyan-500'
              : status === 'Completed'
              ? 'border-indigo-500'
              : 'border-violet-500'
          }`}
        >
          <p className="text-base font-semibold text-gray-800 mb-1">{title}</p>
          <p className="text-sm text-gray-600 mb-2 truncate-description">{description}</p>
          <p className="text-sm text-gray-700 mb-2">
            Task Done:{' '}
            <span className="font-medium text-gray-900">
              {completedTodoCount}/{todoChecklist?.length || 0}
            </span>
          </p>
          <Progress progress={progress} status={status} />
        </div>

        {/* Footer Info (Dates) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full text-sm text-gray-600 mb-3">
          <div>
            <label className="block font-medium text-gray-500">Start Date</label>
            <p>{moment(createdAt).format('Do MMM YYYY')}</p>
          </div>
          <div className="text-right">
            <label className="block font-medium text-gray-500">Due Date</label>
            <p>{moment(dueDate).format('Do MMM YYYY')}</p>
          </div>
        </div>
      </div>

      {/* Assignees, Attachments, Timer, and Time Logs Link */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
        <div className="flex flex-wrap items-center gap-2">
          {assignedTo?.length > 0 &&
            assignedTo.map((userObj, idx) => (
              <span
                key={userObj._id || idx}
                className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full"
              >
                {userObj.name || 'Unnamed'}
              </span>
            ))}
          {attachmentCount > 0 && (
            <div className="flex items-center gap-1 text-gray-600 text-sm">
              <LuPaperclip className="text-lg" />
              <span>{attachmentCount}</span>
            </div>
          )}
        </div>

        {/* Timer Controls */}
        {status !== 'Completed' && canOperateTimer && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-lg font-semibold text-gray-700 w-24 text-right">
              {formatDuration(elapsedTime)}
            </span>
            {isTimerActive ? (
              <FaPauseCircle
                className="text-red-500 text-3xl cursor-pointer hover:text-red-600 transition"
                onClick={handleStopTimer}
              />
            ) : (
              <FaPlayCircle
                className="text-green-500 text-3xl cursor-pointer hover:text-green-600 transition"
                onClick={handleStartTimer}
              />
            )}
          </div>
        )}

        {/* Time Logs Link */}
        <div className="flex items-center gap-1 text-sm ml-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/user/tasks/${taskId}/timelogs`);
            }}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-medium px-3 py-1 rounded-md bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FaRegClock className="text-base" />
            Time Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;