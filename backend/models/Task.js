const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, required: true },
});

const remarkSchema = new mongoose.Schema({
    text: { type: String, required: true },
    madeBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});

const commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    madeBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});

// --- NEW: Sub-schema for logging revision requests ---
const revisionLogSchema = new mongoose.Schema({
    comment: { type: String, required: true },
    madeBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});

const TaskSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // --- START: MODIFIED Review System Fields ---
    reviewers: [{ // Changed from 'reviewer' to 'reviewers' and is now an array
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    reviewStatus: {
        type: String,
        enum: ['NotSubmitted', 'PendingReview', 'PendingFinalApproval', 'Approved', 'ChangesRequested'],
        default: 'NotSubmitted'
    },
    revisionCount: { // NEW: To count how many times changes are requested
        type: Number,
        default: 0
    },
    revisionHistory: [revisionLogSchema], // NEW: A log for revision comments
    // --- END: MODIFIED Review System Fields ---

    startDate: { type: Date },
    dueDate: { type: Date, required: true },
    estimatedHours: { type: Number, default: 0 },
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    
    attachments: [{ type: String }],
    todoChecklist: [todoSchema],
    progress: { type: Number, default: 0 },
    remarks: [remarkSchema],
    comments: [commentSchema],
}, { timestamps: true });


module.exports = mongoose.model("Task", TaskSchema);