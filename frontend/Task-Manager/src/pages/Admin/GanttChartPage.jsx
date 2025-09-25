import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import moment from 'moment';

// This is a custom component that draws our tasks as bars inside the ScatterChart.
const GanttBar = (props) => {
    const { x, y, width, height, payload } = props;
    const { progress } = payload;
    
    // The main bar representing the full duration
    const barWidth = width;
    // The progress overlay bar, calculated as a percentage of the main bar's width
    const progressWidth = (barWidth * progress) / 100;

    return (
        <g>
            {/* Background of the bar (the full duration) */}
            <rect x={x} y={y} width={barWidth} height={height} fill="#a3a3a3" rx="4" ry="4" />
            {/* Foreground of the bar (the progress) */}
            <rect x={x} y={y} width={progressWidth} height={height} fill="#4f46e5" rx="4" ry="4" />
        </g>
    );
};

// A custom tooltip for a professional look on hover
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const startDate = moment(data.start).format('MMM D, YYYY');
        const endDate = moment(data.end).format('MMM D, YYYY');
        return (
            <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-3 border border-gray-200">
                <p className="font-bold text-gray-800">{data.name}</p>
                <p className="text-sm text-gray-600">{`${startDate} - ${endDate}`}</p>
                <p className="text-sm text-gray-600">Progress: {data.progress}%</p>
            </div>
        );
    }
    return null;
};

const GanttChartPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    
    const [projects, setProjects] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [timeDomain, setTimeDomain] = useState(['auto', 'auto']);
    const [taskNames, setTaskNames] = useState([]); // For the Y-axis labels

    // Effect to fetch the list of projects for the dropdown
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await axiosInstance.get(API_PATHS.PROJECTS.GET_ALL_PROJECTS);
                setProjects(response.data || []);
            } catch (error) {
                console.error("Failed to fetch projects", error);
            }
        };
        fetchProjects();
    }, []);

    // Effect to fetch and process the Gantt data when a project is selected
    useEffect(() => {
        const fetchGanttData = async () => {
            if (!projectId) return;

            setIsLoading(true);
            try {
                const response = await axiosInstance.get(API_PATHS.PROJECTS.GET_GANTT_DATA(projectId));
                const { data } = response.data;

                // Format the data for the Scatter Chart
                const formattedData = data.map((task, index) => ({
                    name: task.text,
                    taskIndex: index, // Use a numerical index for the Y-axis
                    start: new Date(task.start_date).getTime(),
                    end: new Date(task.end_date).getTime(),
                    progress: task.progress * 100,
                }));
                
                setChartData(formattedData);
                setTaskNames(formattedData.map(t => t.name));

                // This is the critical fix: we create a wider, stable time domain for the X-axis.
                if (formattedData.length > 0) {
                    const allDates = formattedData.flatMap(d => [d.start, d.end]);
                    const minDate = Math.min(...allDates);
                    const maxDate = Math.max(...allDates);
                    
                    const paddedMin = moment(minDate).subtract(1, 'day').valueOf();
                    const paddedMax = moment(maxDate).add(1, 'day').valueOf();
                    setTimeDomain([paddedMin, paddedMax]);
                } else {
                    setTimeDomain(['auto', 'auto']);
                }
            } catch (error) {
                console.error("Failed to fetch Gantt data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGanttData();
    }, [projectId]);

    const handleProjectSelect = (e) => {
        const selectedId = e.target.value;
        if (selectedId) {
            navigate(`/gantt/${selectedId}`);
        }
    };

    return (
        <DashboardLayout activeMenu="Gantt Chart">
            <div className="p-4 md:p-6 h-full flex flex-col">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Project Timeline</h2>
                    <select
                        onChange={handleProjectSelect}
                        value={projectId || ""}
                        className="form-input text-sm w-full md:w-72"
                    >
                        <option value="" disabled>Select a Project to View</option>
                        {projects.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-grow border rounded-lg bg-white shadow-sm p-4">
                    {projectId ? (
                        isLoading ? (
                            <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 100 }}>
                                    <CartesianGrid />
                                    <XAxis 
                                        type="number" 
                                        dataKey="start" 
                                        name="start" 
                                        domain={timeDomain}
                                        tickFormatter={(timeStr) => moment(timeStr).format('MMM D')}
                                        scale="time"
                                    />
                                    <YAxis 
                                        type="number" 
                                        dataKey="taskIndex" 
                                        name="task" 
                                        tickFormatter={(index) => taskNames[index] || ''}
                                        reversed={true}
                                        interval={0}
                                    />
                                    <ZAxis dataKey="end" name="end" range={[0, 500]} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                    <Scatter name="Tasks" data={chartData} shape={<GanttBar />} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : (
                             <div className="flex items-center justify-center h-full text-gray-500">No tasks with start and end dates found.</div>
                        )
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                            <p className="text-gray-500 font-medium">Please select a project to view its timeline.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default GanttChartPage;