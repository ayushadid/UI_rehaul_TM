import React, { useState, useEffect, useContext } from 'react';
import Chart from 'react-apexcharts';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/userContext';
import { LuClock } from 'react-icons/lu';

// Helper function to format milliseconds into "Xh Ym"
const formatDuration = (ms) => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

// Helper function to format a Date object to 'YYYY-MM-DD' for the input
const formatDateForInput = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
};

const AdminDayView = () => {
  const [date, setDate] = useState(new Date());
  const [series, setSeries] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('all');
  const navigate = useNavigate();
  const [chartHeight, setChartHeight] = useState(250);
  const [summaryData, setSummaryData] = useState({ tasks: [], totalHours: 0 });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
        setUsers(response.data.users || response.data || []);
      } catch (error) {
        toast.error("Could not fetch users.");
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchTimeLogs = async () => {
      try {
        const formattedDate = formatDateForInput(date);
        let response;
        let chartData;

        if (selectedUserId === 'all') {
          response = await axiosInstance.get(API_PATHS.TIMELOGS.GET_ALL_BY_DAY, {
            params: { date: formattedDate },
          });
          const validLogs = response.data.filter(log => log.task && log.user);
          chartData = validLogs.map(log => ({
            x: log.user.name,
            y: [ new Date(log.startTime).getTime(), new Date(log.endTime).getTime() ],
            taskId: log.task._id,
            taskTitle: log.task.title,
          }));
        } else {
          response = await axiosInstance.get(API_PATHS.TIMELOGS.GET_BY_DAY(selectedUserId), {
            params: { date: formattedDate },
          });
          const validLogs = response.data.filter(log => log.task);
          chartData = validLogs.map(log => ({
            x: log.task.title,
            y: [ new Date(log.startTime).getTime(), new Date(log.endTime).getTime() ],
            taskId: log.task._id,
          }));
        }

        setSeries([{ data: chartData }]);
        
        // Calculate and set the summary data
        const validLogsForSummary = response.data.filter(log => log.task);
        const totalMilliseconds = validLogsForSummary.reduce((sum, log) => sum + log.duration, 0);
        const totalHours = totalMilliseconds / (1000 * 60 * 60);

        const tasksMap = new Map();
        validLogsForSummary.forEach(log => {
            const taskId = log.task._id;
            if (!tasksMap.has(taskId)) {
                tasksMap.set(taskId, { title: log.task.title, duration: 0 });
            }
            tasksMap.get(taskId).duration += log.duration;
        });

        setSummaryData({
            tasks: Array.from(tasksMap.values()),
            totalHours: totalHours
        });

        const uniqueYCategories = [...new Set(chartData.map(d => d.x))].length;
        const baseHeight = 100;
        const heightPerCategory = 65;
        const newHeight = baseHeight + (uniqueYCategories * heightPerCategory);
        setChartHeight(Math.max(newHeight, 250));

      } catch (error) {
        console.error("Error fetching time logs:", error);
        setSeries([{ data: [] }]);
        setSummaryData({ tasks: [], totalHours: 0 });
      }
    };

    fetchTimeLogs();
  }, [date, selectedUserId]);

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const options = {
    chart: {
      type: 'rangeBar',
      height: 450,
      toolbar: { show: false },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const { taskId } = config.w.config.series[config.seriesIndex].data[config.dataPointIndex];
          if (taskId) navigate(`/user/task-details/${taskId}`);
        },
      },
    },
    plotOptions: { bar: { horizontal: true, borderRadius: 10, barHeight: '35%' } },
    xaxis: { 
        type: 'datetime', 
        min: startOfDay.getTime(), 
        max: endOfDay.getTime(), 
        labels: { datetimeUTC: false, format: 'HH:mm' } 
    },
    yaxis: { show: true, labels: { style: { fontSize: '14px', fontWeight: 500 } } },
    grid: { show: true, borderColor: '#e0e0e0', strokeDashArray: 4, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    tooltip: {
      custom: function({ seriesIndex, dataPointIndex, w }) {
        // Get the specific data point that is being hovered
        const dataPoint = w.config.series[seriesIndex].data[dataPointIndex];
        if (!dataPoint) return '';

        const yData = dataPoint.y;
        const start = yData[0];
        const end = yData[1];
        const categoryName = dataPoint.x; // This is the user or task name for the Y-axis
        const taskTitle = dataPoint.taskTitle; // This is the specific task title
        const duration = formatDuration(end - start);
        
        // Build the tooltip HTML dynamically
        const taskHtml = taskTitle ? `<strong>Task:</strong> ${taskTitle}<br>` : '';

        return `<div class="p-2 shadow-lg rounded-md bg-white border">
                    <strong>${selectedUserId === 'all' ? 'User' : 'Task'}:</strong> ${categoryName}<br>
                    ${taskHtml}
                    <strong>Duration:</strong> ${duration}
                </div>`;
      }
    },
    fill: { type: 'solid', colors: ['#008FFB'] },
    legend: { show: false },
  };

  return (
    <>
      <div className="mt-5">
        <h2 className="text-2xl font-semibold text-gray-800">Team Day View</h2>
        <p className="mt-2 text-sm text-gray-600">A timeline of logged work for any user on the selected day.</p>
      </div>
      <div className="card mt-6">
        <div className="flex items-center gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select View</label>
            <select
              className="form-input w-auto"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
            <input
              type="date"
              className="form-input w-auto"
              value={formatDateForInput(date)}
              onChange={(e) => setDate(new Date(e.target.value))}
            />
          </div>
        </div>
        
        {series[0]?.data.length > 0 ? (
          <>
            <Chart options={options} series={series} type="rangeBar" height={chartHeight} />

            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-700">Daily Summary</h3>
                    <div className="flex items-center gap-2 font-bold text-lg text-primary">
                        <LuClock />
                        <span>Total: {summaryData.totalHours.toFixed(2)} hrs</span>
                    </div>
                </div>
                <ul className="space-y-2">
                    {summaryData.tasks.map(task => (
                        <li key={task.title} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                            <span className="text-sm text-gray-800">{task.title}</span>
                            <span className="text-sm font-semibold text-gray-600">{formatDuration(task.duration)}</span>
                        </li>
                    ))}
                </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-gray-500">No time logs found for this selection.</div>
        )}
      </div>
    </>
  );
};

export default AdminDayView;