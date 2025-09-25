const TimeLog = require("../models/TimeLog");
const Task = require('../models/Task');
/**
 * @desc    Get all time logs for a user on a specific day
 * @route   GET /api/timelogs/day/:userId
 * @access  Private
 */
const getTimeLogsByDay = async (req, res) => {
  try {
    const { date } = req.query;
    const { userId } = req.params;

    // Authorization: An admin can see anyone's logs. A user can only see their own.
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: "Not authorized to view these time logs." });
    }
    
    if (!date) {
      return res.status(400).json({ message: "A date is required." });
    }

    // Create start and end of day using native Date
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const timeLogs = await TimeLog.find({
      user: userId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      endTime: { $ne: null }, // Only get completed time logs
    }).populate("task", "title");

    res.status(200).json(timeLogs);
  } catch (error) {
    console.error("Error fetching time logs by day:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
// In backend/controllers/timelogController.js

// ... your existing getTimeLogsByDay function is here ...

/**
 * @desc    Get ALL time logs for ALL users on a specific day
 * @route   GET /api/timelogs/all-by-day
 * @access  Private (Admin Only)
 */
const getAllTimeLogsByDay = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "A date is required." });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const timeLogs = await TimeLog.find({
      startTime: { $gte: startOfDay, $lte: endOfDay },
      endTime: { $ne: null },
    })
    .sort({ user: 1, startTime: 1 }) // Sort by user, then by start time
    .populate("task", "title")
    .populate("user", "name"); // Also populate the user's name

    res.status(200).json(timeLogs);
  } catch (error) {
    console.error("Error fetching all time logs by day:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


/**
 * @desc    Get all currently active time logs
 * @route   GET /api/timelogs/active
 * @access  Private (Admin Only)
 */
// In backend/controllers/timelogController.js

const getActiveTimelogs = async (req, res) => {
  try {
    const activeLogs = await TimeLog.find({ endTime: null })
      .populate({
          path: 'task',
          populate: [
             { path: 'project', select: 'name' },
             { path: 'assignedTo', select: 'name email profileImageUrl' }
          ]
       })
      .populate("user", "name");

    // 👇 ADD THIS PROCESSING BLOCK 👇
    // Manually calculate completedTodoCount for each task
    const processedLogs = activeLogs.map(log => {
        const logObject = log.toObject(); // Convert to a plain object to modify it
        if (logObject.task && logObject.task.todoChecklist) {
            const completedCount = logObject.task.todoChecklist.filter(
                (item) => item.completed
            ).length;
            logObject.task.completedTodoCount = completedCount;
        }
        return logObject;
    });
    // --- END OF NEW BLOCK ---

    res.status(200).json(processedLogs); // 👈 Send the processed logs

  } catch (error) {
    console.error("Error fetching active time logs:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get a summary of total work hours, optionally filtered by project.
 * @route   GET /api/timelogs/summary/work-hours
 * @access  Private/Admin
 */
const getWorkHoursSummary = async (req, res) => {
    try {
        const { projectId } = req.query;
        let totalMilliseconds = 0;

        const pipeline = [
            {
                $group: {
                    _id: null,
                    totalDuration: { $sum: "$duration" }
                }
            }
        ];

        if (projectId) {
            // If a project is specified, find all tasks in that project
            const tasksInProject = await Task.find({ project: projectId }).select('_id');
            const taskIds = tasksInProject.map(task => task._id);

            // Add a $match stage to the start of the pipeline to filter timelogs
            pipeline.unshift({
                $match: {
                    task: { $in: taskIds }
                }
            });
        }
        
        const result = await TimeLog.aggregate(pipeline);

        if (result.length > 0) {
            totalMilliseconds = result[0].totalDuration;
        }

        const totalHours = totalMilliseconds / (1000 * 60 * 60);

        res.json({
            totalHours: totalHours.toFixed(2),
            projectId: projectId || 'all',
        });

    } catch (error) {
        console.error("Work Hours Summary Error:", error);
        res.status(500).json({ message: "Server error while calculating work hours." });
    }
};

module.exports = {
  getTimeLogsByDay,
  getAllTimeLogsByDay,
  getActiveTimelogs,
  getWorkHoursSummary, // 👈 Add the new function to exports
};