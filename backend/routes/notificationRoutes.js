const express = require('express');
const router = express.Router();
const { getNotifications, markNotificationsAsRead,markOneNotificationAsRead } = require('../controllers/notificationController');
const { protect } = require("../middlewares/authMiddleware");

router.route('/').get(protect, getNotifications);
router.route('/read').put(protect, markNotificationsAsRead);
router.route('/:id/read').put(protect, markOneNotificationAsRead);

module.exports = router;