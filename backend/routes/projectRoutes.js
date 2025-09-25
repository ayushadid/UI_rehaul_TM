const express = require("express");
const router = express.Router();
const { createProject, getProjects,getAllProjects,getProjectGanttData  } = require("../controllers/projectController");
// 👇 1. Import your adminOnly middleware
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// The GET route remains accessible to all logged-in users
router.get("/", protect, getProjects);

// 👇 2. Add adminOnly to the POST route
router.post("/", protect, adminOnly, createProject);

router.get("/all", protect, getAllProjects);

router.route('/:id/gantt').get(protect, getProjectGanttData);


module.exports = router;