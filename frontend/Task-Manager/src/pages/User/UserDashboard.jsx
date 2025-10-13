import React, { useContext, useEffect, useState } from 'react';
import { useUserAuth } from '../../hooks/useUserAuth';
import { UserContext } from '../../context/userContext';
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

const UserDashboard = () => {
    useUserAuth();
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [pieChartData, setPieChartData] = useState([]);
    const [barChartData, setBarChartData] = useState([]);

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

    useEffect(() => {
        const getDashboardData = async () => {
            try {
                const response = await axiosInstance.get(API_PATHS.TASKS.GET_USER_DASHBOARD_DATA);
                if (response.data) {
                    setDashboardData(response.data);
                    prepareChartData(response.data.charts);
                }
            } catch (error) {
                console.error("Error fetching user dashboard data:", error);
            }
        };

        getDashboardData();
    }, []);
    
    const onSeeMore = () => {
        navigate('/user/tasks');
    };

    const handlePieSliceClick = (status) => {
        navigate('/user/tasks', { state: { statusFilter: status } });
    };

    return (
        <>
            <div className='card mb-6'>
                <div>
                    <h2 className='text-xl md:text-2xl'>Hello! {user?.name}</h2>
                    <p className='text-xs md:text-[13px] text-gray-400 mt-1.5'>
                        {moment().format("dddd, MMMM Do YYYY")}
                    </p>
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-6 mt-5'>
                    <InfoCard 
                        label="My Total Tasks"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="card">
                        <h5 className="font-medium mb-4">My Task Distribution</h5>
                        <CustomPieChart
                            data={pieChartData}
                            colors={COLORS}
                            onSliceClick={handlePieSliceClick}
                        />
                    </div>
                </div>
                <div>
                    <div className="card">
                        <h5 className="font-medium mb-4">My Task Priority</h5>
                        <CustomBarChart
                            data={barChartData}
                        />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h5 className="text-lg font-semibold">My Recent Tasks</h5>
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

export default UserDashboard;