import React, { useContext } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import UserProvider, { UserContext } from './context/userContext';
import { Toaster } from 'react-hot-toast';

// Import the new Layout
import AppLayout from './components/layouts/AppLayout'; // 👈 NEW

// Import Pages
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/SignUp';
import PrivateRoute from './routes/PrivateRoute';
import Dashboard from './pages/Admin/Dashboard';
// import ManageTasks from './pages/Admin/ManageTasks';
import TaskListView from './pages/Shared/TaskListView';
import CreateTask from './pages/Admin/CreateTask';
import ManageUsers from './pages/Admin/ManageUsers';
import UserDashboard from './pages/User/UserDashboard';
// import MyTasks from './pages/User/MyTasks';
import ViewTaskDetails from './pages/User/ViewTaskDetails';
import TaskTimeLogsPage from './pages/User/TaskTimeLogsPage';
import TaskCalendar from './pages/Admin/TaskCalendar';
import SharedSheet from './pages/Admin/SharedSheet';
import DailyLogChart from './pages/Admin/DailyLogChart';
import UserDailyLogChart from './pages/User/UserDailyLogChart';
import ProjectBoard from './pages/User/ProjectBoard';
import GanttChartPage from './pages/Admin/GanttChartPage';
import NotificationsPage from './pages/User/NotificationsPage';
import UserTasksDetails from './pages/Admin/UserTasksDetails';
import ProjectDashboard from './pages/Admin/ProjectDashboard';
import ProjectDetailsPage from './pages/Admin/ProjectDetailsPage';
import CreateAnnouncement from './pages/Admin/CreateAnnouncement';
import ProfilePage from './pages/Shared/ProfilePage';

const App = () => {
    return (
        <UserProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* --- START: New Protected Route Structure --- */}
                    <Route element={<AppLayout />}>
                        {/* Admin Routes */}
                        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
                            <Route path="/admin/dashboard" element={<Dashboard />} />
                            <Route path="/admin/tasks" element={<TaskListView />} />
                            <Route path="/admin/create-task" element={<CreateTask />} />
                            <Route path="/admin/users" element={<ManageUsers />} />
                            <Route path="/admin/my-day-view" element={<DailyLogChart />} />
                            <Route path="/admin/users/:userId/tasks" element={<UserTasksDetails />} />
                            <Route path="/admin/tasks/:taskId/timelogs" element={<TaskTimeLogsPage />} />
                            <Route path="/projects/:projectId/details" element={<ProjectDetailsPage />} /> {/* 👈 ADD THIS LINE */}
                            <Route path="/admin/create-announcement" element={<CreateAnnouncement />} />
                        </Route>

                        {/* User Routes */}
                        <Route element={<PrivateRoute allowedRoles={["member"]} />}>
                            <Route path="/user/dashboard" element={<UserDashboard />} />
                            <Route path="/user/tasks" element={<TaskListView />} />
                            <Route path="/user/my-day-view" element={<UserDailyLogChart />} />
                            <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
                            <Route path="/user/tasks/:taskId/timelogs" element={<TaskTimeLogsPage />} />
                        </Route>

                        {/* Shared Routes for both Admin and User */}
                        <Route element={<PrivateRoute allowedRoles={["admin", "member"]} />}>
                            <Route path="/projects/:projectId/dashboard" element={<ProjectDashboard />} /> {/* 👈 ADD THIS LINE */}
                            <Route path="/projects/:projectId/board" element={<ProjectBoard />} />
                            <Route path="/projects/:projectId/calendar" element={<TaskCalendar />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            <Route path="/gantt/:projectId?" element={<GanttChartPage />} />
                            <Route path="/shared-sheet" element={<SharedSheet />} />
                            <Route path="/profile" element={<ProfilePage />} />
                        </Route>
                    </Route>
                    {/* --- END: New Protected Route Structure --- */}

                    {/* Default Route */}
                    <Route path="/" element={<Root />} />
                </Routes>
            </Router>
            <Toaster toastOptions={{ className: '', style: { fontSize: "13px" } }} />
        </UserProvider>
    );
};

const Root = () => {
    const { user, loading } = useContext(UserContext);
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return user.role === "admin"
        ? <Navigate to="/admin/dashboard" replace />
        : <Navigate to="/user/dashboard" />;
};

export default App;