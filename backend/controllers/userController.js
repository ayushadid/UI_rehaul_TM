const mongoose = require('mongoose');

const Task=require("../models/Task");
const User=require("../models/User");
const bcrypt=require("bcryptjs");
const Project = require('../models/Project'); 

//@desc Get All Users (admin)
//@route GET /api/users/
//@access Private (admin)

const getUsers = async (req, res) => {
  try {
    // ✅ Change this line to find ALL users
    const users = await User.find({}).select("-password");

    const usersWithTaskCounts = await Promise.all(users.map(async (user) => {
      const pendingTasks = await Task.countDocuments({ assignedTo: user._id, status: "Pending" });
      const inProgressTasks = await Task.countDocuments({ assignedTo: user._id, status: "In Progress" });
      const completedTasks = await Task.countDocuments({ assignedTo: user._id, status: "Completed" });

      return {
        ...user._doc,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      };
    }));

    res.status(200).json(usersWithTaskCounts);
    
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}


//@desc Get by Id 
//@route GET /api/users/:id
//@access Private

const getUserById=async(req,res)=>{
    try{
        const user=await User.findById(req.params.id).select("-password");
            if(!user) return res.status(404).json({message:"User not found"});
            res.json(user);
    }catch(error){
        res.status(500).json({message:"Server error",error:error.message});
    }
};

//@desc DElete A Users (admin)
//@route DELETE /api/users/:id
//@access Private (admin)

// const deleteUser= async(req,res)=>{};

/**
 * @desc    Get all users with detailed stats for admin management
 * @route   GET /api/users/manage
 * @access  Private (Admin Only)
 */
const getManageUsers = async (req, res) => {
    try {
        // 1. Get all users
        const users = await User.find({}).sort({ name: 1 }).lean();

        // 2. Get date range for the current week using native Date
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0); // Set to the beginning of the day

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999); // Set to the end of the day

        // 3. Fetch all relevant tasks
        const allTasks = await Task.find({
            status: { $ne: 'Completed' }
        }).select('assignedTo status estimatedHours startDate dueDate');

        // 4. Process the data for each user
        const usersWithStats = users.map(user => {
            const userIdString = user._id.toString();
            const tasksAssigned = allTasks.filter(task => 
                task.assignedTo.some(assignee => assignee.toString() === userIdString)
            );

            const taskCounts = {
                pending: tasksAssigned.filter(t => t.status === 'Pending').length,
                inProgress: tasksAssigned.filter(t => t.status === 'In Progress').length,
            };

            // Calculate weekly estimated hours
            const weeklyTasks = tasksAssigned.filter(task => {
                const startsBeforeEndOfWeek = !task.startDate || task.startDate <= endOfWeek;
                const endsAfterStartOfWeek = !task.dueDate || task.dueDate >= startOfWeek;
                return startsBeforeEndOfWeek && endsAfterStartOfWeek;
            });
            
            const weeklyEstimatedHours = weeklyTasks.reduce((total, task) => {
                return total + (typeof task.estimatedHours === 'number' && task.estimatedHours > 0 ? task.estimatedHours : 0);
            }, 0);

            return {
                ...user,
                taskCounts,
                weeklyEstimatedHours
            };
        });

        res.json(usersWithStats);

    } catch (error) {
        console.error("Error in getManageUsers:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Update a user's role
 * @route   PUT /api/users/:id/role
 * @access  Private (Admin Only)
 */
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['admin', 'member'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.role = role;
        await user.save();
        res.json({ message: `User role updated to ${role}.` });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin Only)
 */
const deleteUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Optional: Handle tasks assigned to the user. Here we'll un-assign them.
        await Task.updateMany(
            { assignedTo: user._id },
            { $pull: { assignedTo: user._id } }
        );

        await user.remove();
        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Get all projects for a specific user by ID
 * @route   GET /api/users/:userId/projects
 * @access  Private (Admin Only)
 */
const getUserProjects = async (req, res) => {
    try {
        const { userId } = req.params;
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Find all projects the user is involved in (by membership or task assignment)
        const [projectsByMembership, projectIdsByTask] = await Promise.all([
            Project.find({ members: userObjectId }).select('_id name'),
            Task.distinct('project', { assignedTo: userObjectId })
        ]);

        const projectMap = new Map();
        projectsByMembership.forEach(p => projectMap.set(p._id.toString(), { _id: p._id, name: p.name }));
        
        const allRelevantProjectIdsStrings = new Set([
            ...projectsByMembership.map(p => p._id.toString()),
            ...projectIdsByTask.map(id => id.toString())
        ]);
        const allRelevantProjectIds = Array.from(allRelevantProjectIdsStrings).map(id => new mongoose.Types.ObjectId(id));

        // Get the count of tasks assigned to THIS user for EACH of those projects
        const taskCounts = await Task.aggregate([
            { $match: { project: { $in: allRelevantProjectIds }, assignedTo: userObjectId } },
            { $group: { _id: '$project', count: { $sum: 1 } } }
        ]);
        
        const taskCountMap = new Map();
        taskCounts.forEach(item => taskCountMap.set(item._id.toString(), item.count));

        // Ensure we have the names for all projects
        const projectsToFetch = allRelevantProjectIds.filter(id => !projectMap.has(id.toString()));
        if (projectsToFetch.length > 0) {
            const extraProjects = await Project.find({ _id: { $in: projectsToFetch } }).select('_id name');
            extraProjects.forEach(p => projectMap.set(p._id.toString(), { _id: p._id, name: p.name }));
        }

        // Combine project info with task counts and sort by the most tasks
        const projectsWithCounts = Array.from(projectMap.values()).map(project => ({
            ...project,
            taskCount: taskCountMap.get(project._id.toString()) || 0
        })).sort((a, b) => b.taskCount - a.taskCount);

        res.json(projectsWithCounts);
    } catch (error) {
        console.error("Error getting projects for user:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports={getUsers,
    getUserById, 
    getManageUsers, 
    updateUserRole, 
    deleteUserById, 
    getUserProjects};