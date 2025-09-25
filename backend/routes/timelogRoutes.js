// In backend/routes/timelogRoutes.js

const express = require("express");
const router = express.Router();
// 👇 1. Import the new function
const { getTimeLogsByDay, getAllTimeLogsByDay,getActiveTimelogs,getWorkHoursSummary  } = require("../controllers/timelogController");
const { protect, adminOnly } = require("../middlewares/authMiddleware"); // Import adminOnly

// Route for individual user logs
router.get("/day/:userId", protect, getTimeLogsByDay);

// 👇 2. Add the new admin-only route for all user logs
router.get("/all-by-day", protect, adminOnly, getAllTimeLogsByDay);

router.get("/active", protect, adminOnly, getActiveTimelogs);

router.get('/summary/work-hours', protect, adminOnly, getWorkHoursSummary);


module.exports = router;