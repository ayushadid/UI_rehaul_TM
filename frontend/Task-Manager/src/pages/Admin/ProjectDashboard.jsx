import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/userContext';
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

const ProjectDashboard = () => {
    const { projectId } = useParams();
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState(null);
    const [pieChartData, setPieChartData] = useState([]);
    const [barChartData, setBarChartData] = useState([]);
    // No need for a separate projectName state, as the Header handles the title now

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
        setBarChartData(priorityLevelData);
    };

    const getDashboardData = useCallback(async () => {
        if (!projectId) return;
        try {
            const url = `${API_PATHS.TASKS.GET_DASHBOARD_DATA}?projectId=${projectId}`;
            const response = await axiosInstance.get(url);
            if (response.data) {
                setDashboardData(response.data);
                prepareChartData(response.data.charts);
            }
        } catch (error) {
            console.error("Error fetching project dashboard data:", error);
        }
    }, [projectId]);

    useEffect(() => {
        getDashboardData();
    }, [getDashboardData]);

    const onSeeMore = () => {
        // Navigate to the full task list, pre-filtered for this project
        const taskListPath = user?.role === 'admin' ? '/admin/tasks' : '/user/tasks';
        navigate(`${taskListPath}?projectId=${projectId}`);
    };

    return (
        // This component is a child of AppLayout via the router, so no wrapper is needed here.
        <>
            <div className='card mb-6'>
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-6'>
                    <InfoCard label="Total Hours" value={dashboardData?.totalHours || '0.00'} color="bg-slate-500" />
                    <InfoCard label="Total Tasks" value={addThousandsSeparator(dashboardData?.statistics?.totalTasks || 0)} color="bg-primary" />
                    <InfoCard label="Pending" value={addThousandsSeparator(dashboardData?.statistics?.pendingTasks || 0)} color="bg-violet-500" />
                    <InfoCard label="In Progress" value={addThousandsSeparator(dashboardData?.statistics?.inProgressTasks || 0)} color="bg-cyan-500" />
                    <InfoCard label="Completed" value={addThousandsSeparator(dashboardData?.statistics?.completedTasks || 0)} color="bg-lime-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="card">
                        <h5 className="font-medium mb-4">Task Distribution</h5>
                        <CustomPieChart data={pieChartData} colors={COLORS} />
                    </div>
                </div>
                <div>
                    <div className="card">
                        <h5 className="font-medium mb-4">Task Priority</h5>
                        <CustomBarChart data={barChartData} />
                    </div>
                </div>
                
                {/* Recent Tasks Section - Now included */}
                <div className="md:col-span-2">
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h5 className="text-lg font-semibold">Recent Tasks</h5>
                            <button className="card-btn" onClick={onSeeMore}>
                                See All <LuArrowRight />
                            </button>
                        </div>
                        <TaskListTable tableData={dashboardData?.recentTasks || []} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProjectDashboard;