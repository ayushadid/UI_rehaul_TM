const Notification = require('../models/Notification');

// @desc    Get all notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate('sender', 'name profileImageUrl')
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Mark all of the user's notifications as read
// @route   PUT /api/notifications/read
// @access  Private
const markNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { $set: { read: true } }
        );
        res.status(200).json({ message: "All notifications marked as read." });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc Mark a single notification as read
// @route PUT /api/notifications/:id/read
// @access Private
const markOneNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        // --- START: Corrected Security Check ---
        // This check ensures the notification exists AND belongs to the user making the request.
        if (!notification || notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Notification not found or you are not authorized." });
        }
        // --- END: Corrected Security Check ---

        notification.read = true;
        await notification.save();
        res.status(200).json(notification);
    } catch (error) {
        console.error("Error marking one notification as read:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getNotifications, markNotificationsAsRead, markOneNotificationAsRead };