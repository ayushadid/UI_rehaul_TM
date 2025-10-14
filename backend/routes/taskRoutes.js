const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const {
    getDashboardData,
    getUserDashboardData,
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getTasksForSpecificUser,

    addRemarkToTask,
    startTimer,
    stopTimer,
    getActiveTimer,
    getTaskTimeLogs,
    getUserBoardData,
    addCommentToTask,
    submitForReview, // 1. Import the new controller function
    processReview,
    finalApproveTask,
    directStatusUpdate,
    getTasksForCalendar,
    getAdminBoardData,
    getLiveTasks
} = require("../controllers/taskController");
const router = express.Router();

// --- Static Routes (must be defined before dynamic routes) ---

// Main route for getting all tasks (or filtered tasks)
router.get("/", protect, getTasks);

router.get("/live", protect, adminOnly, getLiveTasks); // 👈 ADD THIS

// Dashboard and Board routes
router.get("/dashboard-data", protect, getDashboardData);
router.get("/user-dashboard-data", protect, getUserDashboardData);
router.get("/user-board", protect, getUserBoardData);
router.get("/admin-board", protect, adminOnly, getAdminBoardData);
router.route('/calendar').get(protect, getTasksForCalendar);


// --- Dynamic Routes (with parameters like :id, :userId, :taskId) ---

// Routes for a specific user's tasks (admin only)
router.get("/user/:userId", protect, adminOnly, getTasksForSpecificUser);

// Routes for starting/stopping timers
router.post("/:taskId/timelogs/start", protect, startTimer);
router.put("/:taskId/timelogs/:timeLogId/stop", protect, stopTimer);
router.get("/:taskId/timelogs/active", protect, getActiveTimer);
router.get("/:taskId/timelogs", protect, getTaskTimeLogs);


// Routes for adding remarks
router.post("/:id/remarks", protect, adminOnly, addRemarkToTask);
router.post("/:id/comments", protect, addCommentToTask);

// --- START: New Review System Route ---
// 2. Add the new route for submitting a task for review
router.put("/:id/submit-review", protect, submitForReview);
// In routes/taskRoutes.js
router.put("/:id/process-review", protect, processReview);
// In routes/taskRoutes.js
router.put("/:id/final-approval", protect, finalApproveTask);
// In routes/taskRoutes.js
router.put("/:id/direct-status-update", protect, directStatusUpdate);
// --- END: New Review System Route ---

// Routes for updating status and checklist
router.put("/:id/status", protect, updateTaskStatus);
router.put("/:id/todo", protect, updateTaskChecklist);

// General CRUD routes for a single task. These should come last.
router.get("/:id", protect, getTaskById);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, adminOnly, deleteTask);

// Route for creating a new task
router.post("/", protect, adminOnly, createTask);


module.exports = router;