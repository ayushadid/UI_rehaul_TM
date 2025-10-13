
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

//utils/apiPaths.js
export const API_PATHS={
    AUTH: {
        REGISTER:"/api/auth/register", //Register a new user(Admin or Member)
        LOGIN:"/api/auth/login", //Authenticate user and return JWT Token
        GET_PROFILE:"/api/auth/profile", //Get Logged in user details
    },

    BLOG: {
        GET_ALL_POSTS: "/api/blogs",
        GET_POST_BY_ID: (slug) => `/api/blogs/slug/${slug}`,    },

    USERS:{
        GET_ALL_USERS:"/api/users", //Get all users (Admin only)
        GET_USER_BY_ID: (userId)=>`/api/users/${userId}`, //Get user by Id
        CREATE_USER: "/api/users", //Create a new user (admin only)
        GET_MANAGE_USERS: "/api/users/manage", // 👈 ADD THIS
        UPDATE_ROLE: (userId) => `/api/users/${userId}/role`, // 👈 ADD THIS
        DELETE_USER: (userId) => `/api/users/${userId}`, 
    },

    TASKS:{
        GET_DASHBOARD_DATA:"/api/tasks/dashboard-data", //Get Dashboard Data
        GET_USER_DASHBOARD_DATA:"/api/tasks/user-dashboard-data", //Get User Dashboard
        GET_ALL_TASKS:"/api/tasks", //Get all Tasks(admin:all, User:only assigned)
        GET_TASK_BY_ID:(taskId)=>`/api/tasks/${taskId}`, //Get task by ID
        CREATE_TASK:"/api/tasks",//Create a new Task(Admin Only)
        GET_TASKS_FOR_USER: (userId) => `/api/tasks/user/${userId}`, // Get tasks for a specific user (Admin only)
        UPDATE_TASK:(taskId)=>`/api/tasks/${taskId}`, //Update task by id
        DELETE_TASK:(taskId)=>`/api/tasks/${taskId}`, //Delete a task by id
        

        UPDATE_TASK_STATUS:(taskId)=>`/api/tasks/${taskId}/status`,
        UPDATE_TASK_CHECKLIST:(taskId)=>`/api/tasks/${taskId}/todo`,
        ADD_REMARK: (taskId) => `/api/tasks/${taskId}/remarks`, 
        ADD_COMMENT: (taskId) => `/api/tasks/${taskId}/comments`,

        START_TIMER: (taskId) => `/api/tasks/${taskId}/timelogs/start`,
        STOP_TIMER: (taskId, timeLogId) => `/api/tasks/${taskId}/timelogs/${timeLogId}/stop`,
        GET_ACTIVE_TIMER: (taskId) => `/api/tasks/${taskId}/timelogs/active`,
        GET_TASK_TIMELOGS: (taskId) => `/api/tasks/${taskId}/timelogs`,

        // Add these to your TASKS object
        SUBMIT_FOR_REVIEW: (taskId) => `/api/tasks/${taskId}/submit-review`, // For assignees to submit work
        PROCESS_REVIEW: (taskId) => `/api/tasks/${taskId}/process-review`, // For reviewers to approve/reject
        FINAL_APPROVE_TASK: (taskId) => `/api/tasks/${taskId}/final-approval`, // For the creator's final sign-off
        DIRECT_STATUS_UPDATE: (taskId) => `/api/tasks/${taskId}/direct-status-update`, // For the clickable status pill

        GET_ADMIN_BOARD: "/api/tasks/admin-board",
        GET_USER_BOARD: "/api/tasks/user-board",
        GET_TASKS_FOR_CALENDAR: "/api/tasks/calendar",
    },
    TIMELOGS: {
        GET_BY_DAY: (userId) => `/api/timelogs/day/${userId}`,
        GET_ALL_BY_DAY: "/api/timelogs/all-by-day", // 👈 Add this line
        GET_ACTIVE_TIMELOGS: "/api/timelogs/active",
        GET_WORK_HOURS_SUMMARY: "/api/timelogs/summary/work-hours",   
},
    PROJECTS: {
        CREATE_PROJECT: "/api/projects", // To create a new project
        GET_MY_PROJECTS: "/api/projects", // To get projects for the logged-in user
        GET_ALL_PROJECTS: "/api/projects/all", // To get all projects (Admin Only)
        GET_GANTT_DATA: (projectId) => `/api/projects/${projectId}/gantt`,
  },
     AI: {
        CREATE_TASK: "/api/ai/create-task",
    },
    NOTIFICATIONS: {
    GET_ALL: "/api/notifications",
    MARK_AS_READ: "/api/notifications/read",
    MARK_ONE_AS_READ: (id) => `/api/notifications/${id}/read`, // 👈 Add this line
    },

    REPORTS:{
        EXPORT_TASKS:"/api/reports/exports/tasks",
        EXPORT_USERS:"/api/reports/exports/users",
    },
    ANNOUNCEMENTS: {
        CREATE: "/api/announcements",
        GET_BY_ID: (id) => `/api/announcements/${id}`, // 👈 ADD THIS
},

    IMAGE:{
        UPLOAD_IMAGE:"api/auth/upload-image"
    },
}
