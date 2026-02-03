const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { protect } = require('../middleware/auth');

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
router.put('/', protect, async (req, res) => {
    try {
        const { name, profilePhoto, emailAlertsEnabled } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
        if (typeof emailAlertsEnabled === 'boolean') updateData.emailAlertsEnabled = emailAlertsEnabled;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Self-deactivate account (only for self-registered users)
// @route   POST /api/profile/deactivate
// @access  Private
router.post('/deactivate', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Only allow self-deactivation for users who registered themselves
        if (user.createdByAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Accounts created by administrators cannot be self-deactivated. Please contact an administrator.'
            });
        }

        user.isActive = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Your account has been deactivated. You will be logged out.'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Update password
// @route   PUT /api/profile/password
// @access  Private
router.put('/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
