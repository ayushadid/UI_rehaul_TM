const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * @desc    Create a new announcement
 * @route   POST /api/announcements
 * @access  Private (Admin Only)
 */
const createAnnouncement = async (req, res) => {
    try {
        const { title, content, recipientIds, isBroadcast } = req.body;
        const senderId = req.user._id;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required." });
        }

        let finalRecipients = [];
        if (isBroadcast) {
            // If it's a broadcast, get all users except the admin sending it
            const allUsers = await User.find({ _id: { $ne: senderId } }).select('_id');
            finalRecipients = allUsers.map(user => user._id);
        } else {
            finalRecipients = recipientIds || [];
        }
        
        // Create the announcement
        const announcement = await Announcement.create({
            title,
            content,
            sender: senderId,
            recipients: finalRecipients,
            isBroadcast
        });

        // Get socket data from the request object (provided by our middleware)
        const { io, userSocketMap } = req;

        // Create notifications and send socket events
        for (const userId of finalRecipients) {
            const newNotification = await Notification.create({
                recipient: userId,
                sender: senderId,
                message: `New announcement from ${req.user.name}: "${title}"`,
                link: `/announcements/${announcement._id}`, // This will be our future frontend route
            });

            const populatedNotification = await Notification.findById(newNotification._id).populate('sender', 'name profileImageUrl');
            const socketId = userSocketMap[userId.toString()];
            if (socketId) {
                io.to(socketId).emit("notification", populatedNotification);
            }
        }

        res.status(201).json(announcement);

    } catch (error) {
        console.error("Error creating announcement:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const getAnnouncementById = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id).populate('sender', 'name');
        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found." });
        }
        res.json(announcement);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { createAnnouncement, getAnnouncementById };

