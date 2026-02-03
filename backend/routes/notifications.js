const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');
const User = require('../models/user');
const { protect } = require('../middleware/auth');
const { sendNotificationEmail } = require('../utils/emailService');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { unreadOnly, type, limit = 50 } = req.query;

        let query = { recipient: req.user.id };

        if (unreadOnly === 'true') {
            query.read = false;
        }

        if (type) {
            query.type = type;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const unreadCount = await Notification.countDocuments({
            recipient: req.user.id,
            read: false
        });

        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get unread notification count
// @route   GET /api/notifications/count
// @access  Private
router.get('/count', protect, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user.id,
            read: false
        });

        res.status(200).json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, data: notification });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, read: false },
            { read: true }
        );

        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Helper function to create and send notification
// emailData is optional extra data for specific email types (e.g., courseName, deadline for enrollment/deadline emails)
const createNotification = async (recipientId, type, title, message, link = null, emailData = null) => {
    try {
        // Create in-app notification
        const notification = await Notification.create({
            recipient: recipientId,
            type,
            title,
            message,
            link
        });

        // Try to send email notification
        const user = await User.findById(recipientId);
        if (user && user.emailAlertsEnabled) {
            // Use emailData if provided, otherwise fallback to title/message
            const data = emailData || { title, message };
            const emailSent = await sendNotificationEmail(user, type, data);
            if (emailSent) {
                notification.emailSent = true;
                await notification.save();
            }
        }

        return notification;
    } catch (err) {
        console.error('Create notification error:', err);
        return null;
    }
};

// Export helper for use in other routes
module.exports = router;
module.exports.createNotification = createNotification;
