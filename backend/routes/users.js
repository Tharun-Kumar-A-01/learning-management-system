const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { protect, authorize } = require('../middleware/auth');

const Course = require('../models/course');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, Super Admin)
router.get('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const { role, search, status, courseId } = req.query;
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

        let users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        // If courseId is provided, mark users as enrolled or not
        if (courseId) {
            const course = await Course.findById(courseId);
            if (course) {
                const enrolledUserIds = course.enrollments.map(e => e.userId.toString());
                users = users.map(user => {
                    const userObj = user.toObject();
                    userObj.isEnrolled = enrolledUserIds.includes(user._id.toString());
                    return userObj;
                });
            }
        }

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

        // Get the user to check their role
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent admins from deactivating super_admins
        if (targetUser.role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admins can deactivate other Super Admin accounts'
            });
        }

        // Prevent users from deactivating themselves
        if (targetUser._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account from here'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @desc    Import users from CSV
// @route   POST /api/users/import
// @access  Private (Admin, Super Admin)
router.post('/import', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const { users } = req.body;

        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide users array' });
        }

        const results = {
            created: [],
            failed: []
        };

        for (const userData of users) {
            try {
                const { name, email, password, role = 'learner' } = userData;

                // Validate required fields
                if (!name || !email || !password) {
                    results.failed.push({ email: email || 'unknown', reason: 'Missing required fields' });
                    continue;
                }

                // Validate role permissions
                if (req.user.role === 'admin') {
                    if (role === 'admin' || role === 'super_admin') {
                        results.failed.push({ email, reason: 'Admins cannot create admin/super_admin users' });
                        continue;
                    }
                }

                if (role === 'super_admin' && req.user.role !== 'super_admin') {
                    results.failed.push({ email, reason: 'Only Super Admins can create super_admin users' });
                    continue;
                }

                // Check if user exists
                const userExists = await User.findOne({ email });
                if (userExists) {
                    results.failed.push({ email, reason: 'User already exists' });
                    continue;
                }

                // Create user
                const user = await User.create({
                    name,
                    email,
                    password,
                    role,
                    organizationId: req.user.organizationId,
                    createdByAdmin: req.user.id
                });

                results.created.push({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                });
            } catch (err) {
                results.failed.push({ email: userData.email || 'unknown', reason: err.message });
            }
        }

        res.status(200).json({
            success: true,
            data: results,
            message: `Created ${results.created.length} users, ${results.failed.length} failed`
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

