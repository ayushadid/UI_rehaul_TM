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

// In backend/controllers/projectController.js

/**
 * @desc    Get all projects for the logged-in user (by membership or task assignment)
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res) => {
  try {
    // Step 1: Find projects where the user is an explicit member and projects where they have assigned tasks.
    // We run these two database queries in parallel for better performance.
    const [projectsByMembership, projectIdsByTask] = await Promise.all([
      Project.find({ members: req.user._id }).select('_id'),
      Task.distinct('project', { assignedTo: req.user._id })
    ]);

    // Step 2: Extract the IDs from both queries.
    const idsByMembership = projectsByMembership.map(p => p._id.toString());
    const idsByTask = projectIdsByTask.map(id => id.toString());

    // Step 3: Combine and de-duplicate the list of project IDs using a Set.
    const allRelevantProjectIds = [...new Set([...idsByMembership, ...idsByTask])];

    // Step 4: Fetch the full details for all relevant projects in a single query.
    const projects = await Project.find({ '_id': { $in: allRelevantProjectIds } })
        .populate("owner members", "name email");

    res.status(200).json(projects);
  } catch (error) {
    console.error("Error getting projects for user:", error);
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
 * @desc    Get a single project by ID
 * @route   GET /api/projects/:id
 * @access  Private (Admin)
 */
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate("owner members", "name email profileImageUrl");

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        res.status(200).json(project);
    } catch (error) {
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
/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private (Admin)
 */
const updateProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        project.name = name || project.name;
        project.description = description !== undefined ? description : project.description;
        
        const updatedProject = await project.save();
        res.status(200).json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Get a single project by ID (for members)
 * @route   GET /api/projects/member/:id
 * @access  Private (Member)
 */
const getMemberProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Authorization Check: Is the current user a member of this project?
        const isMember = project.members.some(memberId => memberId.toString() === req.user._id.toString());
        const isOwner = project.owner.toString() === req.user._id.toString();


        if (!isMember && !isOwner) {
            return res.status(403).json({ message: "Not authorized to view this project" });
        }
        
        // If authorized, proceed to fetch the full details
        const projectDetails = await Project.findById(req.params.id)
            .populate("owner members", "name email profileImageUrl");

        res.status(200).json(projectDetails);

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Add one or more members to a project
 * @route   PUT /api/projects/:id/members
 * @access  Private (Admin or Project Owner)
 */
const addProjectMembers = async (req, res) => {
    try {
        const { memberIds } = req.body; // Expect an array of user IDs
        const projectId = req.params.id;

        if (!memberIds || !Array.isArray(memberIds)) {
            return res.status(400).json({ message: "An array of memberIds is required." });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }

        // Authorization: Only the project owner or an admin can add members
        const isOwner = project.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to add members to this project." });
        }

        // Use $addToSet to add new members without creating duplicates
        await Project.updateOne(
            { _id: projectId },
            { $addToSet: { members: { $each: memberIds } } }
        );
        
        // Fetch the updated project to return it with the populated members list
        const updatedProject = await Project.findById(projectId)
            .populate("owner members", "name email profileImageUrl");

        res.json({ message: "Members added successfully.", project: updatedProject });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports = {
  createProject,
  getProjects, // Make sure this is exported
  getAllProjects,
  getProjectGanttData, // Make sure this is exported
  getProjectById,
  updateProject,
  getMemberProjectById,
  addProjectMembers
};

