const express = require('express');
const router = express.Router();
const User = require('../models/user');
const LearningPolicy = require('../models/learningPolicy');
const { protect } = require('../middleware/auth');
const passwordResetRoutes = require('./passwordReset');

// Mount password reset routes
router.use('/', passwordResetRoutes);

// @desc    Register user (public - learner only)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if registration is disabled
        const registrationPolicy = await LearningPolicy.findOne({ name: 'User Registration Disabled' });
        if (registrationPolicy && registrationPolicy.enabled && registrationPolicy.value === 'true') {
            return res.status(403).json({
                success: false,
                message: 'New user registrations are currently disabled. Please contact an administrator.',
                registrationDisabled: true
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Public registration is only for learners
        const user = await User.create({
            name,
            email,
            password,
            role: 'learner'
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Create user with role (admin/super_admin only)
// @route   POST /api/auth/create-user
// @access  Private (super_admin can create admin/trainer, admin can create trainer)
router.post('/create-user', protect, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const creatorRole = req.user.role;

        // Validate role creation permissions
        if (creatorRole === 'super_admin') {
            // Super admin can create admin, trainer, and learner
            if (!['admin', 'trainer', 'learner'].includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid role specified' });
            }
        } else if (creatorRole === 'admin') {
            // Admin can only create trainer and learner
            if (!['trainer', 'learner'].includes(role)) {
                return res.status(403).json({ success: false, message: 'Admins can only create trainers and learners' });
            }
        } else {
            return res.status(403).json({ success: false, message: 'Not authorized to create users' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create user with specified role and mark as admin-created
        const user = await User.create({
            name,
            email,
            password,
            role,
            organizationId: req.user.organizationId,
            createdByAdmin: req.user.id
        });

        res.status(201).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if user account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact an administrator.',
                accountDeactivated: true
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
        ),
        httpOnly: true
    };

    res
        .status(statusCode)
        // .cookie('token', token, options) // Optional: Use cookies if preferred
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
};

module.exports = router;
