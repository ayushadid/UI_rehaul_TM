import {
    LuLayoutDashboard,
    LuUsers,
    LuClipboardCheck,
    LuSquarePlus,
    LuLogOut,
    LuSheet,   
    LuView,
    LuBell,
    LuCalendarDays, 
    LuFolderKanban,
    LuFileText 
} from "react-icons/lu"

export const SIDE_MENU_DATA=[
    {
        id:"01",
        label:"Dashboard",
        icon:LuLayoutDashboard,
        path:"/admin/dashboard",
    },
    {
        id:"99",
    label: "Notifications",
    path: "/notifications",
    icon: LuBell,
  },
    {
        id:"02",
        label:"Manage Tasks",
        icon:LuClipboardCheck,
        path:"/admin/tasks",
    },
    {
        id:"03",
        label:"Create Task",
        icon:LuSquarePlus,
        path:"/admin/create-task",
    },
    // {
    //     id: "10",
    //     label: "Blog & Updates",
    //     icon: LuFileText,
    //     path: "/admin/blog",
    // },
    // {
    //     id:"08",
    //     label:"Gantt",
    //     icon: LuFolderKanban,
    //     path: "/gantt", // This will be the new page
    // },
    {
        id:"04",
        label:"Team Members",
        icon:LuUsers,
        path:"/admin/users",
    },
    {
        id:"07",
      label: "My Day View",
      path: "/admin/my-day-view",
      icon: LuLayoutDashboard ,
    },
     {
    label: "Board",
    path: "/board",
    icon: LuView,
  },
  {
        id:"09", // Give it a new ID
        label:"Calendar",
        icon: LuCalendarDays,
        path: "/calendar",
    },
    {
        id:"06",
    label: "Shared Sheet",
    path: "/shared-sheet",
    icon: LuSheet,
  },
    {
        id:"05",
        label:"Logout",
        icon:LuLogOut,
        path:"logout",
    },
    
];

export const SIDE_MENU_USER_DATA=[
    {
        id:"01",
        label:"Dashboard",
        icon:LuLayoutDashboard,
        path:"/user/dashboard",
    },
    {
        id:"99",
    label: "Notifications",
    path: "/notifications",
    icon: LuBell,
  },
    {
        id:"02",
        label:"My Tasks",
        icon:LuClipboardCheck,
        path:"/user/tasks",
    },
    // {
    //     id: "10",
    //     label: "Blog & Updates",
    //     icon: LuFileText,
    //     path: "/admin/blog",
    // },
    {
        id:"07",
      label: "My Day View",
      path: "/user/my-day-view",
      icon: LuLayoutDashboard ,
    },
     {
    label: "Board",
    path: "/board",
    icon: LuView,
  },
  {
        id:"09", // Give it a new ID
        label:"Calendar",
        icon: LuCalendarDays,
        path: "/calendar",
    },
    {
        id:"06",
    label: "Shared Sheet",
    path: "/shared-sheet",
    icon: LuSheet,
  },
    {
        id:"05",
        label:"Logout",
        icon:LuLogOut,
        path:"logout",
    },
];

export const PRIORITY_DATA=[
    {label:"Low",value:"Low"},
    {label:"Medium",value:"Medium"},
    {label:"High",value:"High"},
]

export const STATUS_DATA=[
    {label:"Pending",value:"Pending"},
    {label:"In Progress",value:"In Progress"},
    {label:"Completed",value:"Completed"},
]