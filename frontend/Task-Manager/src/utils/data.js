import {
    LuLayoutDashboard,
    LuUsers,
    LuClipboardCheck,
    LuLogOut,
    LuBell,
    LuTrendingUp ,
    LuFolderKanban,
    LuMegaphone
} from "react-icons/lu";

// Admin Menu (Projects item removed)
export const SIDE_MENU_DATA = [
    { id: "01", label: "Dashboard", icon: LuLayoutDashboard, path: "/admin/dashboard" },
    { id: "02", label: "My Tasks", icon: LuClipboardCheck, path: "/admin/tasks" },
    { id: "03", label: "Inbox", icon: LuBell, path: "/notifications" },
    { id: "04", label: "Team", icon: LuUsers, path: "/admin/users" },
    { id: "05", label: "Reports", icon: LuTrendingUp, path: "/admin/my-day-view" },
    { id: "08", label: "Create Announcement", icon: LuMegaphone, path: "/admin/create-announcement" },
    { id: "07", label: "Logout", icon: LuLogOut, path: "logout" },
];

// User Menu (Projects item removed)
// In frontend/Task-Manager/src/utils/data.js

// ... (SIDE_MENU_DATA for admin remains the same) ...

// New, simplified menu for Users
export const SIDE_MENU_USER_DATA = [
    { id: "01", label: "Dashboard", icon: LuLayoutDashboard, path: "/user/dashboard" },
    { id: "02", label: "My Tasks", icon: LuClipboardCheck, path: "/user/tasks" },
    { id: "03", label: "Inbox", icon: LuBell, path: "/notifications" },
    // 👇 THIS IS THE FIX 👇
    { id: "04", label: "Projects", icon: LuFolderKanban, path: "/board" },
    { id: "05", label: "Logout", icon: LuLogOut, path: "logout" },
];

// ... (rest of the file is the same)

export const PRIORITY_DATA = [
    { label: "Low", value: "Low" },
    { label: "Medium", value: "Medium" },
    { label: "High", value: "High" },
];

export const STATUS_DATA = [
    { label: "Pending", value: "Pending" },
    { label: "In Progress", value: "In Progress" },
    { label: "Completed", value: "Completed" },
];