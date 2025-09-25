const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // The user who will receive the notification
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // The user who performed the action (optional)
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    // The notification message
    message: {
        type: String,
        required: true,
    },
    // A link to navigate to when the notification is clicked
    link: { 
        type: String,
        required: true,
    },
    // A flag to track if the notification has been read
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);