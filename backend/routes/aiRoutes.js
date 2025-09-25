// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { parseAndCreateTask } = require('../controllers/aiController');
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// @route   POST /api/ai/create-task
// @desc    Create a task from natural language text
// @access  Private/Admin
router.post('/create-task', protect, adminOnly, parseAndCreateTask);

module.exports = router;