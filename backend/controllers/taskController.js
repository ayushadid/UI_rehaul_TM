const Task=require("../models/Task");
const TimeLog=require("../models/TimeLog");
const Project = require("../models/Project");
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require("../models/User");
// @desc Get active timer for a specific task and user
// @route GET /api/tasks/:taskId/timelogs/active
// @access Private (Assigned User or Admin)
// @desc Get active timer for a specific task and user
// @route GET /api/tasks/:taskId/timelogs/active
// @access Private (Assigned User or Admin)
const getActiveTimer = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        // Authorization: Only assigned users or admins can check active timers for this task
        const isAssigned = task.assignedTo.some(
            (id) => id.toString() === userId.toString()
        );
        const isAdmin = req.user.role === "admin";

        if (!isAssigned && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to view timer for this task." });
        }

        // Find an active time log for this user on this task
        const activeTimeLog = await TimeLog.findOne({
            task: taskId,
            user: userId,
            endTime: null, // Look for logs where endTime is not set
        }).populate('user', 'name profileImageUrl'); // Optionally populate user info for display

        res.status(200).json({ activeTimeLog });

    } catch (error) {
        console.error("Error getting active timer:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
// Helper function to add assignees to a project's members list
const addAssigneesToProjectMembers = async (projectId, assigneeIds) => {
    if (!projectId || !assigneeIds || assigneeIds.length === 0) return;

    try {
        const project = await Project.findById(projectId);
        if (!project) return;

        let membersModified = false;
        const memberIdsAsString = project.members.map(id => id.toString());

        assigneeIds.forEach(assigneeId => {
            if (!memberIdsAsString.includes(assigneeId.toString())) {
                project.members.push(assigneeId);
                membersModified = true;
            }
        });

        if (membersModified) {
            await project.save();
        }
    } catch (error) {
        console.error("Error auto-adding members to project:", error);
        // We don't throw an error here because the main task operation succeeded
    }
};
// Add this new function to taskController.js

/**
 * @desc    Allows an authorized user (admin, creator, reviewer) to directly update a task's status.
 * @route   PUT /api/tasks/:id/direct-status-update
 * @access  Private
 */
const directStatusUpdate = async (req, res) => {
    try {
        const { newStatus } = req.body; // e.g., "Pending Review", "Approved"
        const taskId = req.params.id;
        const user = req.user;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        // --- Permission Logic ---
        const isCreator = task.createdBy.toString() === user._id.toString();
        const isReviewer = task.reviewers.some(id => id.toString() === user._id.toString());
        const isAdmin = user.role === 'admin';

        let allowedStatuses = [];
        if (isAdmin || isCreator) {
            // Admins and Creators have full power, including final approval.
            allowedStatuses = ["Pending", "In Progress", "Pending Review", "Pending Final Approval", "Approved", "ChangesRequested"];
        } else if (isReviewer) {
            // Reviewers can do everything EXCEPT the final "Approved" status.
            allowedStatuses = ["Pending", "In Progress", "Pending Review", "Pending Final Approval", "ChangesRequested"];
        }

        if (!allowedStatuses.includes(newStatus)) {
            return res.status(403).json({ message: `Forbidden: You do not have permission to set this status to "${newStatus}".` });
        }

        // --- Status Mapping Logic ---
        // This translates the single "status" from the frontend into the correct DB state.
        switch (newStatus) {
            case "Pending":
                task.status = "Pending";
                task.reviewStatus = "NotSubmitted";
                break;
            case "In Progress":
                task.status = "In Progress";
                task.reviewStatus = "NotSubmitted";
                break;
            case "Pending Review":
                task.status = "Completed";
                task.reviewStatus = "PendingReview";
                break;
            case "Pending Final Approval":
                task.status = "Completed";
                task.reviewStatus = "PendingFinalApproval";
                break;
            case "Approved":
                task.status = "Completed";
                task.reviewStatus = "Approved";
                break;
            case "ChangesRequested":
                task.status = determineRevertedStatus(task); // Use our smart helper
                task.reviewStatus = "ChangesRequested";
                break;
            default:
                return res.status(400).json({ message: "Invalid status provided." });
        }

        const updatedTask = await task.save();
        res.json({ message: "Task status updated successfully.", task: updatedTask });

    } catch (error) {
        console.error("Error in direct status update:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const getUserBoardData = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Find all active timelogs for the current user to identify tasks with a running timer.
        const activeTimeLogs = await TimeLog.find({ user: userId, endTime: null }).select('task');
        const activeTaskIds = new Set(activeTimeLogs.map(log => log.task.toString()));

        // 2. Find all tasks assigned to the user, populating the project details.
        const userTasks = await Task.find({ assignedTo: userId })
            .populate('project', 'name')
            .sort({ createdAt: 1 });

        // 3. Group the tasks by project.
        const projectsMap = new Map();
        userTasks.forEach(task => {
            if (!task.project) return; // Skip tasks without a project

            const projectId = task.project._id.toString();
            
            // Add the dynamic flag for the timer status
            const taskWithTimerStatus = {
                ...task.toObject(),
                isTimerActiveForCurrentUser: activeTaskIds.has(task._id.toString())
            };
            
            if (!projectsMap.has(projectId)) {
                // If this is the first task for this project, initialize the project in our map
                projectsMap.set(projectId, {
                    _id: projectId,
                    name: task.project.name,
                    tasks: [taskWithTimerStatus]
                });
            } else {
                // Otherwise, just add the task to the existing project's task list
                projectsMap.get(projectId).tasks.push(taskWithTimerStatus);
            }
        });

        // 4. Convert the map to an array for the final response.
        const boardData = Array.from(projectsMap.values());

        res.json(boardData);

    } catch (error) {
        console.error("Error fetching user board data:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// @desc Get all time logs for a specific task
// @route GET /api/tasks/:taskId/timelogs
// @access Private (Assigned User or Admin to view)
const getTaskTimeLogs = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }


        // Find all time logs for this task, sorted by startTime (latest first)
        const timeLogs = await TimeLog.find({ task: taskId })
            .populate('user', 'name profileImageUrl') // Populate user who logged time
            .sort({ startTime: -1 }); // Sort by newest first

        // Calculate total duration
        const totalDurationMs = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

        res.status(200).json({
            timeLogs,
            totalDurationMs,
        });

    } catch (error) {
        console.error("Error getting task time logs:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc Start a timer for a task
// @route POST /api/tasks/:taskId/timelogs/start
// @access Private (Assigned User or Admin)
const startTimer = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id; // User ID from the authenticated token

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        // Authorization: Only assigned users or admins can start a timer for this task
        const isAssigned = task.assignedTo.some(
            (id) => id.toString() === userId.toString()
        );
        const isAdmin = req.user.role === "admin";

        if (!isAssigned && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to start a timer for this task." });
        }

        // Check if there's an existing active timer for this user on this task
        const activeTimeLog = await TimeLog.findOne({
            task: taskId,
            user: userId,
            endTime: null, // Look for logs where endTime is not set
        });

        if (activeTimeLog) {
            return res.status(400).json({ message: "You already have an active timer for this task. Please stop it first." });
        }

        // Create a new TimeLog entry
        const newTimeLog = await TimeLog.create({
            task: taskId,
            user: userId,
            startTime: Date.now(), // Set current time
        });

        res.status(201).json({
            message: "Timer started successfully.",
            timeLog: newTimeLog,
        });

    } catch (error) {
        console.error("Error starting timer:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc Stop a timer for a task
// @route PUT /api/tasks/:taskId/timelogs/:timeLogId/stop
// @access Private (User who started it or Admin)
const stopTimer = async (req, res) => {
    try {
        const { taskId, timeLogId } = req.params;
        const userId = req.user._id;

        // Find the specific time log entry
        const timeLog = await TimeLog.findById(timeLogId);

        if (!timeLog) {
            return res.status(404).json({ message: "Time log entry not found." });
        }

        // Ensure the time log belongs to the correct task
        if (timeLog.task.toString() !== taskId) {
            return res.status(400).json({ message: "Time log does not belong to the specified task." });
        }

        // Authorization: Only the user who started the timer or an admin can stop it
        const isOwner = timeLog.user.toString() === userId.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to stop this timer." });
        }

        // Check if the timer is already stopped
        if (timeLog.endTime !== null) {
            return res.status(400).json({ message: "Timer is already stopped." });
        }

        // Set endTime and calculate duration
        timeLog.endTime = Date.now();
        timeLog.duration = timeLog.endTime.getTime() - timeLog.startTime.getTime(); // Duration in milliseconds

        await timeLog.save();

        res.status(200).json({
            message: "Timer stopped successfully.",
            timeLog: timeLog,
        });

    } catch (error) {
        console.error("Error stopping timer:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


//@desc Get all tasks (Admin:ALL Users: assigned to them)
//@route GET /api/tasks/
//@access Private
// controllers/taskController.js
// Add this helper function above your getTasks function
// In taskController.js

const getSummaryCounts = async (filter, user) => { // Now requires the 'user' object
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const baseFilterForCounts = { ...filter };
    delete baseFilterForCounts.status;
    delete baseFilterForCounts.reviewStatus;
    delete baseFilterForCounts.dueDate;
    delete baseFilterForCounts.$or;

    // Standard counts
    const allTasks = await Task.countDocuments(baseFilterForCounts);
    const pendingTasks = await Task.countDocuments({ ...baseFilterForCounts, status: "Pending" });
    const inProgressTasks = await Task.countDocuments({ ...baseFilterForCounts, status: "In Progress" });
    const completedTasks = await Task.countDocuments({ ...baseFilterForCounts, status: "Completed" });
    const overdueTasks = await Task.countDocuments({ 
        ...baseFilterForCounts, 
        status: { $ne: 'Completed' }, 
        dueDate: { $lt: today } 
    });

    // New review system counts
    const pendingReviewTasks = await Task.countDocuments({ ...baseFilterForCounts, reviewStatus: "PendingReview" });
    const pendingFinalApprovalTasks = await Task.countDocuments({ ...baseFilterForCounts, reviewStatus: "PendingFinalApproval" });
    const changesRequestedTasks = await Task.countDocuments({ ...baseFilterForCounts, reviewStatus: "ChangesRequested" });
    const approvedTasks = await Task.countDocuments({ ...baseFilterForCounts, reviewStatus: "Approved" });

    // New intelligent, consolidated count for the current user
    const awaitingMyApprovalTasks = await Task.countDocuments({
        ...baseFilterForCounts,
        $or: [
            { reviewStatus: 'PendingReview', reviewers: user._id },
            { reviewStatus: 'PendingFinalApproval', createdBy: user._id }
        ]
    });

    return { 
        all: allTasks, pendingTasks, inProgressTasks, completedTasks, overdueTasks,
        pendingReviewTasks, pendingFinalApprovalTasks, changesRequestedTasks, approvedTasks,
        awaitingMyApprovalTasks // The new count for the user's action items
    };
};


// In taskController.js

const getTasks = async (req, res) => {
    try {
        const { 
            status, projectId, dueDate, createdDate, assignedUserId, sortBy 
        } = req.query;
        
        const isUserAdmin = req.user.role === "admin";
        
        let baseFilter = {};
        if (isUserAdmin) {
            if (assignedUserId && assignedUserId !== 'all') {
                baseFilter.assignedTo = new mongoose.Types.ObjectId(assignedUserId);
            }
        } else {
            baseFilter.assignedTo = req.user._id;
        }

        if (projectId && projectId !== 'all') {
            baseFilter.project = new mongoose.Types.ObjectId(projectId);
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const statusParam = status ? status.toLowerCase() : '';

        // --- Comprehensive Filter Logic ---
        if (statusParam === 'awaiting my approval') {
            baseFilter.$or = [
                { reviewStatus: 'PendingReview', reviewers: req.user._id },
                { reviewStatus: 'PendingFinalApproval', createdBy: req.user._id }
            ];
        } else if (statusParam === 'overdue') {
            baseFilter.status = { $ne: 'Completed' };
            baseFilter.dueDate = { $lt: today };
        } else if (statusParam === 'pending review') {
            baseFilter.reviewStatus = 'PendingReview';
        } else if (statusParam === 'pending final approval') {
            baseFilter.reviewStatus = 'PendingFinalApproval';
        } else if (statusParam === 'changes requested') {
            baseFilter.reviewStatus = 'ChangesRequested';
        } else if (statusParam === 'approved') {
            baseFilter.reviewStatus = 'Approved';
        } else if (status && status.toLowerCase() !== 'all') {
            baseFilter.status = new RegExp(`^${status}$`, 'i');
        }

        // Date filters are applied independently, unless it's an 'overdue' search
        if (dueDate && statusParam !== 'overdue') {
            const targetDueDate = new Date(dueDate);
            baseFilter.dueDate = { 
                $gte: new Date(targetDueDate.setHours(0, 0, 0, 0)), 
                $lte: new Date(targetDueDate.setHours(23, 59, 59, 999)) 
            };
        }
        if (createdDate) {
            const targetCreatedDate = new Date(createdDate);
            baseFilter.createdAt = { 
                $gte: new Date(targetCreatedDate.setHours(0, 0, 0, 0)), 
                $lte: new Date(targetCreatedDate.setHours(23, 59, 59, 999)) 
            };
        }

        let tasks = [];
        const populateOptions = [
            { path: "assignedTo", select: "name profileImageUrl" },
            { path: "project", select: "name" },
            { path: "createdBy", select: "name profileImageUrl" },
            { path: "reviewers", select: "name profileImageUrl" },
        ];

        if (sortBy === 'hours') {
            // Aggregation path preserved
            tasks = await Task.aggregate([
                { $match: baseFilter },
                { $lookup: { from: 'timelogs', localField: '_id', foreignField: 'task', as: 'timeLogs' }},
                { $addFields: { totalDuration: { $sum: "$timeLogs.duration" } }},
                { $sort: { totalDuration: -1, createdAt: -1 } },
                { $lookup: { from: 'users', localField: 'assignedTo', foreignField: '_id', as: 'assignedTo' } },
                { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'createdBy' } },
                { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
                { $lookup: { from: 'users', localField: 'reviewers', foreignField: '_id', as: 'reviewers' } },
                { $lookup: { from: 'projects', localField: 'project', foreignField: '_id', as: 'project' } },
                { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
            ]);
        } else {
            // Default .find().populate() path preserved
            tasks = await Task.find(baseFilter)
                .populate(populateOptions)
                .sort({ createdAt: -1 });
        }
        
        const processedTasks = tasks.map(task => {
            const taskObject = task.toObject ? task.toObject() : task;
            return taskObject;
        });
        
        let canUserReviewOrApprove = false;
        if (req.user.role === 'admin') {
            canUserReviewOrApprove = true;
        } else {
            // Check if the user is the creator or a reviewer on ANY task
            const isStakeholder = await Task.findOne({
                $or: [
                    { createdBy: req.user._id },
                    { reviewers: req.user._id }
                ]
            }).lean(); // .lean() makes the query faster
            
            if (isStakeholder) {
                canUserReviewOrApprove = true;
            }
        }
        // --- END: NEW PERMISSION LOGIC ---

        const statusSummary = await getSummaryCounts(baseFilter, req.user);

        res.json({
            tasks: processedTasks,
            statusSummary,
            canUserReviewOrApprove, // <-- Send the new flag to the frontend
        });

    } catch (error) {
        console.error(">>> FATAL ERROR in getTasks:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
// Add this new function to your module.exports
// @desc Get tasks for a specific user (Admin only)
// @route GET /api/tasks/user/:userId
// @access Private (Admin)
const getTasksForSpecificUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.query;

        let filter = { assignedTo: userId };
        if (status) {
            filter.status = status;
        }

        const populateOptions = [
            { path: "project", select: "name" }, // 👈 ADD THIS
            { path: "createdBy", select: "name" },
            { path: "assignedTo", select: "name email profileImageUrl" },
            { path: "remarks.madeBy", select: "name email profileImageUrl" }
        ];

        const tasks = await Task.find(filter).populate(populateOptions);

        // --- START CORRECTION FOR PROGRESS / POPULATED DATA ---
        const tasksWithCalculatedFields = await Promise.all(
            tasks.map(async (task) => {
                // Convert the Mongoose document to a plain JavaScript object first.
                // This ensures all populated fields and the 'progress' field are accessible.
                const taskObject = task.toObject(); // Use .toObject() or .toJSON()

                const completedCount = taskObject.todoChecklist.filter( // Use taskObject here
                    (item) => item.completed
                ).length;

                // Make sure `completedTodoCount` is consistent (fix typo here if desired)
                taskObject.completedTodoCount = completedCount; // Changed to correct spelling
                delete taskObject.compltedTodoCount; // Remove the old typo if it exists

                return taskObject;
            })
        );
        // --- END CORRECTION ---

        res.json({ tasks: tasksWithCalculatedFields }); // Use the new array name

    } catch (error) {
        console.error("Error in getTasksForSpecificUser:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc Add a remark to a task
// @route POST /api/tasks/:id/remarks
// @access Private (Admin Only)
const addRemarkToTask = async (req, res) => {
    try {
        const { text } = req.body;
        const taskId = req.params.id;

        // Basic validation
        if (!text) {
            return res.status(400).json({ message: "Remark text is required." });
        }

        // Find the task
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        // Authorization: Only admins can add remarks
        // The 'adminOnly' middleware will handle this, but an explicit check here is also good practice
        // if this function might be called without the middleware in other contexts.
        // For now, we'll rely on the middleware for the route.

        // Create the new remark object
        const newRemark = {
            text,
            madeBy: req.user._id, // The ID of the logged-in user (from 'protect' middleware)
            createdAt: new Date(), // Explicitly set creation time for the remark
        };

        task.remarks.push(newRemark); // Add the new remark to the array

        await task.save(); // Save the updated task document

        // Fetch the updated task and populate necessary fields for the response
        const updatedTask = await Task.findById(taskId).populate([
            { path: "assignedTo", select: "name email profileImageUrl" },
            { path: "remarks.madeBy", select: "name email profileImageUrl" } // Populate the user who made the remark
        ]);

        res.status(201).json({ message: "Remark added successfully", task: updatedTask });

    } catch (error) {
        console.error("Error adding remark to task:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


//@desc Get task by Id
//@route GET api/tasks/:id
//@access Private
// In your taskController.js file

const getTaskById = async (req, res) => {
    try {
        // The check for admin role is no longer needed to hide/show remarks
        // const isUserAdmin = req.user.role === "admin"; 

        // Always populate the remarks for any user viewing the task
        const populateOptions = [
            { path: "assignedTo", select: "name email profileImageUrl" },
            { path: "remarks.madeBy", select: "name email profileImageUrl" } ,
            { path: "project", select: "name" },// This is now always included
            { path: "comments.madeBy", select: "name" },
            { path: "dependencies", select: "title status" },
            { path: "createdBy", select: "name" },
            { path: "reviewers", select: "name" },
            { path: "revisionHistory.madeBy", select: "name" }
        ];

        /* // REMOVED: Conditional population
        if (isUserAdmin) {
            populateOptions.push({ path: "remarks.madeBy", select: "name email profileImageUrl" });
        }
        */

        const task = await Task.findById(req.params.id).populate(populateOptions);

        if (!task) {
            return res.status(404).json({ message: "Task not Found" });
        }

        const taskObject = task.toObject();

        /*
        // REMOVED: This block deleted remarks for non-admins
        if (!isUserAdmin) {
            delete taskObject.remarks;
        }
        */

        // Now, the full task object with remarks is sent to any user
        res.json(taskObject); 

    } catch (error) {
        console.error("Error in getTaskById:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ... (your other controller functions)

/**
 * @desc    Get all tasks for a specific month, formatted for the calendar view.
 * @route   GET /api/tasks/calendar
 * @access  Private
 */
const getTasksForCalendar = async (req, res) => {
    try {
        const { month, year, userId } = req.query;
        const isUserAdmin = req.user.role === 'admin';

        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required." });
        }

        // 1. Create the date range for the entire month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the month

        // 2. Build the database query filter
        const filter = {
            dueDate: { $gte: startDate, $lte: endDate }
        };

        // 3. Apply user-specific filtering for security
        if (isUserAdmin && userId && userId !== 'all') {
            // If an admin is filtering for a specific user
            filter.assignedTo = userId;
        } else if (!isUserAdmin) {
            // Regular users can only see their own tasks
            filter.assignedTo = req.user._id;
        }
        // If an admin selects "all users", no 'assignedTo' filter is added.

        const tasks = await Task.find(filter).select('title dueDate status');

        // 4. Format the data into the structure DayPilot expects
        const formattedEvents = tasks.map(task => ({
            id: task._id,
            text: task.title,
            start: task.dueDate, // The start of the event
            end: task.dueDate,   // The end of the event
            // Add some styling based on status
            backColor: task.status === 'Completed' ? '#a3e635' : // Green
                       task.status === 'In Progress' ? '#60a5fa' : // Blue
                       '#f87171' // Red for Pending/Overdue
        }));

        res.json(formattedEvents);

    } catch (error) {
        console.error("Error fetching tasks for calendar:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


//@desc Create a new task (admin only)
//@route POST /api/tasks/
//@access Private(admin)

// Make sure these are at the top of your controller file
// Make sure these models are imported at the top of your controller file


// Add 'web-push' to your imports at the top of the file
const webpush = require('web-push');

const createTask = async (req, res) => {
    try {
        const {
            project,
            title,
            description,
            priority,
            startDate,
            estimatedHours,
            dependencies,
            dueDate,
            assignedTo,
            attachments,
            todoChecklist,
            reviewers
        } = req.body;

        if (!project) {
            return res.status(400).json({ message: "Project ID is required" });
        }
        if (!Array.isArray(assignedTo)) {
            return res.status(400).json({ message: "AssignedTo must be an array of userIds" });
        }

        const taskData = {
            project,
            title,
            description,
            priority,
            startDate,
            estimatedHours,
            dueDate,
            assignedTo,
            createdBy: req.user._id,
            todoChecklist,
            attachments,
            dependencies: dependencies ? dependencies.map(dep => dep.value) : [],
            reviewers
        };

        if (taskData.assignedTo && taskData.assignedTo.length > 0 && (!taskData.reviewers || taskData.reviewers.length === 0)) {
            taskData.reviewers = [req.user._id];
        }

        const task = await Task.create(taskData);
        await addAssigneesToProjectMembers(task.project, task.assignedTo);
        
        const { io, userSocketMap } = req;

        if (assignedTo && assignedTo.length > 0) {
            // Fetch the full user objects to get their email and push subscription
            const assignedUsers = await User.find({ '_id': { $in: assignedTo } });
            
            for (const user of assignedUsers) {
                // 1. Save Database Notification
                const newNotification = await Notification.create({
                    recipient: user._id,
                    sender: req.user._id,
                    message: `${req.user.name} assigned you a new task: "${title}"`,
                    link: `/user/task-details/${task._id}`,
                });
                
                // 2. Send Real-time Socket.IO Notification
                const populatedNotification = await Notification.findById(newNotification._id).populate('sender', 'name profileImageUrl');
                const socketId = userSocketMap[user._id.toString()];
                if (socketId) {
                    io.to(socketId).emit("notification", populatedNotification);
                }

                // --- START: Appended Push Notification Logic ---
                // 3. Send Web Push Notification (if user is subscribed)
                if (user.pushSubscription) {
                    const payload = JSON.stringify({
                        title: `New Task: ${title}`,
                        body: `${req.user.name} assigned a new task to you.`,
                        link: `/user/task-details/${task._id}`
                    });
                    
                    // This sends the notification to the browser's push service
                    webpush.sendNotification(user.pushSubscription, payload)
                        .catch(err => console.error(`Error sending push notification to ${user.name}:`, err.statusCode));
                }
                // --- END: Appended Push Notification Logic ---
            }
        }
        
        
        res.status(201).json({ message: "Task Created Successfully", task });

    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Server Error ", error: error.message });
    }
};
//@desc Update Task Details
//@route PUT /api/tasks/:id
//@access PRIVATE
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });
        
        if (!canUserUpdateTaskDetails(task, req.user)) {
        return res.status(403).json({ message: "Forbidden: You are not authorized to edit this task's details." });
    }
        // 3. FIXED: Sanitize the incoming checklist to prevent crashes
        if (req.body.todoChecklist) {
            req.body.todoChecklist = req.body.todoChecklist.map(item => {
                if (item._id && !mongoose.Types.ObjectId.isValid(item._id)) {
                    // This is a new item with a temporary ID, remove it
                    return { text: item.text, completed: item.completed };
                }
                return item;
            });
        }

        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
        task.attachments = req.body.attachments || task.attachments;
        task.project = req.body.project || task.project;
        task.reviewers=
        task.startDate = req.body.startDate || task.startDate;
        task.estimatedHours = req.body.estimatedHours || task.estimatedHours;
        
        if (req.body.assignedTo) {
            if (!Array.isArray(req.body.assignedTo)) {
                return res.status(400).json({ message: "assignedTo must be an array" });
            }
            task.assignedTo = req.body.assignedTo;
        }

        if (req.body.reviewers !== undefined) {
            if (!Array.isArray(req.body.reviewers)) {
                return res.status(400).json({ message: "reviewers must be an array" });
            }
            task.reviewers = req.body.reviewers;
        }
        if (req.body.dependencies !== undefined) {
            // If it exists, we map the array from {value, label} to just the ID.
            task.dependencies = req.body.dependencies.map(dep => dep.value);
        }

        const updatedTask = await task.save();
        await addAssigneesToProjectMembers(updatedTask.project, updatedTask.assignedTo); // 👈 ADD THIS LINE
        await updatedTask.populate({ path: "project", select: "name" });
        res.json({ message: "Task updated successfully", updatedTask });
    } catch (error) {
        console.error("Error in updateTask:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


//@desc delete a task (admin only)
//@route DELETE /api/tasks/:id
//@access PRIVATE (admin)

const deleteTask=async(req,res)=>{
try{
    const task=await Task.findById(req.params.id);
    if(!task) return res.status(404).json({message:"Task not found"});

    await task.deleteOne();
    res.json({message:"Task deleted Successfully"});
    }catch(error){
        res.status(500).json({message:"Server Error ",error:error.message});
    }
}

//@desc Update task status 
//@route PUT /api/tasks/:id/status
//@access PRIVATE 
const updateTaskStatus=async(req,res)=>{
try{
    
    const task = await Task.findById(req.params.id).populate('dependencies', 'status title'); // 👈 Populate dependencies    if(!task) return res.status(404).json({message:"Task not found"});
    const isAssigned=task.assignedTo.some(
        (userId)=>userId.toString()===req.user._id.toString()
    );

    if(!isAssigned && req.user.role !=="admin"){
        return res.status(403).json({message:"Not authorized"});
    }

    if (req.body.status === "In Progress" && task.dependencies.length > 0) {
            const incompleteDependencies = task.dependencies.filter(
                dep => dep.status !== "Completed"
            );

            if (incompleteDependencies.length > 0) {
                // If any dependency is not complete, block the action and send an error.
                const blockerTitles = incompleteDependencies.map(t => t.title).join(', ');
                return res.status(400).json({ 
                    message: `Cannot start this task. It is blocked by: ${blockerTitles}` 
                });
            }
        }

    task.status =req.body.status||task.status;

    if(task.status==="Completed"){
        task.todoChecklist.forEach((item)=>(item.completed=true));
        task.progress=100;
    }
    await task.save();
    res.json({message:"Task status updated",task})

    }catch(error){
        res.status(500).json({message:"Server Error ",error:error.message});
    }
}

//@desc update task checklist
//@route PUT /api/tasks/:id/todo
//@access PRIVATE
const updateTaskChecklist = async (req, res) => {
    try {
        
        let { todoChecklist } = req.body;
        const task = await Task.findById(req.params.id).populate('dependencies', 'status title');

        if (!task) return res.status(404).json({ message: "Task not Found" });
        if (!canUserUpdateChecklist(task, req.user)) {
        return res.status(403).json({ message: "Forbidden: You are not authorized to update this checklist." });
    }
        // Authorization check
        const isAssigned = task.assignedTo.some(id => id.toString() === req.user._id.toString());
        if (!isAssigned && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorised to update the checklist" });
        }

        // 3. FIXED: Sanitize the incoming checklist to prevent crashes
        if (todoChecklist) {
            todoChecklist = todoChecklist.map(item => {
                if (item._id && !mongoose.Types.ObjectId.isValid(item._id)) {
                    return { text: item.text, completed: item.completed };
                }
                return item;
            });
        }
        
        task.todoChecklist = todoChecklist;

        // Progress calculation
        const completedCount = todoChecklist.filter((item) => item.completed).length;
        const totalItems = todoChecklist.length;
        const newProgress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

        let newStatus = "Pending";
        if (newProgress === 100) {
            newStatus = "Completed";
        } else if (newProgress > 0) {
            newStatus = "In Progress";
        }

        // 3. Add the dependency check BEFORE changing the status
        // This check runs if the task is about to be moved to "In Progress" or "Completed"
        if ((newStatus === "In Progress" || newStatus === "Completed") && task.dependencies.length > 0) {
            const incompleteDependencies = task.dependencies.filter(
                dep => dep.status !== "Completed"
            );

            if (incompleteDependencies.length > 0) {
                const blockerTitles = incompleteDependencies.map(t => t.title).join(', ');
                // IMPORTANT: We send an error and do NOT save the changes.
                return res.status(400).json({
                    message: `Cannot update this task. It is blocked by: ${blockerTitles}`
                });
            }
        }

        // 4. If the check passes, update the task
        task.todoChecklist = todoChecklist;
        task.progress = newProgress;
        task.status = newStatus;

        await task.save();


        const updatedTask = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email profileImageUrl')
            .populate('project', 'name')
            .populate('remarks.madeBy', 'name email profileImageUrl')
            .populate('createdBy', 'name')
            .populate('reviewers','name')
            .populate('comments.madeBy', 'name profileImageUrl'); // 👈 ADD THIS LINE


        res.json({ message: "Task checklist updated", task: updatedTask });

    } catch (error) {
        console.error("Error in updateTaskChecklist:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

//@desc Dashboard data (admin only)
//@route GET /api/tasks/dashbaord-data
//@access PRIVATE

const getDashboardData = async (req, res) => {
    try {
        const { projectId } = req.query;

        // 1. Create a reusable base filter for all queries
        const baseFilter = {};
        if (projectId) {
            baseFilter.project = new mongoose.Types.ObjectId(projectId);
        }
        // Secure the data: Non-admins only see stats for their own tasks
        if (req.user.role !== 'admin') {
            baseFilter.assignedTo = req.user._id;
        }

        // 2. Use a single powerful aggregation to get most stats at once
        const mainStatsPromise = Task.aggregate([
            { $match: baseFilter },
            {
                $facet: {
                    // Facet 1: Calculate task distribution by status
                    taskDistribution: [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ],
                    // Facet 2: Calculate task distribution by priority
                    taskPriorityLevels: [
                        { $group: { _id: "$priority", count: { $sum: 1 } } }
                    ],
                    // Facet 3: Calculate overdue tasks
                    overdueTasks: [
                        { $match: { dueDate: { $lt: new Date() }, status: { $ne: "Completed" } } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        // 3. Get the 10 most recent tasks using the same filter
        const recentTasksPromise = Task.find(baseFilter)
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('project', 'name')
            .populate('assignedTo', 'name');

        // 4. Calculate total hours worked
        const calculateTotalHours = async () => {
            const relevantTasks = await Task.find(baseFilter).select('_id');
            const taskIds = relevantTasks.map(t => t._id);
            if (taskIds.length === 0) return 0;

            const timeLogStats = await TimeLog.aggregate([
                { $match: { task: { $in: taskIds } } },
                { $group: { _id: null, totalMilliseconds: { $sum: "$duration" } } }
            ]);
            if (timeLogStats.length === 0) return 0;
            return timeLogStats[0].totalMilliseconds / (1000 * 60 * 60);
        };
        const totalHoursPromise = calculateTotalHours();

        // Run all promises in parallel
        const [mainResults, recentTasks, totalHours] = await Promise.all([
            mainStatsPromise,
            recentTasksPromise,
            totalHoursPromise
        ]);
        
        // 5. Format the results into the exact structure your frontend expects
        const formatResults = (dataArray) => {
            const result = {};
            dataArray.forEach(item => {
                const key = item._id.replace(/\s+/g, ''); // "In Progress" -> "InProgress"
                result[key] = item.count;
            });
            return result;
        };

        const taskDistribution = formatResults(mainResults[0].taskDistribution);
        const taskPriorityLevels = formatResults(mainResults[0].taskPriorityLevels);
        
        const totalTasks = mainResults[0].taskDistribution.reduce((sum, item) => sum + item.count, 0);
        taskDistribution["All"] = totalTasks;

        const statistics = {
            totalTasks: totalTasks,
            pendingTasks: taskDistribution.Pending || 0,
            completedTasks: taskDistribution.Completed || 0,
            inProgressTasks: taskDistribution.InProgress || 0, // Added this for consistency
            overdueTasks: mainResults[0].overdueTasks[0]?.count || 0,
        };

        res.status(200).json({
            statistics,
            charts: {
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
            totalHours: totalHours.toFixed(2), // Add the new total hours stat
        });

    } catch (error) {
        console.error("Dashboard data fetching error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

//@desc Dashboard data (UserSpecific)
//@route GET /api/tasks/user-dashbaord-data
//@access PRIVATE
const getUserDashboardData=async(req,res)=>{
try{
    const userId=req.user._id; //only fetch data for logged in user

    //Fetch satistics for user specific tasks
    const totalTasks=await Task.countDocuments({assignedTo:userId});
    const pendingTasks=await Task.countDocuments({assignedTo:userId,status:"Pending"});
    const completedTasks=await Task.countDocuments({assignedTo:userId,status:"Completed"});
    const overdueTasks=await Task.countDocuments({
        assignedTo:userId,
        status:{$ne:"Completed"},
        dueDate:{$lt:new Date()},
    });

    //Task Distribution by Status 
    const taskStatuses=["Pending","In Progress","Completed"];
    const taskDistributionRaw=await Task.aggregate([
        {$match:{assignedTo:userId}},
        {$group:{_id:"$status",count:{$sum:1}}},
    ]);

    const taskDistribution=taskStatuses.reduce((acc,status)=>{
        const formattedKey=status.replace(/\s+/g,"");
        acc[formattedKey]=
            taskDistributionRaw.find((item)=>item._id===status)?.count||0;
        return acc;
    },{});
    taskDistribution["All"]=totalTasks;

    //Task Distribution by Priority
    const taskPriorities=["Low","Medium","High"];
    const taskPriorityLevelsRaw=await Task.aggregate([
        {$match:{assignedTo:userId}},
        {$group:{_id:"$priority",count:{$sum:1}}},
    ]);

    const taskPriorityLevels=taskPriorities.reduce((acc,priority)=>{
        acc[priority]=
            taskPriorityLevelsRaw.find((item)=>item._id===priority)?.count||0;
        return acc;
    },{});

    //Fetch recent 10 tasks
    const recentTasks=await Task.find({assignedTo:userId})
        .sort({createdAt:-1})
        .limit(10)
        .select("title status priority dueDate createdAt");

    res.status(200).json({
        statistics:{
            totalTasks,
            pendingTasks,
            completedTasks,
            overdueTasks,
        },
        charts:{
            taskDistribution,
            taskPriorityLevels,
        },
        recentTasks,
    });
    }catch(error){
        res.status(500).json({message:"Server Error ",error:error.message});
    }
}

/**
 * @desc    Add a comment to a task
 * @route   POST /api/tasks/:id/comments
 * @access  Private (Assigned User or Admin)
 */
const addCommentToTask = async (req, res) => {
    try {
        const { text } = req.body;
        const taskId = req.params.id;
        const currentUser = req.user; // Get the full user object of the commenter

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: "Comment text cannot be empty." });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        const isAdmin = currentUser.role === 'admin';
        const isAssigned = task.assignedTo.some(id => id.toString() === currentUser._id.toString());

        if (!isAdmin && !isAssigned) {
            return res.status(403).json({ message: "Not authorized to comment on this task." });
        }

        const newComment = {
            text: text,
            madeBy: currentUser._id,
        };

        task.comments.push(newComment);
        await task.save();

        // --- START: Corrected Real-Time Logic ---
        const { io, userSocketMap } = req;

        // 1. Get the newly created comment and populate its author's details
        const populatedComment = task.comments[task.comments.length - 1];
        await Task.populate(populatedComment, { path: 'madeBy', select: 'name profileImageUrl' });

        // 2. Get all admins from the database
        const admins = await User.find({ role: 'admin' }).select('_id');
        const adminIds = admins.map(admin => admin._id.toString());
        
        // 3. Get all users assigned to the task
        const assignedUserIds = task.assignedTo.map(id => id.toString());

        // 4. Combine the lists and remove duplicates to create a final list of recipients
        const recipientIds = new Set([...adminIds, ...assignedUserIds]);

        // 5. Emit the event to every recipient EXCEPT the one who sent the comment
        recipientIds.forEach(userId => {
            if (userId !== currentUser._id.toString()) {
                const socketId = userSocketMap[userId];
                if (socketId) {
                    io.to(socketId).emit('new_comment', { 
                        taskId: taskId,
                        comment: populatedComment 
                    });
                }
            }
        });
        // --- END: Corrected Real-Time Logic ---

        // Return the full task to the original sender
        const populatedTask = await Task.findById(taskId).populate('comments.madeBy', 'name profileImageUrl');
        res.status(201).json(populatedTask);

    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Allows an assigned user to submit a completed task for review.
 * @route   PUT /api/tasks/:id/submit-review
 * @access  Private (User must be assigned to the task)
 */
const submitForReview = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user._id;

        const task = await Task.findById(taskId);

        // 1. Check if the task exists
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        // 2. Security Check: Ensure the logged-in user is assigned to this task.
        const isUserAssigned = task.assignedTo.some(assigneeId => assigneeId.toString() === userId.toString());
        
        if (!isUserAssigned) {
            return res.status(403).json({ message: "Forbidden: You are not assigned to this task." });
        }

        // 3. State Check: Ensure the task is in a state where it can be submitted.
        if (task.reviewStatus !== 'NotSubmitted' && task.reviewStatus !== 'ChangesRequested') {
            return res.status(400).json({ message: `Cannot submit task with current review status: ${task.reviewStatus}` });
        }
        
        // 4. Update the task statuses
        task.status = 'Completed'; // The assignee's portion of the work is done.
        task.reviewStatus = 'PendingReview'; // The task is now awaiting action from the reviewers.

        const updatedTask = await task.save();
        
        // You can add a notification to the reviewers here if you'd like

        res.json({ message: "Task submitted for review successfully.", task: updatedTask });

    } catch (error) {
        console.error("Error submitting task for review:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// Helper function to determine the correct reverted status
const determineRevertedStatus = (task) => {
    // Check if any item in the checklist is marked as completed
    const hasProgress = task.todoChecklist.some(item => item.completed);
    return hasProgress ? 'In Progress' : 'Pending';
};


/**
 * @desc    Allows a reviewer to process a task that is pending review.
 * @route   PUT /api/tasks/:id/process-review
 * @access  Private (User must be a reviewer for the task)
 */
const processReview = async (req, res) => {
    try {
        const { decision, reviewComment } = req.body;
        const taskId = req.params.id;
        const userId = req.user._id;

        // 1. Validate input (Unchanged)
        if (!decision || !['Approved', 'ChangesRequested'].includes(decision)) {
            return res.status(400).json({ message: "A valid 'decision' is required ('Approved' or 'ChangesRequested')." });
        }
        if (decision === 'ChangesRequested' && !reviewComment) {
            return res.status(400).json({ message: "A 'reviewComment' is required when requesting changes." });
        }

        const task = await Task.findById(taskId);

        // 2. Check if the task exists (Unchanged)
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        // 3. Security Check: Ensure the user is in the reviewers list (Unchanged)
        const isUserAReviewer = task.reviewers.some(reviewerId => reviewerId.toString() === userId.toString());
        if (!isUserAReviewer) {
            return res.status(403).json({ message: "Forbidden: You are not a reviewer for this task." });
        }

        // --- START: MODIFIED LOGIC ---
        // This section replaces the old state check and decision logic.
        if (decision === 'Approved') {
            // Prevent re-approving a task that is already fully approved.
            if (task.reviewStatus === 'Approved') {
                return res.status(400).json({ message: "Task has already been fully approved." });
            }

            // Smart approval logic: if the reviewer is also the creator, approve completely.
            if (task.createdBy.toString() === userId.toString()) {
                task.reviewStatus = 'Approved';
            } else {
                task.reviewStatus = 'PendingFinalApproval';
            }
        } else { // 'ChangesRequested'
            // This logic now allows a reviewer to request changes at almost any stage.
            task.status = determineRevertedStatus(task);
            
            if (task.reviewStatus !== 'ChangesRequested') {
                task.revisionCount += 1;
                task.revisionHistory.push({
                    comment: reviewComment,
                    madeBy: userId
                });
            }
            task.reviewStatus = 'ChangesRequested';
        }
        // --- END: MODIFIED LOGIC ---

        const updatedTask = await task.save();

        res.json({ message: `Review processed: ${decision}`, task: updatedTask });

    } catch (error) {
        console.error("Error processing review:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Allows the task creator to give final approval or request changes.
 * @route   PUT /api/tasks/:id/final-approval
 * @access  Private (User must be the creator of the task)
 */
const finalApproveTask = async (req, res) => {
    try {
        const { decision, reviewComment } = req.body;
        const taskId = req.params.id;
        const userId = req.user._id;

        // 1. Validate input (Unchanged)
        if (!decision || !['Approved', 'ChangesRequested'].includes(decision)) {
            return res.status(400).json({ message: "A valid 'decision' is required ('Approved' or 'ChangesRequested')." });
        }
        if (decision === 'ChangesRequested' && !reviewComment) {
            return res.status(400).json({ message: "A 'reviewComment' is required when requesting changes." });
        }

        const task = await Task.findById(taskId);

        // 2. Check if the task exists (Unchanged)
        if (!task) {
            return res.status(404).json({ message: "Task not found." });
        }

        // 3. Security Check: Ensure the user is the original creator of the task. (Unchanged)
        if (task.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Forbidden: You are not the creator of this task." });
        }

        // --- START: MODIFIED LOGIC ---
        // The rigid state check has been replaced with more flexible logic.

        if (decision === 'Approved') {
            // Prevent re-approving a task that is already approved.
            if (task.reviewStatus === 'Approved') {
                return res.status(400).json({ message: "Task is already approved." });
            }
            task.reviewStatus = 'Approved'; // The task is now officially done.

        } else { // 'ChangesRequested'
            // This now allows the creator to reopen a task at any stage, even if it was already approved.
            task.status = determineRevertedStatus(task); // Intelligently revert status

            // Only increment revision count if it's a new request for changes.
            if (task.reviewStatus !== 'ChangesRequested') {
                task.revisionCount += 1;
                task.revisionHistory.push({
                    comment: reviewComment,
                    madeBy: userId
                });
            }
            task.reviewStatus = 'ChangesRequested';
        }
        // --- END: MODIFIED LOGIC ---

        const updatedTask = await task.save();

        res.json({ message: `Final approval processed: ${decision}`, task: updatedTask });

    } catch (error) {
        console.error("Error in final approval:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// HELPER 1: Stricter check for editing core task details.
// Only allows the creator, reviewers, or an admin.
const canUserUpdateTaskDetails = (task, user) => {
    const userId = user._id.toString();
    if (user.role === 'admin') return true;
    if (task.createdBy.toString() === userId) return true;
    if (task.reviewers.some(reviewerId => reviewerId.toString() === userId)) return true;
    return false;
};

// HELPER 2: Broader check for updating just the checklist.
// Allows the creator, reviewers, OR an assignee.
const canUserUpdateChecklist = (task, user) => {
    const userId = user._id.toString();
    if (user.role === 'admin') return true;
    if (task.createdBy.toString() === userId) return true;
    if (task.reviewers.some(reviewerId => reviewerId.toString() === userId)) return true;
    if (task.assignedTo.some(assigneeId => assigneeId.toString() === userId)) return true;
    return false;
};

// Add this new function inside backend/controllers/taskController.js

const getAdminBoardData = async (req, res) => {
    try {
        // Find all tasks, not just those assigned to the current user
        const allTasks = await Task.find({})
            .populate('project', 'name')
            .populate('assignedTo', 'name profileImageUrl') // Also populate assignedTo
            .sort({ 'project.name': 1, createdAt: 1 });

        const projectsMap = new Map();

        allTasks.forEach(task => {
            if (!task.project) return;

            const projectId = task.project._id.toString();
            
            if (!projectsMap.has(projectId)) {
                projectsMap.set(projectId, {
                    _id: projectId,
                    name: task.project.name,
                    tasks: [],
                });
            }
            
            // We still want to check for active timers for the task cards
            // This is a simplified check; a more robust solution might check all active logs
            const taskWithTimerStatus = {
                ...task.toObject(),
                isTimerActiveForCurrentUser: false // Default for admin view, can be enhanced later
            };

            projectsMap.get(projectId).tasks.push(taskWithTimerStatus);
        });

        const boardData = Array.from(projectsMap.values());
        res.json(boardData);

    } catch (error) {
        console.error("Error fetching admin board data:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports={
    getTasks,
    getTasksForSpecificUser,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getDashboardData,
    getUserDashboardData,
    addRemarkToTask,
    startTimer,
    stopTimer,
    getActiveTimer,
    getTaskTimeLogs,
    getUserBoardData,
    addCommentToTask,
    submitForReview,
    processReview,
    finalApproveTask,
    directStatusUpdate,
    getTasksForCalendar,
    getAdminBoardData
};