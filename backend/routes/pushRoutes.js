const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/pushController');
const { protect } = require("../middlewares/authMiddleware");
router.route('/subscribe').post(protect, subscribe);

module.exports = router;