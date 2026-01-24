const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Super Admin)
router.get('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const { role, search, status } = req.query;
        let query = {};

        // Filter by role
        if (role) {
            query.role = role;
        }

        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by organization for admins
        if (req.user.role === 'admin' && req.user.organizationId) {
            query.organizationId = req.user.organizationId;
        }

        // Filter out super_admin users for regular admins
        if (req.user.role === 'admin') {
            query.role = query.role ? query.role : { $ne: 'super_admin' };
            if (query.role === 'super_admin') {
                // Admin trying to filter by super_admin, return empty
                return res.status(200).json({ success: true, data: [] });
            }
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin, Super Admin)
router.get('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Create user (admin-created)
// @route   POST /api/users
// @access  Private (Admin, Super Admin)
router.post('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Role-based creation validation
        // Super admins can create: admin, trainer, learner
        // Admins can create: trainer, learner only
        if (req.user.role === 'admin') {
            if (role === 'admin' || role === 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admins can only create trainers and learners'
                });
            }
        }

        // Only super_admin can create super_admin
        if (role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admins can create super_admin users'
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role,
            organizationId: req.user.organizationId
        });

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({ success: true, data: userResponse });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin, Super Admin)
router.put('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const { name, email, role, isActive } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent super_admin role changes by non-super_admins
        if (role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admins can assign super_admin role'
            });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;
        if (typeof isActive === 'boolean') {
            user.isActive = isActive;
        }

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({ success: true, data: userResponse });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Super Admin only)
router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
        }

        // Prevent admins from deleting super_admins
        if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admins can delete super_admin users'
            });
        }

        await user.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Activate/Deactivate user
// @route   PUT /api/users/:id/status
// @access  Private (Admin, Super Admin)
router.put('/:id/status', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
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

module.exports = router;
