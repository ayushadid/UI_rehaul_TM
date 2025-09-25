const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the AI model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

/**
 * @desc    Get a dynamic performance evaluation for a specific user
 * @route   GET /api/performance/evaluate/:userId
 * @access  Private/Admin
 */
const getUserPerformance = async (req, res) => {
    try {
        const { userId } = req.params;
        const { periodDays = 30 } = req.query; // Default to a 30-day period

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(periodDays));
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // --- Step 1: Define Aggregation Logic ---

        // This is the group stage for calculating task-based metrics.
        // It will be used for both the individual user and the whole team.
        const taskAggregationGroup = {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
            completedOnTime: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "Completed"] }, { $lte: ["$updatedAt", "$dueDate"] }] }, 1, 0] } },
            overdueTasks: { $sum: { $cond: [{ $and: [{ $ne: ["$status", "Completed"] }, { $lt: ["$dueDate", new Date()] }] }, 1, 0] } },
            totalPriorityPoints: {
                $sum: {
                    $cond: [
                        { $eq: ["$status", "Completed"] },
                        { $switch: {
                            branches: [
                                { case: { $eq: ["$priority", "High"] }, then: 5 },
                                { case: { $eq: ["$priority", "Medium"] }, then: 3 },
                                { case: { $eq: ["$priority", "Low"] }, then: 1 }
                            ],
                            default: 0
                        }},
                        0
                    ]
                }
            }
        };

        // --- Step 2: Run All Database Queries in Parallel ---

        // Query 1: Get the individual user's task stats
        const userTaskStatsPromise = Task.aggregate([
            { $match: { assignedTo: userObjectId, createdAt: { $gte: startDate } } },
            { $group: taskAggregationGroup }
        ]);

        // Query 2: Get the individual user's time stats
        const userTimeStatsPromise = TimeLog.aggregate([
            { $match: { user: userObjectId, startTime: { $gte: startDate } } },
            { $group: { _id: null, totalMillisecondsLogged: { $sum: "$duration" } } }
        ]);

        // Query 3: Get team-wide task stats for benchmarking
        const teamTaskStatsPromise = Task.aggregate([
            { $match: { createdAt: { $gte: startDate } } }, // All tasks in the period
            { $group: { _id: null, totalPriorityPoints: taskAggregationGroup.totalPriorityPoints } } // Only need priority points for the team
        ]);

        // Query 4: Get team-wide time stats for benchmarking
        const teamTimeStatsPromise = TimeLog.aggregate([
            { $match: { startTime: { $gte: startDate } } }, // All timelogs in the period
            { $group: { _id: null, totalMillisecondsLogged: { $sum: "$duration" } } }
        ]);
        
        // Await all promises to resolve
        const [
            userTaskResults,
            userTimeResults,
            teamTaskResults,
            teamTimeResults
        ] = await Promise.all([userTaskStatsPromise, userTimeStatsPromise, teamTaskStatsPromise, teamTimeStatsPromise]);

        if (userTaskResults.length === 0) {
            return res.json({ score: 0, remark: `No task data available for this user in the last ${periodDays} days.`, metrics: {} });
        }

        // --- Step 3: Combine Query Results and Calculate Dynamic Scores ---

        const userTaskMetrics = userTaskResults[0];
        const userTimeMetrics = userTimeResults[0] || { totalMillisecondsLogged: 0 };
        const userTotalHours = userTimeMetrics.totalMillisecondsLogged / (1000 * 60 * 60);

        const teamTaskMetrics = teamTaskResults[0] || { totalPriorityPoints: 0 };
        const teamTimeMetrics = teamTimeResults[0] || { totalMillisecondsLogged: 0 };
        const teamTotalHours = teamTimeMetrics.totalMillisecondsLogged / (1000 * 60 * 60);
        
        // Productivity Score (based on their own assigned workload)
        const completionRate = (userTaskMetrics.completedTasks / userTaskMetrics.totalTasks) || 0;
        const productivityScore = completionRate * 40;

        // Quality Score (based on their own completed work)
        const onTimeRate = (userTaskMetrics.completedOnTime / userTaskMetrics.completedTasks) || 0;
        const qualityScore = onTimeRate * 40;

        // Efficiency Score (compared to the team average)
        const userValuePerHour = userTotalHours > 0 ? userTaskMetrics.totalPriorityPoints / userTotalHours : 0;
        const teamAverageValuePerHour = teamTotalHours > 0 ? teamTaskMetrics.totalPriorityPoints / teamTotalHours : 1; // Default to 1 to avoid division by zero
        const efficiencyScore = Math.min((userValuePerHour / teamAverageValuePerHour) * 10, 20); // Centered at 10 points, capped at 20

        // Penalty for currently overdue tasks
        const overduePenalty = Math.min(userTaskMetrics.overdueTasks * 5, 20);

        let finalScore = productivityScore + qualityScore + efficiencyScore - overduePenalty;
        finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

        // --- Step 4: Generate Enhanced AI Remark with Dynamic Context ---
        const prompt = `
            You are a performance analyst writing a concise, professional evaluation remark.
            Here are the metrics for an employee over the last ${periodDays} days:
            - Task Completion Rate: ${Math.round(completionRate * 100)}% (${userTaskMetrics.completedTasks}/${userTaskMetrics.totalTasks} tasks)
            - On-Time Completion Rate: ${Math.round(onTimeRate * 100)}%
            - User's Efficiency (Value/Hour): ${userValuePerHour.toFixed(2)}
            - Team's Average Efficiency (Value/Hour): ${teamAverageValuePerHour.toFixed(2)}
            - Currently Overdue Tasks: ${userTaskMetrics.overdueTasks}
            The final calculated performance score is ${finalScore}%.
            Based on these numbers, write a 2-3 sentence summary. Start with a clear statement of performance. Compare their efficiency to the team average. Mention their key strength (e.g., high completion rate) and a clear area for improvement (e.g., on-time delivery).
        `;

        const result = await model.generateContent(prompt);
        const remark = result.response.text();

        res.json({
            score: finalScore,
            remark,
            metrics: {
                totalTasksAssigned: userTaskMetrics.totalTasks,
                tasksCompleted: userTaskMetrics.completedTasks,
                completionRatePercentage: Math.round(completionRate * 100),
                onTimeCompletionPercentage: Math.round(onTimeRate * 100),
                overdueTasks: userTaskMetrics.overdueTasks,
                userValuePerHour: userValuePerHour.toFixed(2),
                teamAverageValuePerHour: teamAverageValuePerHour.toFixed(2),
                totalHoursLogged: userTotalHours.toFixed(1)
            }
        });

    } catch (error) {
        console.error("Performance Evaluation Error:", error);
        res.status(500).json({ message: "Server error during performance evaluation." });
    }
};

module.exports = { getUserPerformance };