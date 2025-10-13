const express = require("express");
const router = express.Router();
const { 
    createProject, 
    getProjects,
    getAllProjects, 
    getProjectById,
    updateProject,
    getProjectGanttData
} = require("../controllers/projectController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// SPECIFIC ROUTES FIRST
// GET /api/projects/all (For Admins to get all projects)
router.get("/all", protect, adminOnly, getAllProjects);

// GENERAL ROUTES
// GET /api/projects (For any user to get projects they are a member of)
// POST /api/projects (For Admins to create a project)
router.route("/")
    .get(protect, getProjects)
    .post(protect, adminOnly, createProject);

// DYNAMIC (PARAMETERIZED) ROUTES LAST
// GET /api/projects/:id/gantt
router.get("/:id/gantt", protect, getProjectGanttData);

// GET /api/projects/:id
// PUT /api/projects/:id
router.route("/:id")
    .get(protect, adminOnly, getProjectById)
    .put(protect, adminOnly, updateProject);

module.exports = router;