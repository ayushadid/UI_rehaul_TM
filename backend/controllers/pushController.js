const webpush = require('web-push');
const User = require('../models/User');

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your contact email
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// @desc    Subscribe a user to push notifications
// @route   POST /api/push/subscribe
// @access  Private
const subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        
        // Save the subscription to the current user's document
        await User.findByIdAndUpdate(req.user._id, {
            $set: { pushSubscription: subscription }
        });

        res.status(201).json({ message: 'Subscription saved.' });
    } catch (error) {
        console.error("Subscription error:", error);
        res.status(500).json({ message: 'Server error while saving subscription.' });
    }
};

module.exports = { subscribe };