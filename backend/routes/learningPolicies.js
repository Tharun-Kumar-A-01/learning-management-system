const express = require('express');
const router = express.Router();
const LearningPolicy = require('../models/learningPolicy');
const { protect, authorize } = require('../middleware/auth');

// Default policies to seed if none exist
const DEFAULT_POLICIES = [
    {
        name: 'Course Completion Deadline',
        description: 'Days allowed to complete a course after enrollment',
        value: '30',
        type: 'number',
        enabled: true
    },
    {
        name: 'Passing Score',
        description: 'Minimum score required to pass assessments',
        value: '70',
        type: 'number',
        enabled: true
    },
    {
        name: 'Certificate Auto-Generation',
        description: 'Automatically generate certificates on course completion',
        value: 'true',
        type: 'boolean',
        enabled: true
    },
    {
        name: 'Allow Course Retakes',
        description: 'Allow learners to retake completed courses',
        value: 'true',
        type: 'boolean',
        enabled: true
    },
    {
        name: 'Max Quiz Attempts',
        description: 'Maximum attempts allowed for quizzes',
        value: '3',
        type: 'number',
        enabled: true
    },
    {
        name: 'Mandatory Course Order',
        description: 'Learners must complete lessons in sequential order',
        value: 'false',
        type: 'boolean',
        enabled: true
    },
    {
        name: 'Email Notifications',
        description: 'Send email notifications for enrollment and completion events',
        value: 'true',
        type: 'boolean',
        enabled: true
    },
    {
        name: 'Show Progress Percentage',
        description: 'Display progress percentage on course cards and dashboard',
        value: 'true',
        type: 'boolean',
        enabled: true
    },
    {
        name: 'Minimum Lesson Time',
        description: 'Minimum seconds a learner must spend on each lesson',
        value: '30',
        type: 'number',
        enabled: false
    },
    {
        name: 'Allow Course Reviews',
        description: 'Allow learners to leave reviews and ratings on courses',
        value: 'true',
        type: 'boolean',
        enabled: true
    },
    {
        name: 'User Registration Disabled',
        description: 'Disable new user registrations on the platform',
        value: 'false',
        type: 'boolean',
        enabled: true
    },
    {
        name: 'Minimum Quiz Pass Percentage',
        description: 'Minimum passing percentage that can be set for quizzes',
        value: '50',
        type: 'number',
        enabled: true
    }
];

// @desc    Get all learning policies
// @route   GET /api/learning-policies
// @access  Private (All authenticated users)
router.get('/', protect, async (req, res) => {
    try {
        let policies = await LearningPolicy.find().sort({ name: 1 });

        // Seed default policies if none exist
        if (policies.length === 0) {
            await LearningPolicy.insertMany(DEFAULT_POLICIES);
            policies = await LearningPolicy.find().sort({ name: 1 });
        }

        res.status(200).json({ success: true, data: policies });
    } catch (err) {
        console.error('Get learning policies error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Update all learning policies
// @route   PUT /api/learning-policies
// @access  Private (Super Admin only)
router.put('/', protect, authorize('super_admin'), async (req, res) => {
    try {
        const { policies } = req.body;

        if (!policies || !Array.isArray(policies)) {
            return res.status(400).json({ success: false, message: 'Please provide policies array' });
        }

        // Update each policy
        const updatePromises = policies.map(async (policy) => {
            return LearningPolicy.findByIdAndUpdate(
                policy._id,
                {
                    value: policy.value,
                    enabled: policy.enabled,
                    updatedBy: req.user.id,
                    updatedAt: new Date()
                },
                { new: true }
            );
        });

        await Promise.all(updatePromises);

        const updatedPolicies = await LearningPolicy.find().sort({ name: 1 });

        res.status(200).json({ success: true, data: updatedPolicies });
    } catch (err) {
        console.error('Update learning policies error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
