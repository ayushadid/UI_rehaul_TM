// models/TimeLog.js
const mongoose = require("mongoose");

const TimeLogSchema = new mongoose.Schema(
    {
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
            default: Date.now, // Automatically set when created
        },
        endTime: {
            type: Date,
            default: null, // Null if the timer is still running
        },
        duration: {
            type: Number, // Duration in milliseconds, calculated when endTime is set
            default: 0,
        },
    },
    { timestamps: true } // Adds createdAt and updatedAt to the document
);

// Optional: Add an index for faster lookups by task and user
TimeLogSchema.index({ task: 1, user: 1 });

module.exports = mongoose.model("TimeLog", TimeLogSchema);