import React, { useContext } from 'react'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Outlet,
    Navigate,
} from "react-router-dom";
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/SignUp';
import PrivateRoute from './routes/PrivateRoute';
import Dashboard from './pages/Admin/Dashboard';
import ManageTasks from './pages/Admin/ManageTasks';
import CreateTask from './pages/Admin/CreateTask';
import ManageUsers from './pages/Admin/ManageUsers';
import UserDashboard from './pages/User/UserDashboard';
import MyTasks from './pages/User/MyTasks';
import ViewTaskDetails from './pages/User/ViewTaskDetails';
import TaskTimeLogsPage from './pages/User/TaskTimeLogsPage';
import TaskCalendar from './pages/Admin/TaskCalendar';
import SharedSheet from './pages/Admin/SharedSheet'; // Add this line
import DailyLogChart from './pages/Admin/DailyLogChart';
import UserDailyLogChart from './pages/User/UserDailyLogChart';
import ProjectBoard from './pages/User/ProjectBoard';
import GanttChartPage from './pages/Admin/GanttChartPage';
import NotificationsPage from './pages/User/NotificationsPage';
import BlogIndexPage from './pages/Admin/BlogIndexPage';
import BlogPostPage from './pages/Admin/BlogPostPage';
import UserProvider, { UserContext } from './context/userContext';
import { Toaster } from 'react-hot-toast';

// Import the new component
import UserTasksDetails from './pages/Admin/UserTasksDetails'; // Adjust path if necessary


const App = () => {
    return (
        <UserProvider>
            <div>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />

                        {/* Admin Routes */}
                        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
                            <Route path="/admin/dashboard" element={<Dashboard />} />
                            <Route path="/admin/tasks" element={<ManageTasks />} />
                            <Route path="/admin/create-task" element={<CreateTask />} />
                            <Route path="/admin/users" element={<ManageUsers />} />
                            <Route path="/calendar" element={<TaskCalendar />} />
                            <Route path="/shared-sheet" element={<SharedSheet />} />
                            <Route path="/admin/my-day-view" element={<DailyLogChart />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            
                            {/* --- 2. Add the new routes for the blog pages here --- */}
                            <Route path="/admin/blog" element={<BlogIndexPage />} />
                            <Route path="/admin/blog/:slug" element={<BlogPostPage />} />
                            {/* --- End of new routes --- */}

                            {/* NEW ROUTE FOR USER-SPECIFIC TASKS (Admin Only) */}
                            {/* This path matches what was used in UserCard.jsx: /manage-users/:userId/tasks */}
                            <Route path="/admin/users/:userId/tasks" element={<UserTasksDetails />} />
                            <Route path="/admin/tasks/:taskId/timelogs" element={<TaskTimeLogsPage />} />
                            <Route path="/gantt/:projectId?" element={<GanttChartPage />} />

                        </Route>

                        {/* User Routes */}
                        <Route element={<PrivateRoute allowedRoles={["member"]} />}> {/* Changed "user" to "member" based on your schema default */}
                            <Route path="/user/dashboard" element={<UserDashboard />} />
                            <Route path="/user/tasks" element={<MyTasks />} />
                            <Route path="/shared-sheet" element={<SharedSheet />} />
                            <Route path="/user/my-day-view" element={<UserDailyLogChart />} />
                            <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
                            <Route path="/board" element={<ProjectBoard />} />
                            <Route path="/calendar" element={<TaskCalendar />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            <Route path="/user/tasks/:taskId/timelogs" element={<TaskTimeLogsPage />} />
                            <Route path="/gantt/:projectId?" element={<GanttChartPage />} />

                        </Route>

                        {/* Default Route*/}
                        <Route path="/" element={<Root />} />
                    </Routes>
                </Router>
            </div>
            <Toaster
                toastOptions={{
                    className: '',
                    style: {
                        fontSize: "13px",
                    }
                }}
            />
        </UserProvider>
    )
}

export default App


const Root = () => {
    const { user, loading } = useContext(UserContext);

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return user.role === "admin"
        ? <Navigate to="/admin/dashboard" replace />
        : <Navigate to="/user/dashboard" replace />;
};