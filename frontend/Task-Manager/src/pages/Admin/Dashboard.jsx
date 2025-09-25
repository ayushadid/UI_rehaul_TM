import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useUserAuth } from '../../hooks/useUserAuth';
import { UserContext } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import moment from 'moment';
import { addThousandsSeparator } from '../../utils/helper';
import InfoCard from '../../components/cards/InfoCard';
import { LuArrowRight } from 'react-icons/lu';
import TaskListTable from '../../components/TaskListTable';
import CustomPieChart from '../../components/charts/CustomPieChart';
import CustomBarChart from '../../components/charts/CustomBarChart';

const COLORS = ["#8D51FF", "#00B8D8", "#7BCE00"];

const Dashboard = () => {
    useUserAuth();
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    // State for dashboard data
    const [dashboardData, setDashboardData] = useState(null);
    const [pieChartData, setPieChartData] = useState([]); // Initialize as empty array
    const [barChartData, setBarChartData] = useState([]); // Initialize as empty array
    
    // State for the project filter
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('all');

    // This function now uses consistent data keys ('name' and 'value') for both charts.
    // This is the primary fix for the empty graphs issue.
    const prepareChartData = (chartsData) => {
        
        const taskDistribution = chartsData?.taskDistribution || {};
        const taskPriorityLevels = chartsData?.taskPriorityLevels || {};
          
        const taskDistributionData = [
            { name: "Pending", value: taskDistribution.Pending || 0 },
            { name: "In Progress", value: taskDistribution.InProgress || 0 },
            { name: "Completed", value: taskDistribution.Completed || 0 },
        ];
        setPieChartData(taskDistributionData);

        const priorityLevelData = [
            { name: "Low", value: taskPriorityLevels.Low || 0 },
            { name: "Medium", value: taskPriorityLevels.Medium || 0 },
            { name: "High", value: taskPriorityLevels.High || 0 },
        ];
        console.log("Data for Pie Chart:", taskDistributionData);
    console.log("Data for Bar Chart:", priorityLevelData);
        setBarChartData(priorityLevelData);
    };

    // This data fetching function is now wrapped in useCallback and is filter-aware.
    const getDashboardData = useCallback(async () => {
        try {
            let url = API_PATHS.TASKS.GET_DASHBOARD_DATA;
            if (selectedProjectId !== 'all') {
                url = `${url}?projectId=${selectedProjectId}`;
            }
            const response = await axiosInstance.get(url);
            if (response.data) {
                setDashboardData(response.data);
                prepareChartData(response.data.charts);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    }, [selectedProjectId]); // It re-creates itself only when the project filter changes

    // This useEffect fetches the list of projects for the dropdown, but only once.
    useEffect(() => {
        const getProjects = async () => {
            try {
                const response = await axiosInstance.get(API_PATHS.PROJECTS.GET_ALL_PROJECTS);
                setProjects(response.data || []);
            } catch (error) {
                console.error("Error fetching projects:", error);
            }
        };
        getProjects();
    }, []);

    // This useEffect now correctly re-runs the data fetch whenever the filter changes.
    useEffect(() => {
        getDashboardData();
    }, [getDashboardData]);

    const onSeeMore = () => {
        navigate('/admin/tasks');
    };
    const handlePieSliceClick = (status) => {
        navigate('/admin/tasks', { state: { statusFilter: status } });
    };
    return (
        <DashboardLayout activeMenu="Dashboard">
            <div className='card my-5'>
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center'>
                    <div>
                        <h2 className='text-xl md:text-2xl'>Hello! {user?.name}</h2>
                        <p className='text-xs md:text-[13px] text-gray-400 mt-1.5'>
                            {moment().format("dddd, MMMM Do YYYY")}
                        </p>
                    </div>

                    <div className="mt-4 md:mt-0">
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="form-input text-sm w-full md:w-64 bg-gray-50 border-gray-300"
                        >
                            <option value="all">Filter by Project (All)</option>
                            {projects.map(project => (
                                <option key={project._id} value={project._id}>{project.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-6 mt-5'>
                    <InfoCard
                        label="Total Hours"
                        value={dashboardData?.totalHours || '0.00'}
                        color="bg-slate-500"
                    />
                    <InfoCard
                        label="Total Tasks"
                        value={addThousandsSeparator(
                            dashboardData?.statistics?.totalTasks || 0
                        )}
                        color="bg-primary"
                    />
                    <InfoCard
                        label="Pending"
                        value={addThousandsSeparator(
                            dashboardData?.statistics?.pendingTasks || 0
                        )}
                        color="bg-violet-500"
                    />
                    <InfoCard
                        label="In Progress"
                        value={addThousandsSeparator(
                            dashboardData?.statistics?.inProgressTasks || 0
                        )}
                        color="bg-cyan-500"
                    />
                    <InfoCard
                        label="Completed"
                        value={addThousandsSeparator(
                            dashboardData?.statistics?.completedTasks || 0
                        )}
                        color="bg-lime-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6">
                <div>
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <h5 className="font-medium">Task Distribution</h5>
                        </div>
                        <CustomPieChart
                            data={pieChartData}
                            colors={COLORS}
                            onSliceClick={handlePieSliceClick} // 👈 Pass the handler to the component
                        />
                    </div>
                </div>
                <div>
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <h5 className="font-medium">Task Priority</h5>
                        </div>
                        <CustomBarChart
                            data={barChartData}
                            colors={COLORS}
                        />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <h5 className="text-lg">Recent Tasks</h5>
                            <button className="card-btn" onClick={onSeeMore}>
                                See All <LuArrowRight className="text-base" />
                            </button>
                        </div>
                        <TaskListTable tableData={dashboardData?.recentTasks || []} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;