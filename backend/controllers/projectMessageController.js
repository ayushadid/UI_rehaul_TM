const Project = require('../models/Project');
const Task = require('../models/Task');
const ProjectMessage = require('../models/ProjectMessage');

// Helper function to check if a user has access to a project's chat
// In backend/controllers/projectMessageController.js

const canAccessProject = async (projectId, userId) => {
    try {
        const project = await Project.findById(projectId);
        if (!project) return false;

        const userIdString = userId.toString();

        // 1. Check if the user is the owner of the project
        if (project.owner.toString() === userIdString) {
            return true;
        }

        // 2. Check if the user is in the explicit members array
        const isExplicitMember = project.members.some(memberId => memberId.toString() === userIdString);
        if (isExplicitMember) {
            return true;
        }
        
        // 3. Check if the user is assigned to any task within the project
        const taskAssignment = await Task.findOne({ project: projectId, assignedTo: userId });
        if (taskAssignment) {
            return true;
        }

        // If none of the above, deny access
        return false;

    } catch (error) {
        console.error("Error in canAccessProject:", error);
        return false;
    }
};


/**
 * @desc    Get all messages for a project
 * @route   GET /api/projects/:projectId/messages
 * @access  Private
 */
const getProjectMessages = async (req, res) => {
    try {
        if (!await canAccessProject(req.params.projectId, req.user._id)) {
            return res.status(403).json({ message: "Not authorized to access this project chat." });
        }

        const messages = await ProjectMessage.find({ project: req.params.projectId })
            .populate('sender', 'name profileImageUrl')
            .sort({ createdAt: 'asc' });
            
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

/**
 * @desc    Post a new message to a project
 * @route   POST /api/projects/:projectId/messages
 * @access  Private
 */
const postProjectMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const projectId = req.params.projectId;

        if (!await canAccessProject(projectId, req.user._id)) {
            return res.status(403).json({ message: "Not authorized to post in this project chat." });
        }

        const message = await ProjectMessage.create({
            project: projectId,
            sender: req.user._id,
            content: content,
        });

        const populatedMessage = await ProjectMessage.findById(message._id)
            .populate('sender', 'name profileImageUrl');

        // Broadcast the new message to the project's room via Socket.IO
        const { io } = req;
        io.to(projectId.toString()).emit('new_project_message', populatedMessage);

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getProjectMessages, postProjectMessage };