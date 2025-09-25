import React, { useContext, useEffect, useState } from 'react';
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

const UserDashboard = () => {
    useUserAuth();
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [pieChartData, setPieChartData] = useState([]);
    const [barChartData, setBarChartData] = useState([]);

    // 1. Corrected to use a consistent 'name'/'value' format for both charts
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
                // 2. Pointing to the new, unified dashboard endpoint
                const response = await axiosInstance.get(API_PATHS.TASKS.GET_DASHBOARD_DATA);
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
        // Users might not have access to the admin tasks page, you might want a different link here
        // For now, it points to the same place.
        navigate('/admin/tasks');
    };

    const handlePieSliceClick = (status) => {
        navigate('/user/tasks', { state: { statusFilter: status } });
    };

    return (
        <DashboardLayout activeMenu="Dashboard">
            <div className='card my-5'>
                <div>
                    <div className='col-span-3'>
                        <h2 className='text-xl md:text-2xl'>Hello! {user?.name}</h2>
                        <p className='text-xs md:text-[13px] text-gray-400 mt-1.5'>
                            {moment().format("dddd, MMMM Do YYYY")}
                        </p>
                    </div>
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-6 mt-5'>
                    {/* 3. Added the new Total Hours card for the user */}
                    <InfoCard 
                        label="My Hours"
                        value={dashboardData?.totalHours || '0.00'}
                        color="bg-slate-500"
                    />
                    {/* 4. Corrected data paths to use the 'statistics' object */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6">
                <div>
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <h5 className="font-medium">My Task Distribution</h5>
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
                            <h5 className="font-medium">My Task Priority</h5>
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
                            <h5 className="text-lg">My Recent Tasks</h5>
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

export default UserDashboard;