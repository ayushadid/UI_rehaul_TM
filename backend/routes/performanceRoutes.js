const express = require('express');
const router = express.Router();
const { getUserPerformance } = require('../controllers/performanceController'); // Reference the new controller
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// @route   GET /api/performance/evaluate/:userId
// @desc    Get a performance evaluation for a user
// @access  Private/Admin
router.get('/evaluate/:userId', protect, adminOnly, getUserPerformance);

module.exports = router;