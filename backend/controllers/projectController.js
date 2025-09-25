const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Admin)
 */
const createProject = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.create({
      name,
      description,
      members,
      owner: req.user.id, // Set the logged-in user as the owner
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get all projects for the logged-in user
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res) => {
  try {
    // Find all projects where the logged-in user is either the owner or a member
    // const projects = await Project.find({
    //   $or: [{ owner: req.user.id }, { members: req.user.id }],
    // }).populate("owner members", "name email"); // Populate user details
// Find all projects, no user filtering
const projects = await Project.find({}).populate("owner members", "name email"); // An empty filter {} fetches all documents
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error getting projects:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get ALL projects in the system
 * @route   GET /api/projects/all
 * @access  Private (Admin Only)
 */
const getAllProjects = async (req, res) => {
  try {
    // Find all projects without any user-based filtering
    const projects = await Project.find({}).sort({ name: 1 }); // Sort alphabetically by name
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error getting all projects:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get all tasks for a project, formatted for a Gantt chart.
 * @route   GET /api/projects/:id/gantt
 * @access  Private
 */
const formatGanttDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const getProjectGanttData = async (req, res) => {
    try {
        const { id: projectId } = req.params;

        const tasks = await Task.find({ 
            project: projectId,
            startDate: { $ne: null }, 
            dueDate: { $ne: null }
        })
        .populate('dependencies', '_id')
        .sort({ startDate: 1 });

        if (!tasks) {
            return res.status(404).json({ message: "Project not found or has no tasks." });
        }

        const formattedData = {
            data: tasks.map(task => ({
                id: task._id,
                text: task.title,
                // 👇 This is the corrected part 👇
                start_date: formatGanttDate(task.startDate),
                end_date: formatGanttDate(task.dueDate),
                progress: task.progress / 100,
            })),
            links: tasks.flatMap(task => 
                task.dependencies.map(dep => ({
                    id: new mongoose.Types.ObjectId(),
                    source: dep._id,
                    target: task._id,
                    type: "0"
                }))
            )
        };

        res.json(formattedData);

    } catch (error) {
        console.error("Error fetching Gantt data:", error);
        res.status(500).json({ message: "Server error" });
    }
};


module.exports = {
  createProject,
  getProjects,
  getAllProjects,
  getProjectGanttData // 👈 Add the new function here
};

